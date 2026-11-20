-- ====================================================================
-- Employee Hub: Fix Infinite Recursion in RLS Policies
-- Run this in your Supabase SQL Editor to resolve the recursion error.
-- ====================================================================

-- 1. Create SECURITY DEFINER functions to query profiles without triggering RLS
CREATE OR REPLACE FUNCTION get_my_manager_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT manager_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_direct_report(emp_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = emp_id AND manager_id = auth.uid()
  );
$$;

-- 2. Replace profiles select policy
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR id = get_my_manager_id()
    OR manager_id = auth.uid()
  );

-- 3. Replace requests select policy
DROP POLICY IF EXISTS "requests_select_policy" ON requests;
CREATE POLICY "requests_select_policy"
  ON requests
  FOR SELECT
  TO authenticated
  USING (
    employee_id = auth.uid()
    OR is_direct_report(employee_id)
  );

-- 4. Replace request_events select policy
DROP POLICY IF EXISTS "request_events_select_policy" ON request_events;
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
          OR is_direct_report(r.employee_id)
        )
    )
  );
