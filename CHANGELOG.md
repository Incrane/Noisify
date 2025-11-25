# Changelog


## 2025-11-25
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
