# Database Schema

**Database:** PostgreSQL 14+ (Supabase)
**Last Updated:** November 2025

## Core Tables

### `profiles`
Public user profile information.
- `profile_id` (UUID, PK): References `auth.users`.
- `alias` (Text): Display name.
- `fodd_ar` (Int): Birth year.
- `created_at`, `updated_at` (Timestamp).

### `organisations`
Youth recreation center organizations.
- `org_id` (UUID, PK).
- `name` (Text).
- `slug` (Text): Unique SEO-friendly identifier.
- `tier` (Enum): 'FREE', 'PRO', 'ENTERPRISE'.
- `max_members`, `max_staff`, `max_storage_mb` (Int): Subscription limits.
- `org_status` (Enum): 'pending', 'active', 'inactive', 'suspended'.

### `org_user`
Links profiles to organizations with roles.
- `org_user_id` (UUID, PK).
- `org_id` (UUID): References `organisations`.
- `profile_id` (UUID): References `profiles`.
- `role_id` (Int): 0-5 (See Overview).

### `activity`
Main activity/event table.
- `activity_id` (UUID, PK).
- `org_id` (UUID): Owner organization.
- `slug` (Text): Unique SEO-friendly identifier.
- `name`, `description` (Text).
- `activity_type` (Enum): 'NORMAL', 'RANDOM'.
- `status` (Enum): 'DRAFT', 'PUBLISHED', 'ARCHIVED'.
- `starts_at`, `ends_at` (Timestamp).
- `capacity`, `waitlist_capacity` (Int).

### `registration`
Activity registrations.
- `registration_id` (UUID, PK).
- `activity_id` (UUID).
- `profile_id` (UUID).
- `status` (Enum): 'PENDING', 'INVITED', 'ACCEPTED', 'REJECTED', 'WAITLISTED'.

### `courses`
Multi-session courses.
- `course_id` (UUID, PK).
- `title`, `description` (Text).
- `status` (Enum): 'DRAFT', 'PUBLISHED', 'ARCHIVED'.

### `quizzes`
Live quiz containers.
- `id` (UUID, PK).
- `org_id` (UUID).
- `title` (Text).
- `is_public` (Boolean): Shared to Community Library.
- `cloned_from` (UUID): Reference to original quiz if cloned.

### `quiz_sessions`
Live game sessions.
- `id` (UUID, PK).
- `quiz_id` (UUID).
- `pin_code` (Text): Unique 6-digit PIN.
- `status` (Enum): 'LOBBY', 'IN_PROGRESS', 'FINISHED'.
- `access_policy` (Enum): 'ORG_ONLY', 'OPEN'.

## Key Views

### `activity_dashboard`
Real-time comprehensive activity overview.
- Calculates `totala_anmalningar`, `lediga_platser`, `kapacitetsstatus`.
- Formats dates and times for Swedish locale.

### `members_activities`
Personalized activity browse for members.
- Shows registration status, eligibility, and time conflicts.

## Storage Buckets
1. **`aktiviteter`**: Activity images (Public).
2. **`avatars`**: User profile pictures (Public).
3. **`public_images`**: General assets (Public).
4. **`unsplash`**: Cached Unsplash images (Public).

## Edge Functions
1. **`geocode-address`**: Geocodes addresses.
2. **`unsplash-proxy-2`**: Proxies Unsplash API.
3. **`download-and-store-unsplash`**: Downloads and stores images.
4. **`invite-magiclink`**: Sends invitation emails.
