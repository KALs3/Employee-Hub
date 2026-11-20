# Employee Hub

> A secure, role-based B2E mobile application built with React Native (Expo) and Supabase for internal request workflows (leave, equipment, IT support) with Row Level Security (RLS) and push notifications.

[![CI](https://github.com/your-org/employee-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/employee-hub/actions/workflows/ci.yml)
[![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-blue)](https://expo.dev)
[![TypeScript Strict](https://img.shields.io/badge/TypeScript-Strict-3178C6)](https://www.typescriptlang.org)
[![Supabase RLS](https://img.shields.io/badge/Security-RLS%20Enforced-green)](https://supabase.com)

---

## 📱 Recruiter Quick-Start & Demo Accounts

Try the app in under a minute with pre-seeded accounts:

| Role | Email | Password | What to Test |
| :--- | :--- | :--- | :--- |
| **Employee** | `alex.employee@company.com` | `Password123!` | Create leave/equipment requests, filter requests, cancel pending requests |
| **Manager** | `sarah.manager@company.com` | `Password123!` | Review pending requests from direct reports, approve or reject with comments |

*Note: The login screen also features quick 1-tap demo pills to auto-fill these credentials without typing on mobile keyboards.*

- **Demo Video:** [Watch 75-second Walkthrough](#) *(link your demo recording here)*
- **Installable Android Build:** [Download APK via EAS](#) *(or scan Expo QR code)*

---

## 🎯 Features

- **Role-Guarded Navigation (Expo Router):** Automatic routing between authentication and role-specific tab navigators (Employees see My Requests, New Request, Profile; Managers gain an additional Approvals tab).
- **Request Creation & Strict Validation:** Powered by React Hook Form & Zod with typed schemas. Conditional date-period validation for leave (end date $\ge$ start date).
- **Request Lifecycle & Audit Timeline:** Full history of events (`created`, `approved`, `rejected`, `cancelled`) with actor IDs, timestamps, and manager feedback.
- **Fast Search & Status Filters:** Filter by `Pending`, `Approved`, `Rejected`, or `Cancelled` with pull-to-refresh.
- **Transactional Approvals:** Atomic Postgres function `decide_request` guarantees decisions and audit logs execute in a single database transaction. Mandatory comments on rejections.
- **Three Core States on Every Screen:** Loading spinners, empty states with call-to-actions, and error states with retry capabilities.
- **Push Notification Pipeline:** Token registration on login, token cleanup on logout, background/foreground delivery via Expo Push API, and deep-linking directly into request details on tap.

---

## 🏛️ Architecture & Stack Choices

```
Mobile App (Expo / React Native)
  │
  ├──> Supabase Auth (JWT session with Expo SecureStore)
  │
  ├──> Postgres Database (Protected by RLS Policies)
  │     │
  │     ├──> Atomic RPC: decide_request()
  │     └──> Audit Events: request_events table
  │
  └──> Edge Function Webhook ──> Expo Push Service ──> Device Notifications
```

### Why These Choices?

| Layer | Choice | Rationale |
| :--- | :--- | :--- |
| **Mobile App** | React Native with Expo (SDK 58) | Rapid iteration, cross-platform performance, first-class TypeScript tooling. |
| **Routing** | Expo Router | Modern file-based routing with layouts, modal sheets, and deep-linking support. |
| **Data Fetching** | TanStack Query v5 | Server-state caching, automatic cache invalidation, and background refetching. |
| **Forms** | React Hook Form + Zod | Performance (uncontrolled inputs), unified validation shared across client and API. |
| **Backend & Auth** | Supabase (Postgres + RLS) | Zero server overhead while maintaining strict relational integrity and server-side authorization. |
| **Security** | Row Level Security (RLS) | Untrusted client architecture: security rules are enforced by Postgres, not by hiding UI buttons. |

---

## 🔒 Security Model

1. **Client is Untrusted:** The application connects to Supabase exclusively via the public anon key. The service-role key is **never** bundled or exposed to the client.
2. **Database-Level Row Level Security (RLS):**
   - **`profiles`:** Users can read their own profile, their manager's profile, and their direct reports' profiles. Direct modification of `role` or `manager_id` is prevented both by RLS checks and database triggers.
   - **`requests`:** Employees can only select their own requests; managers can only select requests originating from their direct reports (`manager_id = auth.uid()`).
   - **`request_events`:** Read-only for authorized actors; written exclusively by database triggers and `security definer` functions.
3. **Transactional Decision Function (`decide_request`):**
   - Implemented as a `SECURITY DEFINER` Postgres function.
   - Validates that the caller is indeed the employee's direct manager.
   - Verifies the request is still `pending`.
   - Rejection strictly requires a non-empty comment.
   - Atomically updates request status and writes to the audit timeline in one transaction.

---

## 🚀 Running Locally

You can spin up the application in 4 commands:

```bash
# 1. Clone the repository
git clone https://github.com/your-org/employee-hub.git
cd employee-hub

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# (Populate EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY)

# 4. Start the Expo development server
npx expo start
```

---

## 🧪 Testing & Code Quality

The project enforces strict TypeScript, comprehensive linting, and automated unit/RLS testing:

```bash
# Run TypeScript strict typecheck
npm run typecheck

# Run ESLint
npm run lint

# Run Jest unit test suite
npm test
```

### Automated CI Pipeline
A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every commit and pull request to ensure zero regressions across lint, typecheck, and test suites.

---

## 🔮 Known Limitations & Future Work

- **Offline-First Sync:** Currently requires active internet connection; future iterations can integrate WatermelonDB or TanStack Query offline persistence.
- **Biometric Unlock:** Add FaceID / TouchID biometric protection via `expo-local-authentication`.
- **Arabic / RTL Support:** Localization and bidirectional layout mirroring for Middle Eastern enterprise deployments.
- **Manager Analytics Dashboard:** Team leave heatmaps, average approval turnaround times, and departmental equipment spending summaries.
