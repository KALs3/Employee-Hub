# Employee Hub: Project Spec

A B2E (business-to-employee) mobile app built with React Native (Expo) and Supabase, 

## 1. Overview

**What it is:** A mobile app where employees submit internal requests (leave, equipment, IT support) and managers approve or reject them, with live status tracking and push notifications.

**Why this project:** It mirrors the Mobile Application Development Specialist role: an internal (B2E) app that optimizes a business process, with role-based access, quality standards, and clean code. It also reuses your strengths (TypeScript, React, Supabase, security thinking), so you spend time on mobile skills instead of learning a new stack.

**Goal for the application:** A public GitHub repo with a strong README, a demo video, and an installable build or Expo link that a recruiter can try in under a minute.

## 2. Goals and Non-Goals

**Goals**

- Ship a complete, polished MVP rather than a large, unfinished app.
- Demonstrate real mobile skills: navigation, forms, lists, auth, notifications, loading and error states.
- Demonstrate engineering quality: TypeScript strictness, tests, folder structure, linting, CI.
- Demonstrate security awareness: Row Level Security (RLS), role enforcement on the server, no secrets in the client.

**Non-Goals (do not build these)**

- Multi-level approval chains, delegation, or reporting dashboards
- Admin panel or user management UI (seed users with a script)
- File attachments, chat, or comments threads
- iOS App Store or Play Store release
- Offline-first sync (mention it as future work)

## 3. Users and Roles

| Role | Can do |
| --- | --- |
| Employee | Create requests, view own requests, cancel own pending requests, receive status notifications |
| Manager | Everything an employee can do, plus view pending requests from direct reports and approve or reject them with a comment |

Each employee has one manager (`manager_id`). Managers only see requests from their direct reports.

## 4. Features and Acceptance Criteria

### F1. Authentication

- Email and password login via Supabase Auth.
- Session persists across app restarts (secure storage).
- Logout clears the session and push token.
- **Done when:** a seeded employee and a seeded manager can log in, and the app shows the correct home screen for each role.

### F2. Create a request (Employee)

- Fields: type (leave, equipment, IT support), title, description, and start and end dates (leave only).
- Client-side validation (required fields, end date not before start date).
- Submit shows a loading state, then a success message, then navigates to the request detail.
- **Done when:** a valid request is stored with status `pending`, and invalid input shows clear inline errors.

### F3. My requests (Employee)

- List of own requests, newest first, with status badges (pending, approved, rejected, cancelled).
- Filter by status.
- Pull to refresh, empty state, error state with retry.
- **Done when:** the list matches the database and never shows another employee's data.

### F4. Request detail

- Shows all fields, current status, manager comment (if any), and an event timeline (created, decided, cancelled).
- Employee can cancel while status is `pending`.
- **Done when:** cancelling updates the status and timeline immediately and cannot be done after a decision.

### F5. Pending approvals (Manager)

- List of pending requests from direct reports, oldest first.
- Detail view with Approve and Reject buttons and a comment field (comment required for rejection).
- **Done when:** a decision updates the status, records who decided and when, and removes the item from the pending list.

### F6. Push notifications

- Employee is notified when their request is approved or rejected.
- Manager is notified when a new request arrives from a direct report.
- Tapping a notification opens the matching request detail.
- **Note:** remote push does not work in Expo Go on Android; use an EAS development build. If time runs short, fall back to an in-app notification list and mark push as a stretch goal.

### F7. Profile

- Shows name, department, role, and manager name. Logout button.

### Stretch goals (only if everything above is done)

- Dark mode
- Arabic and English with RTL support
- Biometric unlock
- Request statistics for managers

## 5. Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | React Native with Expo (SDK current stable), TypeScript strict | Fast iteration, you already know React and TypeScript |
| Navigation | Expo Router | File-based routing, simple role-based layouts |
| Data fetching | TanStack Query | Caching, loading and error states, refetch on focus |
| Forms | React Hook Form with Zod | Typed validation shared with API types |
| Backend | Supabase (Postgres, Auth, RLS, Edge Functions) | No server to maintain, security enforced in the database |
| Push | Expo Notifications with the Expo push service | Simplest path to real notifications |
| Testing | Jest and React Native Testing Library; one E2E smoke flow if time allows | Shows quality focus |
| Quality | ESLint, Prettier, GitHub Actions (lint, typecheck, test) | Matches the "code quality and standards" requirement |
| Builds | EAS Build (Android APK) | Gives recruiters an installable file |

## 6. Architecture

1. The app talks to Supabase directly with the public anon key. **No service-role key ever ships in the app.**
2. Security is enforced by RLS policies and database functions, not by hiding buttons in the UI.
3. Approving or rejecting goes through a single Postgres function (`decide_request`) so a manager can change only the decision fields.
4. A database webhook (or trigger plus Edge Function) calls the Expo push API when a request is created or decided.

```
Mobile app (Expo)  -->  Supabase Auth (JWT)
        |
        +--> Postgres (RLS policies, decide_request function)
                    |
                    +--> Webhook / Edge Function --> Expo Push --> Device
```

## 7. Data Model

```sql
create type user_role as enum ('employee', 'manager');
create type request_type as enum ('leave', 'equipment', 'it_support');
create type request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  department text,
  role user_role not null default 'employee',
  manager_id uuid references profiles(id),
  expo_push_token text,
  created_at timestamptz not null default now()
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references profiles(id),
  type request_type not null,
  title text not null check (char_length(title) between 3 and 120),
  description text,
  start_date date,
  end_date date,
  status request_status not null default 'pending',
  manager_comment text,
  decided_by uuid references profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  actor_id uuid not null references profiles(id),
  action text not null,   -- created | approved | rejected | cancelled
  note text,
  created_at timestamptz not null default now()
);

create index on requests (employee_id, created_at desc);
create index on requests (status, created_at);
```

## 8. Security Rules (RLS)

Enable RLS on all three tables. Policies to write:

- **profiles:** a user can read their own profile and their manager's name; users can update only `expo_push_token` and `full_name` on their own row. **Users must not be able to change `role` or `manager_id`.**
- **requests, select:** the employee can read their own rows; a manager can read rows where the employee's `manager_id` equals the manager's id.
- **requests, insert:** allowed only when `employee_id = auth.uid()` and `status = 'pending'`.
- **requests, update:** employees may only cancel their own `pending` requests. Managers decide only through `decide_request`.
- **request\_events:** readable by whoever can read the parent request; written by database functions or triggers only.
- **decide\_request(request\_id, decision, comment):** `security definer` function that checks the caller is the employee's manager, the request is still `pending`, and a comment exists for rejections, then updates the row and writes the event in one transaction.

Write at least two tests that prove the policies work: an employee cannot read another employee's request, and a manager cannot decide a request from outside their team.

## 9. Screens

| Screen | Role | Purpose |
| --- | --- | --- |
| Login | All | Email and password |
| My Requests (tab) | All | List and filter own requests |
| New Request (tab) | All | Create form |
| Request Detail | All | Details, timeline, cancel |
| Approvals (tab) | Manager | Pending list from direct reports |
| Decision Sheet | Manager | Approve or reject with comment |
| Profile (tab) | All | Info and logout |

## 10. Suggested Project Structure

```
employee-hub/
  app/                 # Expo Router routes
    (auth)/login.tsx
    (tabs)/index.tsx   # My Requests
    (tabs)/new.tsx
    (tabs)/approvals.tsx
    (tabs)/profile.tsx
    request/[id].tsx
  src/
    api/               # Supabase queries (typed)
    components/
    hooks/             # TanStack Query hooks
    lib/               # supabase client, notifications, validation schemas
    types/
  supabase/
    migrations/        # SQL schema and RLS
    seed.sql           # demo employees and manager
    functions/         # push notification Edge Function
  .github/workflows/ci.yml
  README.md
```

## 11. Quality Standards

- TypeScript strict mode; no `any` without a comment explaining why.
- Every screen handles three states: loading, empty, error.
- Secrets in environment variables; `.env` is gitignored and `.env.example` is committed.
- Meaningful commit messages and small commits. Recruiters do read commit history.
- CI runs lint, typecheck, and tests on every push.
- At least 8 to 10 meaningful tests: validation schemas, status-badge logic, one or two hook tests, and the RLS tests.




## 13. Definition of Done

- [ ] Both roles work end to end on a real device
- [ ] RLS verified with tests
- [ ] No secrets committed; `.env.example` present
- [ ] CI passing
- [ ] README complete (see below)
- [ ] Demo video recorded and linked
- [ ] APK or Expo link available
- [ ] Repo public and pinned on GitHub
- [ ] CV updated with the project and link

## 14. README Checklist

1. One-line description and screenshots or a GIF at the top
2. Demo video link and install link (APK or Expo)
3. Demo accounts (one employee, one manager)
4. Features list
5. Architecture diagram and a short "why these choices" section
6. Security model: RLS, `decide_request`, no service key in the client
7. How to run locally (5 commands or fewer)
8. Testing and CI notes
9. Known limitations and future work (offline sync, localization, admin panel, Flutter or native comparison)

## 15. Demo Video Script (about 75 seconds)

1. Log in as an employee and create a leave request (15 s).
2. Show it in the list as pending (5 s).
3. Switch to the manager account on a second device or after logout; the push notification arrives (15 s).
4. Open the approvals list, reject one with a comment and approve another (20 s).
5. Switch back to the employee; the push notification appears and the status and timeline are updated (15 s).
6. Close with a quick flash of the repo, CI badge, and RLS tests (5 s).

## 16. CV Bullets (fill in once built)

- Built **Employee Hub**, a React Native (Expo, TypeScript) B2E app for submitting and approving internal requests, with role-based access enforced by Supabase Row Level Security.
- Implemented push notifications for request lifecycle events and a transactional approval function to keep decisions consistent and auditable.
- Set up CI (lint, typecheck, tests) and shipped an installable Android build with documentation and a demo video.

## 17. Interview Talking Points

- **Why RLS and a database function?** The client is untrusted. Hiding a button is not security, so the database enforces who can read and decide.
- **Why React Native with Expo?** You already know React and TypeScript, so you could ship a complete, tested app in under two weeks. You are ready to learn Flutter or native Kotlin and Swift as the team needs.
- **What would you do next?** Offline-first sync, SSO with the company identity provider, localization with RTL, analytics for managers, and an admin console.
- **A problem you solved:** pick one real bug from the build (for example, push notifications not firing in Expo Go, or a policy that accidentally leaked rows) and explain how you found and fixed it.

## 18. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Push notifications eat too much time | Timebox to one day; fall back to in-app notifications and note push as future work |
| RLS policy bugs leak data | Write the RLS tests first; test with two employees and two managers |
| Scope creep | Anything not in sections 4 or 13 goes on a "later" list |
| Build or device issues | Test on a real Android device by Nov 24; keep an emulator as a backup |
| Running out of time | Apply by Dec 1 with Masareefy; add the repo link to your portfolio as soon as it is ready |
