-- ====================================================================
-- Employee Hub: Seed Data
-- Demo Users:
-- Manager 1: sarah.manager@company.com / Password123!
-- Manager 2: marcus.manager@company.com / Password123!
-- Employee 1: alex.employee@company.com / Password123! (Manager: Sarah)
-- Employee 2: emma.employee@company.com / Password123! (Manager: Sarah)
-- Employee 3: david.employee@company.com / Password123! (Manager: Marcus)
-- Employee 4: lisa.employee@company.com / Password123! (Manager: Marcus)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper UUIDs for predictable references
DO $$
DECLARE
  v_m1_id UUID := '11111111-1111-1111-1111-111111111111';
  v_m2_id UUID := '22222222-2222-2222-2222-222222222222';
  v_e1_id UUID := '33333333-3333-3333-3333-333333333333';
  v_e2_id UUID := '44444444-4444-4444-4444-444444444444';
  v_e3_id UUID := '55555555-5555-5555-5555-555555555555';
  v_e4_id UUID := '66666666-6666-6666-6666-666666666666';

  v_req1 UUID := 'a1111111-1111-1111-1111-111111111111';
  v_req2 UUID := 'a2222222-2222-2222-2222-222222222222';
  v_req3 UUID := 'a3333333-3333-3333-3333-333333333333';
  v_req4 UUID := 'a4444444-4444-4444-4444-444444444444';
  v_req5 UUID := 'a5555555-5555-5555-5555-555555555555';
  v_req6 UUID := 'a6666666-6666-6666-6666-666666666666';
BEGIN
  -- Insert auth users if not existing
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES
    (v_m1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarah.manager@company.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Connor"}', now(), now()),
    (v_m2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcus.manager@company.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Wright"}', now(), now()),
    (v_e1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alex.employee@company.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Mercer"}', now(), now()),
    (v_e2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'emma.employee@company.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Emma Watson"}', now(), now()),
    (v_e3_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david.employee@company.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Miller"}', now(), now()),
    (v_e4_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lisa.employee@company.com', crypt('Password123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Lisa Ray"}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert/update profiles
  INSERT INTO profiles (id, full_name, department, role, manager_id)
  VALUES
    (v_m1_id, 'Sarah Connor', 'Engineering', 'manager', NULL),
    (v_m2_id, 'Marcus Wright', 'Product', 'manager', NULL),
    (v_e1_id, 'Alex Mercer', 'Engineering', 'employee', v_m1_id),
    (v_e2_id, 'Emma Watson', 'Engineering', 'employee', v_m1_id),
    (v_e3_id, 'David Miller', 'Product', 'employee', v_m2_id),
    (v_e4_id, 'Lisa Ray', 'Product', 'employee', v_m2_id)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    department = EXCLUDED.department,
    role = EXCLUDED.role,
    manager_id = EXCLUDED.manager_id;

  -- Disable trigger temporarily while seeding requests to prevent duplicate events
  -- Insert sample requests
  INSERT INTO requests (id, employee_id, type, title, description, start_date, end_date, status, manager_comment, decided_by, decided_at, created_at)
  VALUES
    -- Alex's pending leave
    (v_req1, v_e1_id, 'leave', 'Annual Summer Vacation', 'Taking a week off to recharge with family.', '2026-12-01', '2026-12-08', 'pending', NULL, NULL, NULL, now() - interval '2 days'),
    -- Alex's pending equipment
    (v_req2, v_e1_id, 'equipment', 'Ergonomic Mechanical Keyboard', 'Keychron Q1 Pro for remote work setup.', NULL, NULL, 'pending', NULL, NULL, NULL, now() - interval '1 day'),
    -- Emma's approved leave
    (v_req3, v_e2_id, 'leave', 'Medical Leave for Dental Surgery', 'Dentist appointment and recovery.', '2026-11-25', '2026-11-26', 'approved', 'Get well soon, approved.', v_m1_id, now() - interval '3 hours', now() - interval '3 days'),
    -- Emma's rejected equipment
    (v_req4, v_e2_id, 'equipment', 'High-end VR Headset', 'Testing experimental VR applications.', NULL, NULL, 'rejected', 'Not in current team equipment budget.', v_m1_id, now() - interval '1 hour', now() - interval '4 days'),
    -- David's pending IT support (under Marcus)
    (v_req5, v_e3_id, 'it_support', 'VPN Access Issue on Mobile', 'Cannot connect to internal staging cluster from mobile.', NULL, NULL, 'pending', NULL, NULL, NULL, now() - interval '5 hours'),
    -- Alex's cancelled request
    (v_req6, v_e1_id, 'it_support', 'Docker License Request', 'Need Docker desktop license.', NULL, NULL, 'cancelled', NULL, NULL, NULL, now() - interval '5 days')
  ON CONFLICT (id) DO NOTHING;

  -- Ensure request events reflect timeline
  INSERT INTO request_events (request_id, actor_id, action, note, created_at)
  VALUES
    (v_req1, v_e1_id, 'created', 'Request submitted', now() - interval '2 days'),
    (v_req2, v_e1_id, 'created', 'Request submitted', now() - interval '1 day'),
    (v_req3, v_e2_id, 'created', 'Request submitted', now() - interval '3 days'),
    (v_req3, v_m1_id, 'approved', 'Get well soon, approved.', now() - interval '3 hours'),
    (v_req4, v_e2_id, 'created', 'Request submitted', now() - interval '4 days'),
    (v_req4, v_m1_id, 'rejected', 'Not in current team equipment budget.', now() - interval '1 hour'),
    (v_req5, v_e3_id, 'created', 'Request submitted', now() - interval '5 hours'),
    (v_req6, v_e1_id, 'created', 'Request submitted', now() - interval '5 days'),
    (v_req6, v_e1_id, 'cancelled', 'Request cancelled by employee', now() - interval '4 days')
  ON CONFLICT DO NOTHING;

END $$;
