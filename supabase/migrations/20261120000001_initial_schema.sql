-- ====================================================================
-- Employee Hub: Initial Schema Migration
-- ====================================================================

-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('employee', 'manager');
CREATE TYPE request_type AS ENUM ('leave', 'equipment', 'it_support');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- 2. Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  department TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expo_push_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Requests Table
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type request_type NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  description TEXT,
  start_date DATE,
  end_date DATE,
  status request_status NOT NULL DEFAULT 'pending',
  manager_comment TEXT,
  decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_request_dates CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  )
);

-- 4. Request Events Table (Audit / Timeline)
CREATE TABLE request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created' | 'approved' | 'rejected' | 'cancelled'
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Indexes
CREATE INDEX idx_requests_employee_created ON requests (employee_id, created_at DESC);
CREATE INDEX idx_requests_status_created ON requests (status, created_at ASC);
CREATE INDEX idx_profiles_manager ON profiles (manager_id);
CREATE INDEX idx_request_events_request ON request_events (request_id, created_at ASC);

-- ====================================================================
-- Triggers for Request Lifecycle Events
-- ====================================================================

-- Automatically create 'created' event when request is inserted
CREATE OR REPLACE FUNCTION trg_on_request_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO request_events (request_id, actor_id, action, note)
  VALUES (NEW.id, NEW.employee_id, 'created', 'Request submitted');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_request_created
  AFTER INSERT ON requests
  FOR EACH ROW
  EXECUTE FUNCTION trg_on_request_created();

-- Automatically create 'cancelled' event when request is cancelled
CREATE OR REPLACE FUNCTION trg_on_request_cancelled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
    INSERT INTO request_events (request_id, actor_id, action, note)
    VALUES (NEW.id, auth.uid(), 'cancelled', 'Request cancelled by employee');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_request_cancelled
  AFTER UPDATE OF status ON requests
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'cancelled')
  EXECUTE FUNCTION trg_on_request_cancelled();

-- Prevent users from modifying protected profile fields directly
CREATE OR REPLACE FUNCTION trg_protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If invoked by normal authenticated user, forbid changing role or manager_id
  IF auth.role() = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Changing profile role is not permitted.';
    END IF;
    IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
      RAISE EXCEPTION 'Changing profile manager_id is not permitted.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_protect_profile_fields();

-- ====================================================================
-- Row Level Security (RLS)
-- ====================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_events ENABLE ROW LEVEL SECURITY;

-- ---------------- profiles policies ----------------
-- User can read own profile, their manager's profile, or their direct reports' profiles
CREATE POLICY "profiles_select_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR id = (SELECT manager_id FROM profiles WHERE id = auth.uid())
    OR manager_id = auth.uid()
  );

-- Users can update only their own profile (role/manager_id protected by trigger)
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------- requests policies ----------------
-- Employee can read own requests; Manager can read requests of direct reports
CREATE POLICY "requests_select_policy"
  ON requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid()
    OR employee_id IN (
      SELECT p.id FROM profiles p WHERE p.manager_id = auth.uid()
    )
  );

-- Employee can only insert own requests with status = 'pending'
CREATE POLICY "requests_insert_policy"
  ON requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id = auth.uid()
    AND status = 'pending'
  );

-- Employee can cancel only their own pending requests
CREATE POLICY "requests_employee_cancel"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (
    employee_id = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    employee_id = auth.uid()
    AND status = 'cancelled'
  );

-- ---------------- request_events policies ----------------
-- Readable if the user can read the parent request
CREATE POLICY "request_events_select_policy"
  ON request_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests r
      WHERE r.id = request_events.request_id
        AND (
          r.employee_id = auth.uid()
          OR r.employee_id IN (
            SELECT p.id FROM profiles p WHERE p.manager_id = auth.uid()
          )
        )
    )
  );

-- No direct INSERT / UPDATE / DELETE on request_events for authenticated clients
-- (Only DB triggers and security definer functions write to request_events)

-- ====================================================================
-- Transactional Decision Function: decide_request
-- ====================================================================

CREATE OR REPLACE FUNCTION decide_request(
  p_request_id UUID,
  p_decision request_status,
  p_comment TEXT DEFAULT NULL
)
RETURNS requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request requests;
  v_employee_manager_id UUID;
  v_caller_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify decision parameter
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  -- Rejection requires a comment
  IF p_decision = 'rejected' AND (p_comment IS NULL OR trim(p_comment) = '') THEN
    RAISE EXCEPTION 'Rejection requires a comment';
  END IF;

  -- Fetch the request with lock for update
  SELECT * INTO v_request
  FROM requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  -- Verify request is still pending
  IF v_request.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is already % and cannot be decided', v_request.status;
  END IF;

  -- Verify caller is the manager of the employee who made the request
  SELECT manager_id INTO v_employee_manager_id
  FROM profiles
  WHERE id = v_request.employee_id;

  IF v_employee_manager_id IS NULL OR v_employee_manager_id <> v_caller_id THEN
    RAISE EXCEPTION 'Only direct manager can decide this request';
  END IF;

  -- Update request
  UPDATE requests
  SET
    status = p_decision,
    manager_comment = p_comment,
    decided_by = v_caller_id,
    decided_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  -- Insert event record
  INSERT INTO request_events (request_id, actor_id, action, note)
  VALUES (
    p_request_id,
    v_caller_id,
    p_decision::text,
    p_comment
  );

  RETURN v_request;
END;
$$;
