# Noisify — Product Requirements Document (PRD)

**Document version:** 1.0
**Status:** Complete draft, reflecting live implementation
**Last updated:** 2026-08-08
**Owner:** Noisify Product Team
**Primary repository:** `Incrane/noisify`
**Active dev branch:** `claude/create-project-prd-9vlar`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Market Context](#2-problem-statement--market-context)
3. [Vision, Mission, and Goals](#3-vision-mission-and-goals)
4. [Target Users & Personas](#4-target-users--personas)
5. [Product Scope](#5-product-scope)
6. [Feature Requirements](#6-feature-requirements)
7. [User Flows](#7-user-flows)
8. [Information Architecture & Sitemap](#8-information-architecture--sitemap)
9. [Technical Architecture](#9-technical-architecture)
10. [Data Model](#10-data-model)
11. [Business Logic & Rules](#11-business-logic--rules)
12. [Roles & Permissions](#12-roles--permissions)
13. [Pricing, Tiers, and Feature Gating](#13-pricing-tiers-and-feature-gating)
14. [Design System & UX Standards](#14-design-system--ux-standards)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Security, Privacy, and Compliance](#16-security-privacy-and-compliance)
17. [Analytics & Success Metrics](#17-analytics--success-metrics)
18. [Testing Strategy](#18-testing-strategy)
19. [Release Status & Roadmap](#19-release-status--roadmap)
20. [Risks & Open Questions](#20-risks--open-questions)
21. [Glossary](#21-glossary)

---

## 1. Executive Summary

Noisify is a Swedish, multi-tenant SaaS platform that digitalizes the day-to-day operations of youth recreation centers (fritidsgårdar). It gives teenagers (ages ~10–20) a mobile-first way to discover and register for activities, join courses, book rooms, participate in live quizzes and tournaments, and manage their memberships across multiple youth centers. Simultaneously, it gives staff and municipal administrators a powerful management surface for activities, members, courses, rooms, communication, and reporting.

The product is built on Next.js 16 (App Router, React 19, TypeScript strict) with Supabase (PostgreSQL 14+, Auth, Storage, Realtime, Edge Functions) as the backend, using Row-Level Security (RLS) to enforce strict multi-tenant isolation. The entire UI is delivered in Swedish and follows a premium, mobile-first design language built on Tailwind CSS v4 and Shadcn/UI.

At the time of writing, the platform is approximately **92–95% feature-complete**, with the core member experience, staff dashboard, live quiz, and tournament systems shipped, and small polish items (staff onboarding wizard, course editor refinements, public course pages) remaining.

---

## 2. Problem Statement & Market Context

### 2.1 The problem

Swedish youth recreation centers today rely on a patchwork of paper sign-ups, spreadsheets, Facebook posts, and closed messaging groups to run their operations. This leads to:

- **Missed opportunities** — youth don't hear about activities relevant to them; discovery is word-of-mouth.
- **Manual overhead** — staff spend disproportionate time on registration, waitlist management, attendance, and communication.
- **Fragmented identity** — a teenager active at three fritidsgårdar has three separate records; municipalities have no consolidated view.
- **Weak accountability** — no digital trail of who attended what, no reliable statistics for funding decisions.
- **Poor youth UX** — legacy tools are built for staff first; teenagers get desktop-first, form-heavy interfaces that feel foreign to a Gen Z audience raised on TikTok and Discord.

### 2.2 Market context

- ~300 municipalities in Sweden, each operating one or more fritidsgårdar.
- Existing incumbents (e.g., municipal booking systems, ActivityHub-style tools) are staff-centric and rarely translate to a youth-facing brand.
- Increasing GDPR pressure requires proper data isolation, retention, and consent controls.
- Municipal budgets favor tiered SaaS with a free entry point for small centers.

### 2.3 Why now

- Youth are permanently mobile-first; a native web/PWA UX resonates.
- Supabase + Vercel make real-time, multi-tenant SaaS economically viable for a small team.
- Municipalities are actively digitalizing youth services post-pandemic.

---

## 3. Vision, Mission, and Goals

### 3.1 Vision

Every young person in Sweden can, from their phone, find something meaningful to do this afternoon at their local youth center — and every youth center can run its operations with the same ease.

### 3.2 Mission

Give fritidsgårdar a shared, modern digital home that youth actually enjoy using and staff actually save time with.

### 3.3 Product goals (12 months)

- **G1** Ship a stable, GDPR-compliant multi-tenant SaaS covering the full activity, membership, and communication lifecycle.
- **G2** Deliver a youth experience good enough that ≥ 70% of members return weekly during term-time.
- **G3** Let a small youth center onboard, publish an activity, and take registrations in under 30 minutes.
- **G4** Provide municipalities a consolidated multi-organization view (Enterprise tier).
- **G5** Establish a defensible engagement moat via community-shared features (Live Quiz Library, tournaments).

### 3.4 Non-goals (v1)

- Full LMS / grading system (courses are lightweight).
- Payment processing for activities (activities are free by default; payments are out of scope until later phases).
- Native iOS/Android apps (PWA-first).
- Public social feed / comments on activities.

---

## 4. Target Users & Personas

### 4.1 Youth participants ("Members", role 0)

- **Age:** 10–20, primarily 13–17.
- **Devices:** Phone-first (iOS/Android), occasional tablet, rarely desktop.
- **Behaviors:** Short attention spans, high visual expectations, comfortable with PIN/QR codes, expect real-time feedback.
- **Persona example — Goku, 15:** Wants to know what's happening tonight, sign up in two taps, and see if his friends are joining.

### 4.2 Organization staff (roles 1–4)

- **Role 1 — Vikarie (temp worker):** Limited access; can view rosters, check people in, help at the desk.
- **Role 2 — Staff:** Creates activities, approves registrations, moderates chat, hosts quizzes.
- **Role 3 — Enhetschef (Unit Manager):** Coordinator/business developer; oversight across multiple staff.
- **Role 4 — Org Admin:** Owns organization settings, staff management, plan, opening hours, membership rules.
- **Persona example — Anna, staff at Test Fritidsgård:** Runs three activities a week; needs one screen showing today's activities, pending registrations, and today's check-ins.

### 4.3 System developer / super admin (role 5)

- **Scope:** Platform-wide oversight; approves new organizations, manages global feature flags, investigates incidents.

### 4.4 Municipal decision-maker (buyer persona)

- **Scope:** Purchases at Enterprise tier for a city; expects SSO, audit logs, cross-org statistics, SLA.

### 4.5 Guest

- **Scope:** Not logged in. Can browse public activities and organizations, and join open live quizzes via a PIN.

---

## 5. Product Scope

### 5.1 In scope (v1)

- Activity management (single & recurring), registrations with lifecycle states, waitlist, invites, conflict detection.
- Multi-tenant organization model with tiered subscriptions and per-tenant limits.
- Membership system (digital cards, application/approval, expiry).
- Course platform (modules, lessons, instructors, enrollment).
- Room booking system with perks-based access, conflict detection, staff approval.
- Chat & messaging (DMs and group chats) with moderation.
- Live Quiz system (Kahoot-style) with community library and open guest access.
- Tournament system with dynamic scoring engine, registration rules engine, snake-draft team generation, live match scoring, match-day RSVP.
- Staff dashboard, statistics, member CRM.
- Public discovery: landing page, activities browse, organization directory, activity/org detail pages, legal pages.
- Swedish-only UI, PWA-quality mobile experience.

### 5.2 Out of scope (v1)

- Payments and paid activities.
- Native mobile apps.
- Public social features (comments, reactions, follows).
- Full LMS features (assignments, grading).
- BankID login (planned for Enterprise, not v1).

### 5.3 Platform assumptions

- Supabase-hosted PostgreSQL, Supabase Auth, Supabase Storage, Supabase Realtime, Supabase Edge Functions.
- Vercel hosting for Next.js.
- Modern evergreen browsers, iOS Safari 15+, Chrome 100+.

---

## 6. Feature Requirements

Each feature below lists purpose, primary users, functional requirements, and acceptance criteria. Features marked ✅ are shipped, 🟡 partial, 🔵 planned.

### 6.1 Activity Management ✅

**Purpose.** Let staff create, publish, and manage activities/events; let members discover and register.

**Primary users.** Staff (create/manage), Members (register).

**Functional requirements.**

- Create single or recurring activities via a multi-step wizard.
- Rich text description (TipTap: bold, italic, headings, links, placeholders).
- Cover image via built-in Unsplash search (proxied via Edge Function) or file upload.
- Multiple contact persons per activity.
- Registration rules: `OPEN_FOR_ALL`, `ONLY_MEMBERS`, `SELECTED_MEMBERS` (invite-only).
- Activity types: `NORMAL` (first-come) and `RANDOM` (lottery).
- Statuses: `DRAFT`, `PUBLISHED`, `ARCHIVED`. Visibility: `PUBLIC`, `PRIVATE`.
- Capacity + optional additional waitlist capacity; unlimited when null.
- Registration deadline (nullable).
- Age min/max, target subgroups (Killar, Tjejer, LGBTQ+, etc.), categories (Sport, Musik, Konst, etc.).
- Location text (+ optional room reference for future room booking integration).
- Real-time capacity via `activity_dashboard` view (never cached).
- Conflict detection: a user cannot double-book overlapping activities.
- Cross-org collaboration via `activity_organisation` (partner orgs).
- Staff can add participants manually (invite by alias), approve/reject/waitlist, remove participants (with confirmation + comment), export lists.
- Activities feed supports Active / Archived tabs on staff side, and a personalized "next-up" feed on member side.
- Slug-based public URLs for SEO.

**Acceptance criteria.**

- A staff member (role ≥ 2) can create and publish an activity in ≤ 2 minutes.
- A member sees available capacity and their registration status in real time (no page refresh required).
- Registration attempts that would double-book, exceed capacity, miss the deadline, or violate the rule set return a specific Swedish error message.
- RLS prevents staff of org A from editing activities of org B.

### 6.2 Registration Lifecycle ✅

**States.** `PENDING`, `INVITED`, `ACCEPTED`, `REJECTED`, `WAITLISTED`, `LOTTERY_REJECTED`.

**Rules.**

- Self-registration paths (`OPEN_FOR_ALL`, `ONLY_MEMBERS`) validate: publish status, deadline not passed, no time conflict, eligibility, capacity.
- If at capacity, status auto-set to `WAITLISTED`.
- Staff invite path (`SELECTED_MEMBERS`) bypasses deadline, rules, and capacity; still enforces no time conflict for the user.
- Lottery activities (`activity_type = RANDOM`) accept `PENDING` registrations until the deadline; a scheduled draw promotes winners to `ACCEPTED` and marks the rest `LOTTERY_REJECTED`.
- Only staff of the owning or partner org may change status; members may cancel their own registrations and accept/decline invites.
- The `activity_dashboard` view aggregates counts (`antal_godkanda`, `antal_vantande`, `antal_vantelista`, `antal_inbjudna`, `antal_avslag`, `totala_anmalningar`, `lediga_platser`) and derives capacity status labels (`"Ingen gräns"`, `"Lediga platser"`, `"Nästan full"`, `"Fullbokad"`).

### 6.3 Membership System ✅

**Purpose.** Model the relationship between a person and a youth center.

**Features.**

- Digital membership cards with QR codes (`react-qr-code`).
- Membership states: `active`, `expired`, `cancelled`; optional `starts_at` / `ends_at`.
- Application flow with staff approval queue; per-org toggle for "Open Membership" vs "Application Required".
- Perks attached to memberships (e.g., "Studio Access", "Free Coffee") that gate room/activity eligibility.
- Expiry notifications.
- Distinction between digital (self-registered) and local (staff-added) members.

### 6.4 Course Platform ✅ / 🟡

**Purpose.** Multi-session educational offerings (music production, dance, coding).

**Features.**

- Course → Module → Lesson hierarchy.
- Instructor system: staff can be promoted to instructors, or external instructors can be added via a form. Staff can create instructor records without leaving the course editor (via the instructor picker modal listing `public.instructors`, org staff from `org_user`, or a "Ny extern" form).
- Enrollment with progress tracking (per lesson).
- Categories/tags for discovery.
- Public course browse (`/kurser`) and detail (`/kurser/[id]`).
- Staff CRUD in `/staff/kurser`.
- 🟡 Course editor is still being refined; certificates are planned but not shipped.

### 6.5 Room Booking ✅

**Purpose.** Manage bookings for studios, meeting rooms, halls.

**Features.**

- Real-time availability calendar (`react-big-calendar`).
- Rule engine: `can_user_book_room_at_time(...)` and `has_room_booking_conflict(...)` RPCs enforce access.
- Perk-gated rooms (e.g., "Studio License" required).
- Time limits per booking; frequency limits per user.
- Auto-approve vs staff-approve based on room configuration.
- Mandatory check-in to retain the booking.

### 6.6 Chat & Messaging ✅

**Purpose.** Real-time communication between staff and members and among staff.

**Features.**

- 1:1 direct messages between staff and allowed members.
- Staff-created group chats (project teams, interest groups) — gated behind Pro tier.
- Realtime delivery via Supabase Realtime; read receipts.
- Moderation: staff can block users, delete messages, remove participants.
- Unread indicator badge in top bar.
- Push notifications (via Notifications API and preferences).

### 6.7 Live Quiz System (Kahoot-style) ✅

**Purpose.** Interactive engagement tool for events and hangouts.

**Features.**

- Staff quiz builder: title, questions, 4 answer options, time limits, question reordering.
- Community Library: quizzes marked `is_public = true` are visible across all orgs; cloning tracked via `cloned_from`.
- Host Mode: staff launch a session with 6-digit PIN, drive lobby → countdown → question → answer reveal → leaderboard.
- Player Mode: members join via `/app/quiz`, enter PIN, play in real time.
- Guest Mode: unauthenticated users can join `/join` if the session's `access_policy` is `OPEN`.
- Scoring: points weighted by speed and accuracy; streak bonuses; live leaderboard.
- Realtime state via Supabase Realtime on `quiz_sessions` / `quiz_participants`.

### 6.8 Tournament System ✅

**Purpose.** Recurring competitive gaming platform (e.g., FIFA-style football tournaments) at a fritidsgård.

**Features.**

- **Seasons** (`t_seasons`) linked to organizations; each has a dynamic scoring engine (`point_config` JSONB, e.g., `{"goal":1,"assist":2,"win":12}`) and a registration engine (`registration_config` JSONB with method/access/age/gender/target-group constraints).
- **Registration rules engine** enforced backend-side. Manual method hides "Gå med" and prompts to contact staff; Automatic validates member/age/gender/target-group and reveals the join button when eligible.
- **Player stats** (`t_player_stats`) roster per season with total_points, goals, assists, matches_played, badges.
- **Match days** (`t_match_days`) with RSVP flow ("Jag kommer" / "Kan inte komma") and staff-driven check-in.
- **Snake draft**: top 4 point-holders become captains; remaining players distributed via 1-2-3-4, 4-3-2-1 snake pattern into `generated_teams`.
- **Team editor**: rename, recolor, set captain, drag-and-drop moves, regenerate.
- **Match generation**: pairs or round-robin, saved as JSONB array in `matches` with per-match state (score_a, score_b, status, time_remaining_seconds, is_paused, winner_team_index).
- **Live scoring UI** with per-team panels, goal/assist buttons, countdown timer (client-side, syncing every 10s), pause/resume, "Ångra senaste händelse" undo, "Avsluta match tidigt".
- **Event recording** (`t_match_events`) snapshots the scoring config so historic points don't shift when config changes.
- **Post-match modal** shows result, stats summary, next-match navigation.
- **Leaderboard** derived from `t_player_stats`.

### 6.9 User Profile & Settings ✅

- Interests (multi-select tags) driving personalized recommendations.
- Notification preferences (email, push, SMS placeholders).
- Privacy & data settings (GDPR download/delete controls).
- Appearance (theme via `next-themes`).
- Change password (`/app/profil/andra-losenord`) via standard Supabase reset flow.
- Delete account (`/app/profil/radera-konto`) with admin cleanup (removes from `auth.users` and related public tables).
- Favorites (activities, organizations) with a dashboard shelf.

### 6.10 Organization Management ✅

- Onboarding wizard (`/for-organisationer/registrera`) creates a `pending` org that a super-admin approves.
- Staff invite/manage with role assignment (1–4).
- Settings tabs: profile (name, logo, description, cover), opening hours, membership rules, tier/plan, contact info.
- Statistics dashboard (registrations trend, popular activities, unique visitors, capacity utilization).
- Multi-org support at Enterprise tier: municipality can manage several youth centers under one umbrella.

### 6.11 Discovery & Public Pages ✅

- Landing page with hero, city selector modal (cookie-persisted), category filter tags, activity previews, organization showcase.
- Slug-based routing for activities (`/aktiviteter/[slug]`) and organizations (`/organisationer/[slug]`).
- Legal pages (`/integritetspolicy`, `/anvandarvillkor`, `/cookies`).
- Custom 404 page.
- `/for-organisationer` B2B landing with pricing tiers and CTA.
- Guest quiz join (`/join`).

### 6.12 Super-Admin ✅

- Global organization table with approve/suspend actions.
- Global user lookup.
- System logs / error rates dashboard.

---

## 7. User Flows

### 7.1 Member: register for an activity

1. Member opens `/app/aktiviteter` (personalized feed).
2. Taps an activity card → `/app/aktiviteter/[slug]`.
3. Taps **"Anmäl dig"**.
4. Server action calls `register_for_activity` RPC which validates:
   - Auth session present.
   - Activity is `PUBLISHED` and deadline hasn't passed.
   - Eligibility per `registration_rules` (OPEN / MEMBERS / SELECTED).
   - `has_registration_time_conflict()` returns false.
   - Capacity check.
5. Outcome (Swedish messages):
   - `ACCEPTED` (or `PENDING` for manual/lottery) → success toast.
   - `WAITLISTED` if full → info toast, added to waitlist.
   - Failure: specific error ("Fullbokad", "Krockar med annan aktivitet", "Kräver medlemskap", "Anmälningstiden är slut", "Ålder utanför intervallet").

### 7.2 Staff: invite a member

1. Staff opens activity → "Lägg till deltagare".
2. Searches by alias (server action `searchUsers`, now auth-checked).
3. Selects user → creates `registration` with status `INVITED`.
4. Member sees invite banner on `/app/aktiviteter` and in `/app/mina-anmalningar` → Förfrågningar tab.
5. Member accepts (→ `ACCEPTED`) or declines (→ `REJECTED`).

### 7.3 Organization onboarding

1. Prospect visits `/for-organisationer/registrera`.
2. Creates admin account.
3. Fills org info (name, logo, address, city).
4. Submits → org created with `org_status = 'pending'`, tier `FREE`.
5. Super-admin approves → org becomes `active`; admin receives magic link.

### 7.4 Room booking

1. Member browses `/app/lokaler`, selects date/time.
2. `can_user_book_room_at_time(...)` validates perks and rules.
3. `has_room_booking_conflict(...)` checks availability.
4. If auto-approve room and no conflicts → status `CONFIRMED`.
5. Otherwise status `PENDING`, appears in staff queue at `/staff/rum`.
6. Member must check in to retain the slot.

### 7.5 Live Quiz (host + player + guest)

1. **Host (staff):** `/staff/quiz` → creates or clones from Library → **Starta session** → picks access (`ORG_ONLY` or `OPEN`) → PIN generated.
2. **Player (member):** `/app/quiz` → enters PIN → lobby → plays → sees final rank.
3. **Guest:** `/join` → PIN → alias → plays (only if `access_policy = OPEN`).
4. Host drives phases: Lobby → Countdown → Question → Answer Reveal → Leaderboard → Repeat → Final.

### 7.6 Tournament match day

1. Staff opens `/staff/tournament/[id]/matchdagar/new` and creates a match day.
2. Members RSVP from `/app/turneringar/[id]`.
3. Staff checks in attendees.
4. Staff clicks **"Generera lag"** → snake draft executes; teams saved to `generated_teams`.
5. Staff edits teams if needed, generates matches, starts match 1.
6. Live scoring: each Mål/Assist creates a `t_match_events` row and increments `t_player_stats`; the current match score updates in the `matches` JSONB.
7. Timer hits 0 (or staff ends match) → winner determined → win/loss points awarded to all players of respective teams → post-match modal.
8. Repeat until all matches complete → **"Avsluta dagen"**.

### 7.7 Member deletes account

1. `/app/profil/radera-konto` → confirmation.
2. Server action calls admin API to remove `auth.users` record; RLS cascades / server logic clears profile, registrations, memberships, favorites.

---

## 8. Information Architecture & Sitemap

### 8.1 Public area

- `/` — landing
- `/aktiviteter`, `/aktiviteter/[slug]`
- `/organisationer`, `/organisationer/[slug]`
- `/kurser`, `/kurser/[id]`
- `/for-organisationer`, `/for-organisationer/registrera`
- `/login` (a.k.a. `/logga-in`), `/register` (a.k.a. `/registrera`), `/glomt-losenord`, `/aterstall-losenord`
- `/join` (guest quiz)
- `/integritetspolicy`, `/anvandarvillkor`, `/cookies`
- `/not-found` (custom 404), `/forbidden`

### 8.2 Authenticated app (members, role 0+)

- `/app` → redirects to `/app/aktiviteter`
- `/app/aktiviteter`, `/app/aktiviteter/[id]`
- `/app/fritidsgardar`, `/app/fritidsgardar/[slug]`
- `/app/mina-anmalningar` (Kommande / Förfrågningar / Historik)
- `/app/turneringar`, `/app/turneringar/[id]`
- `/app/quiz`
- `/app/chatt`
- `/app/profil`
  - `/installningar`, `/favoriter`, `/intressen`, `/medlemskap`
  - `/konto`, `/notiser`, `/integritet`, `/utseende`
  - `/andra-losenord`, `/radera-konto`

### 8.3 Staff dashboard (role 2+)

- `/staff` — command center: "Händer idag", pending requests, quick actions.
- `/staff/verksamhet/medlemmar` (member CRM + approval queue)
- `/staff/verksamhet/personal` (staff management)
- `/staff/verksamhet/installningar` (org settings, hours, plan, membership rules)
- `/staff/verksamhet/statistik`
- `/staff/aktiviteter`, `/staff/aktiviteter/nytt`, `/staff/aktiviteter/[slug]/redigera`
- `/staff/kurser`, `/staff/kurser/nytt`, `/staff/kurser/[slug]/redigera`
- `/staff/rum`, `/staff/rum/nytt`, `/staff/rum/[slug]/redigera`
- `/staff/chatt`
- `/staff/quiz`, `/staff/quiz/nytt`, `/staff/quiz/[id]/redigera`, `/staff/quiz/host/[id]`
- `/staff/tournament`, `/staff/tournament/[id]/matchdagar/new`, `/staff/tournament/[id]/matchdagar/[matchDayId]`, `/staff/tournament/[id]/spelarstatistik`
- `/staff/onboarding` (wizard, WIP)
- `/staff/formaner` (perks)

### 8.4 Super-admin (role 5)

- `/super_admin` — orgs table, user search, system logs.

---

## 9. Technical Architecture

### 9.1 Stack

| Layer | Choice |
|---|---|
| Frontend framework | Next.js 16 (App Router) |
| UI runtime | React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + Shadcn/UI + `tailwindcss-animate` |
| Icons | Lucide React |
| Animation | Framer Motion, CSS transitions |
| Fonts | Geist Sans / Geist Mono (`next/font/google`) |
| Rich text | TipTap (`@tiptap/react`, `starter-kit`, `link`, `placeholder`) |
| Calendar | `react-big-calendar` |
| Date picking | `react-day-picker`, `date-fns`, `date-fns-tz` |
| QR codes | `react-qr-code` |
| Toasts | `sonner` |
| Backend | Supabase (Postgres 14+, Auth, Storage, Realtime, Edge Functions) |
| Server integration | `@supabase/ssr`, `@supabase/supabase-js` |
| Hosting | Vercel |
| E2E tests | Playwright |

### 9.2 Rendering model

- **Server Components by default.** `'use client'` only when interactivity or hooks are required.
- **Server Actions** for mutations; use RPC functions for complex business logic (registration validation, booking conflicts, snake draft).
- **Realtime subscriptions** for chat, quiz sessions, tournament live scoring.

### 9.3 Storage buckets

1. `aktiviteter` — activity images (public).
2. `avatars` — user profile pictures (public).
3. `public_images` — general marketing assets (public).
4. `unsplash` — cached Unsplash images (public), populated by the `download-and-store-unsplash` edge function.

### 9.4 Edge Functions

1. `geocode-address` — geocodes org addresses for the map view.
2. `unsplash-proxy-2` — proxies Unsplash API to keep the API key server-side.
3. `download-and-store-unsplash` — downloads chosen Unsplash images into the `unsplash` bucket.
4. `invite-magiclink` — sends staff invitation emails via Supabase Auth admin API.

### 9.5 Environments

- **Local dev.** `npm run dev` (default port 3000; may fall back to 3002).
- **Staging & production.** Vercel; separate Supabase projects per environment.
- **E2E baseline.** Playwright with configurable `PLAYWRIGHT_BASE_URL`.

### 9.6 Directory shape (frontend)

```
noisify/
  app/            # Next.js routes: (public), /app, /staff, /super_admin, /api, /auth
  components/     # Shared UI (activity-card, top-bar, chat, staff, tournament, ui/…)
  actions/        # Server actions
  lib/            # Supabase clients, utilities
  hooks/          # React hooks
  supabase/       # SQL migrations (numbered)
  types/          # Generated Supabase types + shared TS types
  utils/          # Formatting, dates, permission helpers
  tests/          # Playwright specs
```

---

## 10. Data Model

Full schema is authoritative in `documentation/noisify-database-schema-updated.md` and `noisify/supabase/migrations/*`. This section documents the core entities.

### 10.1 Core tables

- **`profiles`** (`profile_id` PK → `auth.users`, `alias`, `fodd_ar`, timestamps).
- **`organisations`** (`org_id` PK, `name`, `slug`, `tier` ENUM `FREE|PRO|ENTERPRISE`, `max_members`, `max_staff`, `max_storage_mb`, `org_status` ENUM `pending|active|inactive|suspended`, contact fields, `is_active`).
- **`org_user`** (`org_user_id` PK, `org_id`, `profile_id`, `role_id` 0–5, `joined_at`).
- **`activity`** (`activity_id` PK, `org_id`, `slug`, `name`, `description`, `activity_type` `NORMAL|RANDOM`, `status` `DRAFT|PUBLISHED|ARCHIVED`, `visibility` `PUBLIC|PRIVATE`, `registration_rules` `OPEN_FOR_ALL|ONLY_MEMBERS|SELECTED_MEMBERS`, `registration_deadline`, `capacity`, `waitlist_capacity`, `starts_at`, `ends_at`, `location`, `room_id`, `min_age`, `max_age`, `image_url`, `video_url`, `created_by`, timestamps).
- **`registration`** (`registration_id` PK, `activity_id`, `profile_id`, `status` `PENDING|INVITED|ACCEPTED|REJECTED|WAITLISTED|LOTTERY_REJECTED`, `registration_date`, `notes`, timestamps).
- **`memberships`** (`membership_id` PK, `profile_id`, `org_id`, `membership_state` `active|expired|cancelled`, `starts_at`, `ends_at`, timestamps).
- **`activity_organisation`** (partner orgs on an activity).
- **`activity_target_subgroups`** (Killar, Tjejer, LGBTQ+, …).
- **`activity_categories`** (Sport, Musik, Konst, …).

### 10.2 Courses

- `courses` (`course_id`, `title`, `description`, `status` `DRAFT|PUBLISHED|ARCHIVED`).
- `course_modules`, `course_lessons`.
- `course_enrollments` (progress tracking).
- `instructors` (org staff or external).

### 10.3 Rooms

- `rooms` (perk requirements, capacity, auto-approval flag).
- `room_bookings` (status, start/end, user, check-in).

### 10.4 Chat

- `conversations`, `conversation_participants`, `messages` (with `read_at`), `message_attachments`.

### 10.5 Quizzes

- `quizzes` (`id`, `org_id`, `title`, `is_public`, `cloned_from`).
- `quiz_questions` (order, time_limit, answers).
- `quiz_sessions` (`pin_code`, `status` `LOBBY|IN_PROGRESS|FINISHED`, `access_policy` `ORG_ONLY|OPEN`).
- `quiz_participants`, `quiz_answers`.

### 10.6 Tournaments

- `t_seasons` (`organization_id`, `name`, `is_active`, `point_config` JSONB, `registration_config` JSONB).
- `t_player_stats` (`season_id`, `profile_id`, totals, `badges` JSONB; unique on season+profile).
- `t_match_days` (`season_id`, `date`, `status`, `rsvp_list` JSONB, `generated_teams` JSONB, `matches` JSONB, `match_duration_seconds`, `current_match_index`).
- `t_match_events` (`match_day_id`, `match_id`, `profile_id`, `event_type`, `points_awarded` snapshot, `team_id`, `team_index`).

### 10.7 Key views

- **`activity_dashboard`** — real-time Swedish-formatted view aggregating capacity counts, deadlines, dates, and derived status labels for staff and member surfaces.
- **`members_activities`** — personalized member browse view enriching activities with the caller's registration status and eligibility flags.

### 10.8 Key RPCs (SECURITY DEFINER where needed)

- `register_for_activity(activity_id, profile_id)` — the canonical registration entry point.
- `has_registration_time_conflict(profile_id, starts_at, ends_at)`.
- `can_user_book_room_at_time(room_id, profile_id, starts_at, ends_at)`.
- `has_room_booking_conflict(room_id, starts_at, ends_at)`.
- `create_bulk_activities(...)` — recurring activity creation.
- Tournament: snake draft generation, event recording, undo, snapshot of `point_config`.

---

## 11. Business Logic & Rules

### 11.1 Registration matrix

| Scenario | Method | Deadline? | Rule check | Conflict check | Capacity → outcome |
|---|---|---|---|---|---|
| Public register | self | enforced | OPEN | enforced | free → `ACCEPTED`; full → `WAITLISTED` |
| Members-only register | self | enforced | requires active membership | enforced | same as above |
| Staff invite | staff | bypass | bypass | enforced | any → `INVITED` |
| Lottery | self | enforced | OPEN or MEMBERS | enforced | any → `PENDING` until draw |
| Manual approval | self | enforced | OPEN or MEMBERS | enforced | free → `PENDING`; full → `WAITLISTED` |

### 11.2 Waitlist promotion

- When an `ACCEPTED` registration cancels or is removed, staff can promote from waitlist (Pro tier can enable automated promotion rules).

### 11.3 Time conflicts

- No overlap allowed with any active registration (`ACCEPTED` or `INVITED`) or confirmed room booking for the same user.
- Enforced server-side via RPC, not client-side.

### 11.4 Tournament scoring

- Points come from `point_config` at the time of the event; snapshot preserved in `t_match_events.points_awarded` so historic totals don't shift if config is edited later.
- Win/loss/draw points applied to every player on the team when a match ends.
- Undo removes the last event for the current match and reverses the corresponding stat increments and match-score.

### 11.5 Membership eligibility

- `ONLY_MEMBERS` requires an `active` membership in the activity's owning org (or a partner org listed on the activity).
- Membership perks can be prerequisites for room bookings.

### 11.6 Tier enforcement

- Enforced at both the RPC layer and in server actions using `organisations.tier` and `max_*` columns.
- Attempted operations over the cap return a specific Swedish error and prompt an upgrade CTA in the UI.

---

## 12. Roles & Permissions

| Role | ID | Scope |
|---|---|---|
| Member | 0 | View + register/self-manage. |
| Vikarie | 1 | Basic staff assist: view rosters, check-in. No activity create. |
| Staff | 2 | Full activity, quiz, room, chat management within their org. |
| Unit Manager | 3 | Coordinator; oversight across staff; can promote/demote up to role 2. |
| Org Admin | 4 | Full control over org settings, staff, plan, membership rules. |
| System Developer | 5 | Platform-wide: approve orgs, global lookup, system logs. |

**Enforcement.** RLS policies on every table check both organization membership (via `org_user`) and the required minimum `role_id`. `SECURITY DEFINER` helper functions (`current_role_in_org(org_id)`, `is_member_of(org_id)`, etc.) prevent circular RLS dependencies. All policies are scoped to `authenticated` users.

**Recent hardening.** A November 2025 security audit closed missing auth checks in server actions (notably `searchUsers` in `staff/aktiviteter`) and tightened staff-room authorization; see `documentation/security-audit-2026-02-18.md`.

---

## 13. Pricing, Tiers, and Feature Gating

### 13.1 Tier matrix

| Feature | Free ("Start") | Pro ("Växa") | Enterprise ("Stad") |
|---|---|---|---|
| Target | Small centers, pilots | Established centers | Municipalities |
| Cost | 0 SEK/mo | 2000 SEK/mo (ex moms) | Custom |
| Members | 50 | Unlimited | Unlimited |
| Staff | 3 | Unlimited | Unlimited |
| Storage | 500 MB | 10 GB | 100 GB+ |
| Support | Community/docs | Email (48h) | Dedicated manager |
| SLA | None | None | 99.9 % uptime |
| Registration rules | Only "Öppen för alla" | All | All |
| Waitlists | ❌ | ✅ | ✅ |
| Recurring activities | ❌ | ✅ | ✅ |
| Cross-org collaboration | ❌ | ✅ | ✅ |
| Registration deadlines | ❌ | ✅ | ✅ |
| Courses cap | 2 | Unlimited | Unlimited |
| Room booking | ✅ full | ✅ full | ✅ full |
| Chat | DMs only | Groups + DMs | Groups + DMs |
| Reporting | Basic attendance | Advanced + export | Audit logs + API |
| Multi-org | ❌ | ❌ | ✅ |
| SSO (BankID/AD) | ❌ | ❌ | ✅ |

### 13.2 Enforcement examples

```ts
if (currentMemberCount >= org.max_members) {
  throw new Error("Medlemsgräns uppnådd. Uppgradera för att lägga till fler.");
}
if (currentStorageUsage + newFileSize > org.max_storage_mb) {
  throw new Error("Lagringsutrymme fullt. Uppgradera för att lägga till mer lagringsutrymme.");
}
```

### 13.3 Upgrade UX

- Blocked actions surface a modal explaining the limit and a "Uppgradera plan" CTA linking to `/staff/verksamhet/installningar#plan`.

---

## 14. Design System & UX Standards

### 14.1 Aesthetic

- **Premium, youthful, mobile-first.** Vibrant colors, generous white space, glassmorphism accents, and soft rounded corners (`rounded-xl`/`rounded-2xl`; pill buttons `rounded-full`).
- **No generic MVP look.** Every screen is expected to feel intentionally designed.

### 14.2 Color palette

- **Primary — Indigo:** `indigo-600` (#4f46e5) primary actions; `indigo-700` hover; `indigo-50` active-item background; `indigo-100` subtle borders.
- **Accent — Violet/Purple:** `violet-600` gradients/decorative; `purple-200` decorative blobs.
- **Neutral — Slate:** `slate-900` headings, `slate-600` body, `slate-400` muted, `slate-200` borders, `slate-50` page bg, white surfaces.
- **Semantic:** Green success, amber warning, rose/red destructive, blue info.

### 14.3 Typography

- Family: Geist Sans (default), Geist Mono (technical data).
- Scale: H1 `text-5xl md:text-7xl font-extrabold`, H2 `text-3xl md:text-4xl font-bold`, H3 `text-2xl font-bold`, body `text-base|text-lg`, small `text-sm font-medium`.

### 14.4 Components

- Buttons default to pill shape; cards `rounded-xl`/`rounded-2xl`; inputs `rounded-xl` or `rounded-md`.
- Shadcn UI theming variables (see `documentation_v2/09-design-system.md`) map to the Indigo/Slate palette.
- Icons from Lucide; animations via Framer Motion or CSS transitions.
- Immediate visual feedback on all actions: loading states, `sonner` toasts, optimistic UI where safe.

### 14.5 Localization

- 100 % Swedish (sv-SE) in UI, error messages, dates, times, and email templates.
- Code and comments in English.

### 14.6 Accessibility

- All primary flows must be keyboard-navigable.
- Semantic HTML and ARIA labels on interactive components.
- Color contrast meets WCAG AA in both light and dark themes.

---

## 15. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Landing and dashboard pages TTI < 2 s on median 4G mobile; realtime updates < 500 ms end-to-end. |
| **Availability** | 99.9 % target at Enterprise (contractual); best-effort at Free/Pro. |
| **Scalability** | Multi-tenant to thousands of orgs; Supabase Postgres + read-replica ready. |
| **Responsiveness** | Fully usable at 360 px width; no horizontal scroll except intentional carousels. |
| **PWA** | Installable, offline shell for read-only pages, service-worker precaching. |
| **Browser support** | Latest 2 versions of Chrome, Safari, Edge, Firefox; iOS Safari 15+. |
| **Observability** | Server logs shipped to Vercel; DB logs in Supabase; front-end error boundaries surface toasts. |
| **Backups** | Daily Supabase backups; PITR on Pro/Enterprise projects. |

---

## 16. Security, Privacy, and Compliance

### 16.1 Authentication

- Supabase Auth: email/password and magic links.
- Enterprise: SSO via BankID / municipal AD (planned).
- Password change and account deletion flows verified and shipped.

### 16.2 Authorization

- Row-Level Security enabled on every table.
- Policies scoped to `authenticated` and check org membership + role.
- `SECURITY DEFINER` helpers avoid RLS recursion; server actions call RPCs rather than mutating tables directly for sensitive paths.

### 16.3 GDPR

- Explicit consent captured at registration.
- User can export and delete their data from `/app/profil/integritet` and `/radera-konto`.
- Data retention policies documented per entity (activities, chat messages, quiz answers).
- Legal pages published: `/integritetspolicy`, `/anvandarvillkor`, `/cookies`.

### 16.4 Data isolation

- Every tenant-scoped table filtered by `org_id`; cross-tenant reads impossible via API.
- Storage buckets separated by prefix per org where sensitive.

### 16.5 Audit trail

- Enterprise tier surfaces staff-action audit logs.
- Recent audit report: `documentation/security-audit-2026-02-18.md` — closed missing auth checks and hardened staff room authorization.

### 16.6 Secure defaults

- No `TODO`/`FIXME` allowed in shipped code.
- Server-side validation authoritative for all registration/booking flows.

---

## 17. Analytics & Success Metrics

### 17.1 Product KPIs

- **Engagement.** Weekly active members / total members per org.
- **Registration conversion.** Activity views → registrations.
- **Time-to-register.** Median seconds from activity view to confirmed status.
- **Staff efficiency.** Median seconds to create an activity; median hours from registration to staff decision.
- **Waitlist health.** Fill-rate of waitlisted slots after cancellations.

### 17.2 System KPIs

- Uptime, p95 API latency, error rate, database CPU.

### 17.3 Reporting surfaces

- Staff statistics dashboard (`/staff/verksamhet/statistik`): registrations, popular activities, unique visitors, capacity utilization.
- Enterprise: cross-org roll-up and CSV/Excel export.

---

## 18. Testing Strategy

### 18.1 Test users (shared org: "Test Fritidsgård", password `123456`)

**Staff:**

| Name | Email | Role |
|---|---|---|
| Anna Test | anna_test@noisify.se | 2 |
| Diogo Test | diogo_test@noisify.se | 2 |
| Ricardo Test | ricardo_test@noisify.se | 2 |
| Fergie Test | fergie_test@noisify.se | 3 |
| Taboo Test | taboo_test@noisify.se | 4 |
| Will Test | will_test@noisify.se | 5 |

**Members:**

| Alias | Email | Age | Persona |
|---|---|---|---|
| Goku | goku@test.se | 15 | Active, sporty |
| Bulma | bulma@test.se | 17 | Tech-savvy, creative |
| Piccolo | piccolo@test.se | 14 | Quiet, introspective |
| Android 18 | android18@test.se | 19 | Independent, athletic |
| Vegeta | vegeta@test.se | 16 | Competitive, ambitious |

### 18.2 Automated tests

- **Playwright specs** in `tests/` and `noisify/tests/`:
  - `staff_members.spec.ts`, `staff_personal.spec.ts` — staff onboarding & member management.
  - Staff org onboarding wizard (in progress).
- Baseline URL is configurable via `PLAYWRIGHT_BASE_URL`.
- Login page is `/login` (previously `/logga-in`); tests must target the current route.

### 18.3 Manual QA scenarios

- Staff login + dashboard access checks per role.
- Member browse → register → check "Mina anmälningar".
- Live quiz flow: host (staff), player (member), guest (`/join`).
- Tournament match-day end-to-end (RSVP → draft → live scoring → undo → post-match).
- Mobile responsiveness on iOS Safari and Android Chrome.

### 18.4 Regression triggers

- Any change to registration RPCs, RLS policies, or tier-enforcement helpers requires re-running the full Playwright suite.

---

## 19. Release Status & Roadmap

### 19.1 Current status (~92–95 % complete)

| Section | Status | Completion |
|---|---|---|
| Public pages | 🟢 Mostly complete | 95 % |
| Authenticated app | 🟢 Mostly complete | 90 % |
| Staff dashboard | 🟢 Mostly complete | 95 % |
| API & core | 🟢 Stable | 95 % |

### 19.2 Recently shipped highlights

- **Nov 2025 — Live Quiz System:** full Kahoot-style stack including community library, host mode, mobile-first player, guest join, and Realtime sync.
- **Nov 2025 — Pricing tiers backend:** `tier`, `max_*` columns and enforcement helpers.
- **Nov 2025 — Slug-based SEO routing** for activities and organizations.
- **Nov 2025 — Legal pages, custom 404, redesigned `/for-organisationer`.**
- **Dec 2025 — Tournament System:** seasons with dynamic scoring/registration engines, snake draft, team editor, live match scoring, match-day RSVP, player statistics.
- **Feb 2026 — Security hardening** of staff room authorization + audit report.
- **Q1 2026 — Navigation performance:** platform-wide navigation-perf improvements (see PR #3).

### 19.3 Immediate next steps

1. **Staff onboarding wizard** for freshly approved organizations.
2. **Course editor polish** (drag-and-drop lessons, better instructor picker UX).
3. **Public course pages** (Phase 2 for `/kurser`).
4. **Verify profile subpages** — `andra-losenord`, `radera-konto` regression tests.

### 19.4 Later roadmap (indicative)

- **Payments** for paid activities and course fees.
- **BankID/SSO** for Enterprise.
- **Native push notifications** via Web Push + APNs bridge.
- **Public API** for municipal integrations.
- **Certificates** for course completion.

---

## 20. Risks & Open Questions

| # | Risk / Question | Mitigation / Owner |
|---|---|---|
| R1 | Free-tier abuse (many small orgs on free tier straining storage/DB). | Enforce hard caps; monitor storage per-org; contact orgs approaching limits. |
| R2 | Cross-tenant data leakage via missed RLS. | Mandatory RLS on every table; PR checklist; periodic security audits. |
| R3 | Realtime scaling for large quiz sessions or tournament match days. | Load-test quiz sessions to 500 participants; add Supabase channels partitioning. |
| R4 | Youth safety in chat (grooming, harassment). | Staff moderation tools, DM restrictions, mandatory block/report primitives; consider mandatory staff-monitored channels. |
| R5 | Municipal procurement demands (SSO, audit logs, SLA) may lag. | Prioritize Enterprise features in H2; publish DPA and security whitepaper. |
| Q1 | Do we offer paid activities in v1? | **No** — deferred. |
| Q2 | Native apps vs PWA long-term? | PWA-first; revisit after 10k WAU. |
| Q3 | Are recurring activities generated eagerly or on-the-fly? | Eagerly via `create_bulk_activities` RPC; revisit if row counts explode. |
| Q4 | Should tournament results be visible to non-members of an org? | Currently members-only; product to decide public visibility toggle. |

---

## 21. Glossary

- **Fritidsgård** — Swedish youth recreation center.
- **Aktivitet** — Activity/event.
- **Anmäl dig** — "Register" (verb).
- **Anmälningsfrist** — Registration deadline.
- **Kapacitet / Lediga platser / Fullbokad** — Capacity / Available spots / Fully booked.
- **Vantelista** — Waitlist.
- **Medlem / Medlemskap** — Member / Membership.
- **Personal / Vikarie / Enhetschef** — Staff / Temp worker / Unit manager.
- **Turnering / Säsong / Matchdag** — Tournament / Season / Match day.
- **Gå med** — Join.
- **Ångra senaste händelse** — Undo last event.
- **RLS** — Row-Level Security (Postgres/Supabase).
- **RPC** — Remote procedure call (Postgres function invoked from the client).
- **PWA** — Progressive Web App.
- **PIN** — 6-digit code used to join a quiz session.
- **Snake draft** — Team selection where the pick order reverses each round (1-2-3-4, 4-3-2-1, …).

---

*End of document.*
