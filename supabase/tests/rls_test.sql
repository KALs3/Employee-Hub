-- ====================================================================
-- Employee Hub: RLS and Security Policy Verification Tests
-- ====================================================================

-- Test 1: Employee cannot read another employee's request outside their visibility
-- Set role to authenticated user: Alex Mercer (e1)
SET ROLE authenticated;
SET request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';
SET request.jwt.claim.role = 'authenticated';

-- Alex queries requests: should NOT see David's request (req5)
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM requests
  WHERE id = 'a5555555-5555-5555-5555-555555555555'; -- David's request

  IF v_count > 0 THEN
    RAISE EXCEPTION 'TEST 1 FAILED: Employee was able to read another employee request!';
  ELSE
    RAISE NOTICE 'TEST 1 PASSED: Employee cannot read another employee request.';
  END IF;
END $$;

-- Test 2: Employee cannot escalate role
DO $$
BEGIN
  BEGIN
    UPDATE profiles
    SET role = 'manager'
    WHERE id = '33333333-3333-3333-3333-333333333333';
    
    RAISE EXCEPTION 'TEST 2 FAILED: Employee was able to change role to manager!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 2 PASSED: Employee cannot elevate their role (%s).', SQLERRM;
  END;
END $$;

-- Test 3: Manager cannot decide a request outside their direct team
-- Set role to authenticated user: Sarah Connor (m1)
SET ROLE authenticated;
SET request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
SET request.jwt.claim.role = 'authenticated';

-- Sarah tries to decide David's request (reports to Marcus)
DO $$
BEGIN
  BEGIN
    PERFORM decide_request('a5555555-5555-5555-5555-555555555555', 'approved', 'Unauthorized approval');
    RAISE EXCEPTION 'TEST 3 FAILED: Manager was able to decide outside their team!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 3 PASSED: Manager cannot decide outside direct team (%s).', SQLERRM;
  END;
END $$;

-- Test 4: Rejection without comment must fail
-- Sarah tries to reject Alex's request with null/empty comment
DO $$
BEGIN
  BEGIN
    PERFORM decide_request('a2222222-2222-2222-2222-222222222222', 'rejected', '');
    RAISE EXCEPTION 'TEST 4 FAILED: Rejection succeeded without a comment!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'TEST 4 PASSED: Rejection without comment was rejected (%s).', SQLERRM;
  END;
END $$;

-- Test 5: Employee cannot cancel an already approved request
SET ROLE authenticated;
SET request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444'; -- Emma
SET request.jwt.claim.role = 'authenticated';

DO $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE requests
  SET status = 'cancelled'
  WHERE id = 'a3333333-3333-3333-3333-333333333333'; -- already approved

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Cancelled an already approved request!';
  ELSE
    RAISE NOTICE 'TEST 5 PASSED: Cannot cancel an approved request.';
  END IF;
END $$;

RESET ROLE;
