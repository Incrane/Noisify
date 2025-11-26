# Changelog


## 2025-11-26
- **Bug Fix: City Selection Server Action** - Fixed "Invalid Server Actions request" error when clicking cities in the landing page
  - Root cause: Server actions called directly from event handlers without `startTransition` in Next.js 16 Turbopack
  - Fixed in `city-modal.tsx` (initial city selection dialog) and `site-header.tsx` (header city dropdown)
  - Wrapped all server action calls (`setCityCookie`, `saveCity`, `removeCity`) in `startTransition` for proper concurrent handling
  - REFACTORED: Implemented **Inline Server Action Wrappers** in Server Components (`page.tsx`, `aktiviteter/page.tsx`).
    - Instead of passing imported actions directly, we now wrap them in local async functions marked with `'use server'`.
    - This forces a fresh binding and prevents "Invalid Server Actions request" errors caused by module boundary issues in Next.js 16 Turbopack.
  - Removed redundant `saveCity` call in city-modal (setCityCookie already calls it internally)
  - Added loading indicators with `isPending` state for better UX
- **UI Fix: Quiz Dropdown** - Fixed transparent "Starta" dropdown by removing `overflow-hidden` from card and improving dropdown styling with shadow and better labels
- **Bug Fix: Answer Options** - Fixed shallow copy issue where adding a new question kept the previous question's answer options. Now uses deep copy with `createNewQuestion()` helper
- **Feature: Question Reordering** - Implemented drag-and-drop and up/down button controls for reordering questions in the quiz form
- **UI Improvement: Quiz Form** - Enhanced answer option cards with better visual feedback, checkmark button placement, and "Rätt svar" label for correct answers
- **UI Improvement: Question List** - Added numbered badges, better hover states, and reorder controls

## 2025-11-25
- **Feature: Live Quiz** - Complete Kahoot-style interactive quiz system
  - **Database Schema:** Created 5 new tables with RLS policies:
    - `quizzes` - Quiz containers with public/private sharing, categories, cloning support
    - `quiz_questions` - Questions with 2-4 answer options, time limits (5-120s)
    - `quiz_sessions` - Live game sessions with PIN codes, access policies (ORG_ONLY/OPEN)
    - `quiz_participants` - Players with scores, streaks, nicknames
    - `quiz_answers` - Individual answer tracking with timing for points calculation
  - **Staff Dashboard (`/staff/quiz`):**
    - "My Quizzes" tab for organization's own quizzes
    - "Community Library" tab for browsing/cloning public quizzes from other orgs
    - Quiz creation form with visual question builder
    - Start session with access policy selection (Org Only vs Open)
  - **Host Mode (`/staff/quiz/host/[sessionId]`):**
    - Lobby with QR code, PIN display, participant list
    - Real-time game controls (Start, Next Question, Show Answer, Leaderboard)
    - Animated countdown, timer bar, answer distribution charts
    - Podium display for top 3 winners
  - **Player Mode (`/app/quiz`):**
    - PIN-code entry with numpad interface
    - Immersive full-screen game experience
    - Color-coded answer buttons (Red/Blue/Yellow/Green)
    - Real-time feedback (correct/incorrect animations)
    - Score and streak tracking with fire icon
  - **Guest Join (`/join`):**
    - Public page for guests to join OPEN sessions
    - No login required for open quizzes
  - **Real-time:** Supabase Realtime subscriptions for live game state sync
  - **Points System:** Base 1000 + time bonus (up to 500) + streak bonus (10% per streak, max 50%)
  - **RLS Fix:** Fixed infinite recursion in quiz_sessions/quiz_participants policies, added anon access for guests
  - **Code Quality:** Updated Tailwind gradient classes to modern syntax, fixed React useCallback hooks, improved ESLint compliance
- **Backend Update:** Implemented Pricing Tiers logic.
  - Added `tier`, `max_members`, `max_staff`, and `max_storage_mb` to `organizations` table.
  - Implemented database triggers to enforce member and staff limits based on the organization's tier.
  - Updated TypeScript types to reflect schema changes.
- **Documentation:** Created `pricing-tiers.md` defining logic for Free, Pro, and Enterprise tiers.
  - Outlined limits for members, staff, and storage.
- **Database Schema:** Implemented subscription tier columns (`tier`, `max_members`, `max_staff`, `max_storage_mb`) in `organizations` table.
- **Documentation:** Updated `noisify-database-schema-updated.md` with new Subscription System and Notification System details.
- **Type Definitions:** Updated `types/supabase.ts` to match current database schema (Chat, Notifications, Subscriptions).

## 2025-11-24
- **Frontend Update:** Redesigned `/for-organisationer` landing page.
  - Modern visual design with focused feature highlights (Activity Management, Mobile-First, Statistics).
  - Added clear CTA links to the Organization Registration Wizard (`/for-organisationer/registrera`).
  - Updated `SiteFooter` to include correct links for organization information and onboarding.
- **Frontend Update:** Implemented SEO-friendly slugs for Organizations and Activities.
  - Updated database schema: Added `slug` column to `organizations` and `activity` tables (backfilled with data).
  - Updated `activity_dashboard` view to include `slug`.
  - Renamed routes: `/aktiviteter/[id]` -> `/aktiviteter/[slug]` and `/organisationer/[id]` -> `/organisationer/[slug]`.
  - Updated `ActivityCard` and listing pages to use slug-based URLs.
- **404 Page:** Created a custom, user-friendly Not Found page (`app/not-found.tsx`).
- **SEO Improvements:** Implemented dynamic metadata generation for activity and organization detail pages.
- **Bug Fix:** Fixed "404 This page could not be found" error when clicking activities by ensuring consistent slug usage.
- **UI Fix:** Removed static "Logga in" buttons in Header that showed even when logged in. Header now reflects actual auth state.
- **UI Fix:** Hid favorite button (heart) on activity cards for logged-out users on public pages.
- **UI Update:** Standardized the Site Footer across all public pages (Landing Page now uses the shared component).
- **Content Update:** Updated copyright text to "Incrane".
- **New Pages:** Added legal pages (`Integritetspolicy`, `Användarvillkor`, `Cookies`) and linked them in the Site Footer.
- **Bug Fix:** Fixed "Inactive" tab in Staff Members list not filtering correctly.
- **Bug Fix:** Fixed Chat Member Selection modal to show all eligible users and filter correctly (Digital users only).
- **Accessibility Fix:** Fixed `DialogContent` accessibility error in `Sheet` component.
- **Registration Flow Fixes:**
  - Replaced "Födelseår" input with full date picker.
  - Added mandatory GDPR and Terms of Service checkbox.
  - Improved Avatar Picker with search and better scrolling.
- **Public Pages Fixes:**
  - Fixed "Välj din stad" overlay persistence issues.
  - Fixed routing and 404 errors on public activity and organization pages.

## 2025-11-23
- Resolved staff notification sending RLS violation by routing through `create_notification_from_staff` RPC.
  - Allows staff to deliver notiser without bypassing policies.
  - Files: `app/staff/medlemmar/member-actions.ts`.
- **CRITICAL BUG FIX:** Fixed registration status update failure in staff activity management
  - Issue: Staff members unable to approve/reject activity registrations
  - Cause: Incorrect database column reference (`registration_id` instead of `id`)
  - Fixed in: `app/staff/aktiviteter/actions.ts` (lines 28, 249, 259)
  - Impact: Core staff workflow restored
- **UI Update:** Updated Staff Sidebar structure
  - Renamed "Gamification" section to "Verktyg"
  - Added placeholders for "Chatt" and "Utlåningar"
  - Added "SNART" (Coming Soon) badges to upcoming features
- Conducted comprehensive staff onboarding experience test using Playwright MCP
  - Tested login, dashboard, organization settings, activity management
  - Documented findings in `STAFF_ONBOARDING_TEST_REPORT.md`
  - Identified feature gap: "Ny verksamhet" button not implemented
  - Captured 7 screenshots of key staff interfaces
- Created Playwright test specification for new organization onboarding flow
  - File: `tests/staff_onboarding_new_org.spec.ts`
  - Includes organization creation, settings configuration, and feature exploration

## 2025-11-21
- Fixed a critical bug in the membership application flow where the incorrect column name `organization_id` was used instead of `org_id`.
- Verified and corrected column usage in both the server action and page data fetching for `app/fritidsgardar/[id]`.

## 2025-11-22
- Updated Playwright configuration to allow overriding the base URL via `PLAYWRIGHT_BASE_URL` so local dev servers on alternate ports can be tested.
- Pointed staff member Playwright test to `/login` and documented the new testing flow in README.

## 2025-11-19
- Added instructor modal improvements allowing staff promotion and external instructor creation.
- Documented the new instructor workflow in README.
- Implemented typed staff fetching for course creation page.
