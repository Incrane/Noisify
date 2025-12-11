# Changelog

## 2025-12-11
- **Bug Fix: Tournament Player Removal** - Fixed staff unable to remove players from spelarstatistik page
  - Issue: RLS DELETE policy on `t_player_stats` was silently blocking delete operations
  - Solution: `removePlayerFromSeason` now verifies staff access server-side and uses admin client for the delete
  - Added proper authorization checks (user auth, profile lookup, org_user role verification)
- **UI Improvement: Player Delete Confirmation** - Replaced native `window.confirm()` with styled Dialog component
  - Modern UI dialog with "Ta bort spelare" title and player name
  - Cancel and destructive confirm buttons with loading state
  - Better UX consistency with the rest of the application
- **Bug Fix: Perk Type Organizations RLS** - Fixed "Error fetching pending invites" on Förmåner page
  - Issue: RLS policies on `perk_type_organizations` used incorrect `org_user.profile_id = auth.uid()` check
  - Solution: Updated all policies to properly join through `profiles` table: `profiles.user_id = auth.uid()`
  - Fixed SELECT, INSERT, and UPDATE policies

## 2025-12-10
- **Feature: Tournament System (Turneringar)** - Competitive gaming platform with seasons, leaderboards, and snake draft
  - **Database Migration:** 4 new tables (`t_seasons`, `t_player_stats`, `t_match_days`, `t_match_events`)
  - **Views:** `t_leaderboard`, `t_season_dashboard`, `t_match_day_detail`
  - **RPC Functions:** `join_tournament_season`, `check_tournament_eligibility`, `record_match_event`, `undo_match_event`, `update_match_rsvp`, `check_in_player`, `generate_snake_draft_teams`
  - **Scoring Engine:** Dynamic points via JSONB `point_config` (goal, assist, win, etc.)
  - **Registration Engine:** JSONB `registration_config` with method (manual/automatic), access rules, age limits, gender/group restrictions
  - **Snake Draft Algorithm:** Auto-generate balanced teams based on player rankings
  - **Real-time:** Enabled realtime subscriptions for live scoring
  - **TypeScript Types:** Added `/types/tournament.ts` with comprehensive type definitions
  - **Staff UI Pages:**
    - `/staff/tournament` - Season list with cards and empty state
    - `/staff/tournament/[seasonId]` - Season detail with tabs (Overview, Leaderboard, Match Days, Settings)
    - `/staff/tournament/[seasonId]/matchdagar/new` - Create match day form
    - `/staff/tournament/[seasonId]/matchdagar/[matchDayId]` - Live scoring with check-in, teams, and event log
    - `/staff/tournament/[seasonId]/spelarstatistik` - Player management with search and stats table
  - **Components:** CreateSeasonModal (3-step wizard), LeaderboardTable, MatchDayList
  - **Bug Fix:** RLS policies updated to use `user_id = auth.uid()` instead of `profile_id`
  - **User UI Pages:**
    - `/app/turneringar` - Browse active tournaments with organization filter
    - `/app/turneringar/[seasonId]` - Season detail with join, leaderboard, matchdays
    - `/app/turneringar/[seasonId]/matchdag/[matchDayId]` - RSVP attendance
  - **User Sidebar:** Added "Turneringar" link with NY badge
  - **Bug Fix:** RPC functions fixed to lookup `profile_id` from `profiles` table using `user_id`
  - **Real-time Hooks:** Created `/hooks/use-tournament-realtime.ts` with:
    - `useLeaderboardRealtime` - Live leaderboard updates
    - `useMatchDayRealtime` - Live RSVP and scoring updates
    - `useSeasonDashboardRealtime` - Live season stats updates
  - **Security Fix:** Leaderboard visibility restricted to registered players and staff only
    - Created `get_season_leaderboard` RPC with access control
    - Added RLS policy `Restricted player stats visibility`
  - **Staff Name Display:** Staff can see real names (first_name, last_name) + @alias in leaderboard
  - **Add Player Modal:** Now shows organization members list by default (not just search)
  - **Match Day Staff Check-in:** Staff can add any tournament player directly to match day RSVP
  - **Match System Redesign:** Complete overhaul of live scoring
    - Round-robin match generation after teams are created
    - Match list with status badges (Väntar, Pågår, Avslutad)
    - Active match view with countdown timer
    - Pause/Resume timer functionality
    - Auto-complete match when timer ends
    - Win/Loss point awards to all team players
    - New RPC functions: `generate_matches_for_teams`, `start_match`, `toggle_match_pause`, `end_match`, `record_match_event`
  - **Team Editor:** Full team management capabilities
    - Rename teams (not just Lag 1, Lag 2)
    - Change team colors (8 color options)
    - Set captain (click crown icon)
    - Drag-and-drop players between teams
    - Move players via dropdown menu
    - Unassigned players section for checked-in players not in teams
  - **Real-time Updates:** All tournament features now support real-time sync
    - SQL migration to enable Supabase Realtime on tournament tables
    - New hooks: `useActiveMatchRealtime`, `usePlayerStatsRealtime`
    - Updated all existing hooks with ref pattern to avoid stale closures
    - Live match scoring, team changes, leaderboard updates sync instantly
  - Files: `/supabase/migrations/20251210_tournament_system.sql`, `/types/tournament.ts`, `/app/actions/tournament.ts`, `/app/staff/tournament/*`, `/app/app/turneringar/*`, `/components/tournament/*`
  - Documentation: Updated `/documentation/noisify-database-schema-updated.md`

## 2025-12-08
- **Feature: Förmåner (Perks) Staff Administration** - Comprehensive perk management system for staff users
  - **Database Migration:** New tables (`perk_types`, `perk_type_organizations`, `course_perks`, `room_perks`) and modifications to `profile_perks`
  - **Staff UI `/staff/formaner`:** List view with filters, create/edit/delete perk types, view users, multi-org sharing
  - **Member Management:** Förmåner option in member details for granting/revoking perks
  - **Sidebar:** Added Förmåner link under Verksamhet (above Inställningar)
  - Files: `/staff/formaner/*`, `/components/staff/member-perks-modal.tsx`, staff-sidebar.tsx, member-details-modal.tsx
- **Feature: Course Perk Grant on Completion** - Staff can select a perk to grant automatically when users complete a course
  - Added "Förmån vid slutförande" dropdown in course Settings tab
  - CourseForm now accepts `availablePerks` prop and `grantPerkId` state
  - `createCourse` and `updateCourse` actions insert/update `course_perks` table
  - Files: `/components/staff/course-form.tsx`, `/staff/kurser/actions.ts`, `/staff/kurser/new/page.tsx`
- **Bug Fix: Förmåner Page Navigation** - Fixed redirect loop by using getSelectedOrganization() with fallback to first org
- **Bug Fix: Perk Creation RLS Policy** - Fixed INSERT policy that was comparing profile_id to auth.uid() (should be user_id)
- **Bug Fix: createPerkType Missing Columns** - Added required org_id and slug columns to INSERT query
- **Bug Fix: Staff Statistics Page** - Fixed member count query and activity column names


## 2025-12-07
- **Bug Fix: Chat Unread Notification Badge** - Fixed unread badge not clearing after viewing messages
- **Feature: Staff Member Actions Menu** - Added comprehensive member management dropdown in `/staff/medlemmar`
  - New "Hantera" button with Kräv nytt alias, Skicka varning, Ta bort från chattgrupper, etc.
- **Bug Fix: Visa uppgifter button** - Fixed "Kunde inte hämta personuppgifter" error
- **Bug Fix: Fritidsgård Activities Not Showing** - Fixed activities not displayed on organization detail pages
- **Feature: SEO-Friendly URLs for /app/fritidsgardar** - Implemented slug-based URLs

## 2025-12-06
- **UI/UX: Room Management Page Improvements** - Redesigned `/staff/rum` and `/staff/rum/new` pages
  - Compact inline filter layout with status pills (color-coded: Väntar=amber, Godkänd=green, etc.)
  - Added "Rensa filter" button for quick filter reset
  - Moved Perk "+" button to text link "Skapa ny behörighet" below dropdown for better mobile layout
  - Added custom image upload option alongside Unsplash in room cover section
  - New `uploadRoomCover` server action for handling file uploads (max 5MB, JPG/PNG/WEBP)
  - Improved mobile responsiveness with stacked layouts on smaller screens
- **Feature: Verified Profile Badge on Staff Medlemmar** - Added verified/unverified profile indicator icons
  - Added shield icons next to member avatars in `/staff/medlemmar` page
  - Blue `ShieldCheck` icon shows for verified profiles, gray `Shield` icon for unverified profiles
  - Updated `getMembers` and `getMemberByProfileId` actions to fetch `is_verified` field from profiles
  - Both desktop table view and mobile card view now display the verification status
- **UI/UX: Membership Settings Redesign** - Complete refactor of `/staff/installningar` → Medlemskap tab
  - Implemented list-first layout showing existing memberships as primary view
  - Added Active/Expired tabs with count badges for filtering membership types
  - Converted create/edit form into modal dialog for cleaner experience
  - Replaced 2-column layout with responsive card grid (1-3 columns)
  - Each card shows mini preview, price, approval type, and date range
  - Added "Skapa ny period" button in header for creating new memberships
  - Added "Redigera" button on each card for inline editing
  - Fixed scroll overlap issue (removed sticky positioning from preview panel)
  - Fixed "Kräv verifierad profil" description (removed BankID reference, now uses `profiles.is_verified`)
  - Preserved read-only mode for users with roleId < 3
- **Feature: Membership Statistics** - Added member count statistics to membership settings
  - Statistics overview cards showing Total, Active, and Pending member counts
  - Per-card member count showing active members for each membership type
  - New `getMembershipStats()` server action for data aggregation

## 2025-12-04
- **Security Fix: Activity Address Visibility** - Implemented database-level redaction for activity addresses.
  - Addresses are now returned as `NULL` from the database when `hide_address` is enabled, ensuring they are never exposed to the client.
  - Updated `v_explore_activities` view and `get_explore_activities` function.
- **Bug Fix: City Selection** - Fixed issue where `city_id` was not being stored correctly when creating activities.
- **Feature: SEO Slugs** - Implemented automatic SEO-friendly slug generation for new activities.

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
