# Stitch UI Design System & Screen Specifications

**Project Title:** Mobile App Design  
**Project ID:** `7870139096603311335`  

---

## 🎨 Color Palette & Design Tokens (Material 3 Enterprise Navy)

| Token | Hex | Usage |
| :--- | :--- | :--- |
| **`primary`** | `#00236F` | Primary branding, top headers, main CTA backgrounds |
| **`primary-container`** | `#1E3A8A` | Active states, prominent container elements |
| **`secondary`** | `#0051D5` | Highlights, active accents, actionable icons |
| **`secondary-container`** | `#316BF3` | Badges, chips, progress indicators |
| **`background`** | `#FAF8FF` | Screen background (cool crisp tint) |
| **`surface`** | `#FFFFFF` | Cards, modals, sheet backgrounds |
| **`surface-container`** | `#EAEDFF` | Input backgrounds, subtle dividers, pill containers |
| **`surface-container-high`** | `#E2E7FF` | Hover/pressed states, active filter chips |
| **`on-surface`** | `#131B2E` | High-contrast primary headings and text |
| **`on-surface-variant`** | `#444651` | Secondary text, labels, metadata |
| **`outline`** | `#757682` | Card borders, inactive input borders |
| **`outline-variant`** | `#C5C5D3` | Subtle hairline dividers |
| **`error`** | `#BA1A1A` | Rejection badges, error banners, destructive buttons |
| **`error-container`** | `#FFDAD6` | Error alert backgrounds |
| **`success`** | `#059669` | Approved status badge, approval CTA |
| **`success-container`** | `#D1FAE5` | Approval background tint |
| **`warning`** | `#D97706` | Pending status badge |
| **`warning-container`** | `#FEF3C7` | Pending background tint |

---

## 📱 Downloaded Screen Reference

All screens have been extracted directly from the Google Stitch remote MCP server into `stitch-designs/`:

| # | Screen Name | Screen ID | Screenshot Image | HTML Code |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **Login & Demo Auth** | `fc5b219cd6f3451b9fc8531c68aa27d3` | [`images/1_login_demo_auth.png`](file:///home/kal/dev/employe_tracking/stitch-designs/images/1_login_demo_auth.png) | [`html/1_login_demo_auth.html`](file:///home/kal/dev/employe_tracking/stitch-designs/html/1_login_demo_auth.html) |
| **2** | **My Requests** | `22007036272447a1ac1c3c68c73e4b69` | [`images/2_my_requests.png`](file:///home/kal/dev/employe_tracking/stitch-designs/images/2_my_requests.png) | [`html/2_my_requests.html`](file:///home/kal/dev/employe_tracking/stitch-designs/html/2_my_requests.html) |
| **3** | **New Request** | `1fae4c7f71f34ce2ad0b46ec8d54934a` | [`images/3_new_request.png`](file:///home/kal/dev/employe_tracking/stitch-designs/images/3_new_request.png) | [`html/3_new_request.html`](file:///home/kal/dev/employe_tracking/stitch-designs/html/3_new_request.html) |
| **4** | **Request Detail & Timeline** | `ed7508071f0f4db4a5aca6c5153679ad` | [`images/4_request_detail_and_timeline.png`](file:///home/kal/dev/employe_tracking/stitch-designs/images/4_request_detail_and_timeline.png) | [`html/4_request_detail_and_timeline.html`](file:///home/kal/dev/employe_tracking/stitch-designs/html/4_request_detail_and_timeline.html) |
| **5** | **Manager Approvals** | `a602e50984634fc6a06b3af7c33de09e` | [`images/5_manager_approvals.png`](file:///home/kal/dev/employe_tracking/stitch-designs/images/5_manager_approvals.png) | [`html/5_manager_approvals.html`](file:///home/kal/dev/employe_tracking/stitch-designs/html/5_manager_approvals.html) |
| **6** | **Profile & Settings** | `472257798abc4d46b44fa4908b9b3822` | [`images/6_profile_and_settings.png`](file:///home/kal/dev/employe_tracking/stitch-designs/images/6_profile_and_settings.png) | [`html/6_profile_and_settings.html`](file:///home/kal/dev/employe_tracking/stitch-designs/html/6_profile_and_settings.html) |

---

## 🔑 Key Visual & UX Patterns from Stitch Designs

1. **Role-Switcher Demo Cards (Login):**
   - Two selectable card containers side-by-side: **Employee (Alex Chen)** and **Manager (Sarah Jenkins)**.
   - Distinct active selection border (`#0051D5`) with subtle container tint (`#EAEDFF`) and checkmark badge.
   - Automatically populates the credentials and updates an active status banner below.

2. **Status Pills with Indicators (Lists & Detail):**
   - `Pending`: amber text (`#D97706`), background (`#FEF3C7`), dot pulse indicator.
   - `Approved`: green text (`#059669`), background (`#D1FAE5`), solid checkmark icon.
   - `Rejected`: red text (`#DC2626`), background (`#FEE2E2`), cross icon.
   - `Cancelled`: slate text (`#64748B`), background (`#F1F5F9`), subtle circle icon.

3. **Request Type Badges:**
   - Category tags with dedicated icons (Calendar for Leave, Laptop for Equipment, Chip/Wrench for IT Support).

4. **Activity Timeline (Detail):**
   - Left-aligned connected node timeline with colored circle icons (`#00236F`, `#059669`, `#DC2626`, `#64748B`).
   - Vertical connector line joining events chronologically.
   - Clear typography hierarchy: Action title, optional note/reason, and humanized timestamp.

5. **Manager Decision Modal / Actions:**
   - Action bar pinned to bottom: prominent green Approve button and framed red Reject button.
   - Reject opens a comment modal enforcing rejection justification before submission.
