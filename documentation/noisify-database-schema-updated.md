# Noisify Database Schema Documentation

**Generated:** November 25, 2025 (Updated)  
**Database:** PostgreSQL 14+ (Supabase)  
**Total Tables:** 93  
**Total Views:** 37  
**Total RPC Functions:** 85  
**Total Edge Functions:** 4  
**Total Storage Buckets:** 5

---

## Table of Contents

- [Overview](#overview)
- [Recent Updates](#recent-updates)
- [Core Tables](#core-tables)
- [Chat System Tables](#chat-system-tables)
- [Organization Onboarding](#organization-onboarding)
- [Views](#views)
- [RPC Functions](#rpc-functions)
- [Edge Functions](#edge-functions)
- [Storage Buckets](#storage-buckets)
- [Enums](#enums)
- [Security Summary](#security-summary)

---

## Overview

The Noisify database is designed for a multi-tenant SaaS platform managing Swedish youth recreation centers. It serves 18 organizations in Göteborg, handling activities, courses, memberships, room bookings, and real-time chat for teenagers aged 10-20.

**Key Features:**
- Row Level Security (RLS) enabled on all 88 tables
- Multi-tenant isolation by organization
- GDPR-compliant with separate PII storage
- Real-time capable with Supabase subscriptions
- Swedish language throughout
- 85 RPC functions for complex operations
- 4 Edge Functions for external integrations
- 5 Storage buckets for media management

---

## Recent Updates

### November 2024 Major Changes

**New Features:**
- ✅ **Enhanced Membership System** - Added comprehensive membership features with expiry tracking
- ✅ **User Settings System** - Complete preferences including notifications, privacy, and display settings
- ✅ **Unified Member Views** - Created consistent `members_*` naming with Swedish labels
- ✅ **Profile Interests** - User can select interest categories for personalized recommendations
- ✅ **Notification System** - Comprehensive notification management with read/unread tracking
- ✅ **Favorites** - Users can favorite activities, courses, and organizations
- ✅ **Contact Persons** - Activities now have multiple contact persons
- ✅ **Course Dates** - Lessons can now have specific start/end dates
- ✅ **Chat System** - Real-time group messaging for organization members and staff (November 2025)
- ✅ **Organization Onboarding** - Self-service organization registration with wizard flow (November 2025)
- ✅ **SEO Slugs** - Added `slug` columns to organizations and activities for friendly URLs (November 2025)
- ✅ **Live Quiz System** - Kahoot-style interactive quiz feature (November 2025)

**Security Improvements:**
- ✅ Fixed all SECURITY DEFINER functions with proper `search_path`
- ✅ Comprehensive RLS policy audit and fixes
- ✅ Added immutability enforcement triggers
- ✅ Fixed infinite recursion issues in policies

**Bug Fixes:**
- ✅ Removed deprecated `fodd_ar` (birth year) references
- ✅ Fixed course module/lesson RLS policies
- ✅ Fixed activity organization SELECT policies
- ✅ Cleaned up duplicate functions


---

## Core Tables

*For complete table documentation including all 88 tables, see the original `noisify-database-schema.md` file.*

**Key Tables:**
- `profiles` (23 rows) - Public user profiles
- `users_private` (20 rows) - GDPR-protected PII
- `user_settings` (28 rows) - User preferences
- `organizations` (1 row) - Youth centers (with status tracking for onboarding)
  - Added `slug` column (unique text) for SEO friendly URLs
- `org_user` (11 rows) - Organization memberships
- `activity` (21 rows) - Activities/events
  - Added `slug` column (unique text) for SEO friendly URLs
- `registration` (29 rows) - Activity registrations
- `memberships` (6 rows) - Organization memberships
- `courses` (8 rows) - Multi-session courses
- `rooms` (10 rows) - Bookable spaces
- `room_bookings` (24 rows) - Room reservations
- `notifications` (29 rows) - User notifications
- `activity_favorites` (15 rows) - Favorited activities
- `chat_groups` - Chat groups/conversations
- `chat_participants` - Group membership with roles
- `chat_messages` - Real-time messages
- `quizzes` - Live quiz containers
- `quiz_questions` - Quiz questions with options
- `quiz_sessions` - Live game sessions
- `quiz_participants` - Players in sessions
- `quiz_answers` - Individual answer tracking

### `org_user`
Organization membership and roles

```typescript
interface OrgUser {
  org_user_id: string;         // UUID, primary key
  org_id: string;              // References organisation
  profile_id: string;          // References profile
  role_id: number;             // 1=Vikarie, 2=Staff, 3=Unit Manager, 4=Org Admin, 5=System Developer
  joined_at: string;           // Timestamp
}
```

---

## Chat System Tables

### `chat_groups`
Chat groups/conversations for organization members and staff

```typescript
interface ChatGroup {
  id: string;                  // UUID, primary key
  org_id: string;              // References organization
  name: string | null;         // Optional group name
  created_by: string;          // Profile ID of creator
  created_at: string;          // Timestamp
  is_active: boolean;          // Default: true
}
```

**Purpose:** Manages chat conversations within organizations. Groups can be named (e.g., "Staff Team") or unnamed (auto-generated from participants for 1-on-1 chats).

**Access Control:**
- Users can only see groups they are participants in
- Staff can create groups and invite members
- RLS policies ensure organization isolation

### `chat_participants`
Group membership with role-based permissions

```typescript
interface ChatParticipant {
  id: string;                  // UUID, primary key
  group_id: string;            // References chat_groups
  profile_id: string;          // References profiles
  role: 'admin' | 'member';    // Participant role
  joined_at: string;           // Timestamp
  is_blocked: boolean;         // Default: false
  last_read_at: string;        // Timestamp, default now()
}
```

**Purpose:** Links users to chat groups with role-based permissions.

**Roles:**
- `admin` - Can add/remove participants, change group settings
- `member` - Can send messages, view history

**Features:**
- Block functionality for moderation
- Join timestamp for chronological participant tracking

### `chat_messages`
Real-time chat messages

```typescript
interface ChatMessage {
  id: string;                  // UUID, primary key
  group_id: string;            // References chat_groups
  sender_id: string;           // Profile ID of sender
  content: string;             // Message text
  created_at: string;          // Timestamp
}
```

**Purpose:** Stores individual messages within chat groups.

**Features:**
- Real-time delivery via Supabase Realtime subscriptions
- Timestamped for chronological ordering
- RLS ensures only group participants can view messages

**Real-time Subscriptions:**
```typescript
supabase
  .channel(`chat:${groupId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'chat_messages',
    filter: `group_id=eq.${groupId}`
  }, handleNewMessage)
  .subscribe();
```

### Chat System Usage

**Routes:**
- Member chat: `/app/chatt`
- Staff chat: `/staff/chatt`

**Key Features:**
- ✅ Group conversations
- ✅ 1-on-1 messaging
- ✅ Real-time message delivery
- ✅ Staff can initiate chats with members
- ✅ Organization-scoped chat groups
- ✅ Role-based permissions (admin/member)
- ✅ Block functionality
- ✅ Group settings management

**Components:**
- `ChatProvider` - Context provider with real-time subscriptions
- `ChatList` - Displays chat groups
- `ChatWindow` - Message thread view
- `MessageInput` - Message composition
- `CreateGroupModal` - New group creation
- `GroupSettingsModal` - Manage participants and settings

---

## Live Quiz System

### Overview
The Live Quiz system provides Kahoot-style interactive quizzes for youth recreation centers. Staff can create quizzes and host live sessions, while youth participate via their mobile devices.

### `quizzes`
Static quiz containers that hold questions.

```typescript
interface Quiz {
  id: string;                    // UUID, primary key
  org_id: string;                // References organizations
  created_by: string;            // References profiles
  title: string;                 // Quiz title
  description: string | null;    // Optional description
  cover_image_url: string | null;// Cover image
  category: string;              // e.g., 'Musik', 'Sport', 'Allmänt'
  is_public: boolean;            // If true, appears in Community Library
  cloned_from: string | null;    // Tracks original if cloned
  created_at: string;
  updated_at: string;
}
```

### `quiz_questions`
Questions belonging to a quiz.

```typescript
interface QuizQuestion {
  id: string;                    // UUID, primary key
  quiz_id: string;               // References quizzes
  question_text: string;         // The question
  time_limit_seconds: number;    // 5-120 seconds
  order_index: number;           // Question order
  options: {                     // JSONB array
    text: string;
    isCorrect: boolean;
  }[];
  created_at: string;
}
```

### `quiz_sessions`
Live game sessions with real-time state.

```typescript
interface QuizSession {
  id: string;                    // UUID, primary key
  quiz_id: string;               // References quizzes
  org_id: string;                // References organizations
  host_id: string;               // References profiles
  pin_code: string;              // 6-digit unique PIN
  status: 'LOBBY' | 'IN_PROGRESS' | 'SHOWING_RESULTS' | 'LEADERBOARD' | 'FINISHED';
  access_policy: 'ORG_ONLY' | 'OPEN'; // Who can join
  current_question_index: number;// -1 = not started
  current_state: 'WAITING_FOR_HOST' | 'COUNTDOWN' | 'QUESTION_ACTIVE' | 'SHOW_ANSWER' | 'SHOW_LEADERBOARD';
  question_started_at: string | null;
  created_at: string;
  ended_at: string | null;
}
```

### `quiz_participants`
Players in a session.

```typescript
interface QuizParticipant {
  id: string;                    // UUID, primary key
  session_id: string;            // References quiz_sessions
  profile_id: string | null;     // Nullable for guests
  guest_name: string | null;     // Used if profile_id is null
  nickname: string;              // Display name in game
  score: number;                 // Total points
  streak: number;                // Current correct answer streak
  last_answer_at: string | null;
  joined_at: string;
}
```

### `quiz_answers`
Individual answer tracking.

```typescript
interface QuizAnswer {
  id: string;                    // UUID, primary key
  session_id: string;            // References quiz_sessions
  participant_id: string;        // References quiz_participants
  question_index: number;        // Which question
  selected_option: number;       // 0-3 answer index
  is_correct: boolean;
  time_taken_ms: number;         // For time bonus calculation
  points_earned: number;
  created_at: string;
}
```

### Points Calculation
- **Base Points:** 1000 for correct answer
- **Time Bonus:** Up to 500 extra for quick answers
- **Streak Bonus:** 10% per streak level (max 50%)

### Real-time Subscriptions
```typescript
// Subscribe to session changes
supabase
  .channel(`quiz_session_${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'quiz_sessions',
    filter: `id=eq.${sessionId}`
  }, handleSessionUpdate)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'quiz_participants',
    filter: `session_id=eq.${sessionId}`
  }, handleParticipantUpdate)
  .subscribe();
```

---

## Organization Onboarding

### Overview
The organization onboarding system allows Swedish youth recreation centers to self-register through a guided wizard interface at `/for-organisationer/registrera`.

### `organizations` - Enhanced Status Tracking

**New Field:**
```typescript
org_status?: 'pending' | 'active' | 'inactive' | 'suspended';
```

**Status Workflow:**
1. **pending** - Organization registered via wizard, awaiting admin approval
2. **active** - Approved and operational (default for existing organizations)
3. **inactive** - Temporarily deactivated
4. **suspended** - Blocked from platform access

### Onboarding Wizard Flow

**Route:** `/for-organisationer/registrera`

**Steps:**
1. **User Account Creation**
   - Email verification
   - Password setup
   - Profile creation

2. **Organization Information**
   - Organization name
   - Contact details
   - Address
   - Logo upload

3. **Submission**
   - Organization created with `org_status: 'pending'`
   - User linked via `org_user` with owner role
   - Admin receives notification for approval

**Visibility Rules:**
- `pending` organizations are **NOT** publicly visible
- Only appear in admin dashboard for review
- User can access staff dashboard but limited functionality until approved

**Components:**
- `OrganizationWizard` - Multi-step registration form
- Form validation with Swedish language support
- Image upload for organization logo
- Address geocoding integration

**Security:**
- New organizations require admin approval
- RLS policies prevent unauthorized access
- Email verification required
- GDPR-compliant data handling

---

## Subscription System

### `organizations` - Tier & Limits
The organization table now includes subscription tier and resource limits.

```typescript
interface Organization {
  // ... existing fields ...
  tier: 'FREE' | 'PRO' | 'ENTERPRISE'; // Default: 'FREE'
  max_members: number;                 // Default: 100
  max_staff: number;                   // Default: 3
  max_storage_mb: number;              // Default: 500
}
```

**Tiers:**
- **FREE**: Entry level, limited to 100 members, 3 staff.
- **PRO**: Growth tier, 1000 members, 10 staff, priority support.
- **ENTERPRISE**: Custom limits, SSO, SLA.

**Logic:**
Application logic checks these limits before adding members, staff, or uploading files.

---

## Notification System

### `notifications`
Centralized notification system for users and staff.

```typescript
interface Notification {
  id: string;                  // UUID, primary key
  org_id: string | null;       // Optional org context
  assigned_user_id: string;    // Recipient profile ID
  related_user_id: string | null; // User who triggered action
  activity_id: string | null;  // Related activity
  course_id: string | null;    // Related course
  type: string;                // Enum: activity_invitation, etc.
  title: string;               // Display title
  message: string | null;      // Optional body
  link_url: string | null;     // Action link
  is_read: boolean;            // Default: false
  created_at: string;
}
```

**Features:**
- Real-time delivery via Supabase subscriptions
- Polymorphic relationships (Activity, Course, User)
- Read/Unread tracking
- Batch operations (mark all read)

---



### Member Views (`members_*` - Unified Swedish naming)

| View Name | Purpose | Key Features |
|-----------|---------|--------------|
| `members_activities` | Personalized activity browse | Registration status, eligibility, conflicts |
| `members_schedule` | User's activity calendar | Upcoming/ongoing/past categorization |
| `members_dashboard` | Membership overview | Engagement metrics, expiry tracking |
| `members_recommended` | AI recommendations | Score-based matching algorithm |
| `members_organizations` | User's organizations | Role info, membership status |
| `members_courses` | Course enrollments | Progress tracking |
| `members_bookings` | Room bookings | Cancellation capability |
| `members_favorites` | All favorites | Activities, courses, organizations |
| `members_notifications` | User notifications | Time categorization |
| `members_quick_actions` | Action items | Invitations, deadlines, waitlists |
| `members_search` | Unified search | Activities, courses, orgs, rooms |

### Activity Views

| View Name | Purpose | Key Features |
|-----------|---------|--------------|
| `activity_dashboard` | Real-time overview | Capacity status, registration counts |
| `v_explore_activities` | Public browsing | Discovery algorithm |

### Course Views

| View Name | Purpose | Key Features |
|-----------|---------|--------------|
| `course_dashboard` | Course overview | Enrollment stats |
| `course_detail` | Detailed view | Instructors, tags, JSONB |
| `public_courses` | Public listing | PUBLISHED only |
| `user_course_progress` | User progress | Completion tracking |

### Room Views

| View Name | Purpose | Key Features |
|-----------|---------|--------------|
| `room_booking_dashboard` | Room management | Today's bookings, status |
| `room_booking_details` | Booking details | Approval info |
| `room_time_slot_summary` | Time slot rules | Allowed subgroups |

**Total Views:** 37

---

## RPC Functions

### Activity Functions (7 functions)

#### `create_bulk_activities()`
Creates multiple activities with recurring patterns.
- **Security:** SECURITY DEFINER
- **Parameters:** 25+ including dates, repeat days, categories, contact persons
- **Returns:** JSON with created activity IDs

#### `register_for_activity(p_activity_id)`
Registers current user for an activity.
- **Validation:** Status, deadline, conflicts, rules, capacity
- **Returns:** JSON with Swedish messages

#### `cancel_registration(p_registration_id)`
Cancels a registration.
- **Rules:** Only before activity starts
- **Returns:** JSON with Swedish messages

#### `respond_to_invitation(p_registration_id, p_accept)`
Accept or reject an invitation.
- **Status:** INVITED → ACCEPTED/REJECTED
- **Returns:** JSON with Swedish messages

### Course Functions (12 functions)

#### `create_or_update_course()`
Comprehensive course creation/update.
- **Features:** Tags (names OR UUIDs), instructors, modules
- **Returns:** JSON with complete course data

#### `add_instructor_to_course(p_course_id, p_instructor_id)`
Adds instructor to course.
- **Parameters:** course_id, instructor_id, is_primary, sort_order
- **Returns:** course_instructors ID

#### `get_or_create_instructor_from_profile()`
Gets/creates instructor from profile.
- **Returns:** Instructor UUID

#### `add_tag_to_course(p_course_id, p_tag_name)`
Adds tag to course by name.
- **Returns:** Tag UUID

#### `get_available_tags()`
Lists all tags with usage count.
- **Returns:** Table of tags

### User & Profile Functions (10 functions)

#### `signup_member()`
Complete member account creation.
- **Validation:** Age 13+, alias availability
- **Returns:** JSON with user data

#### `check_alias_availability(p_alias)`
Checks if alias is available.
- **Validation:** Format, blocked list, taken
- **Returns:** JSON with status

#### `upsert_user_interests(p_category_ids)`
Updates user interest categories.
- **Behavior:** Replaces all interests atomically
- **Returns:** Table of interest records

#### `get_my_profile_id()`
Returns current user's profile_id.
- **Note:** Use instead of JOIN for performance
- **Returns:** UUID

### Room Booking Functions (8 functions)

#### `can_user_book_room(room_uuid)`
Checks booking eligibility.
- **Checks:** Rules, membership, perks
- **Returns:** Boolean

#### `can_user_book_room_at_time(room_uuid, booking_time)`
Enhanced eligibility with time slot rules.
- **Returns:** Boolean

#### `has_room_booking_conflict(room_uuid, start_time, end_time)`
Checks for time conflicts.
- **Returns:** Boolean

### Notification Functions (7 functions)

#### `create_notification()`
Creates notification with metadata.
- **Parameters:** 11 including related entities
- **Returns:** Notification UUID

#### `mark_notification_as_read(p_notification_id)`
Marks single notification as read.
- **Returns:** Boolean

#### `mark_all_notifications_as_read()`
Marks all notifications as read.
- **Returns:** Count

#### `get_unread_notification_count()`
Gets unread notification count.
  RETURN v_count;
END;
$$;

### Chat Functions (2 functions)

#### `mark_chat_as_read(p_group_id)`
Updates `last_read_at` for the current user in the specified group.
- **Returns:** VOID

#### `get_unread_chat_count()`
Returns the number of groups with unread messages for the current user.
- **Returns:** Integer

### Helper Functions (41 functions)

Key helpers include:
- `is_activity_org_staff()` - Check staff permission
- `is_org_staff()` - Check org staff status
- `has_registration_time_conflict()` - Check time conflicts
- `is_eligible_member()` - Check membership
- `is_registration_open()` - Check deadline
- `toggle_favorite()` - Toggle favorite status

**Total RPC Functions:** 85

---

## Edge Functions

### 1. `geocode-address`
**Purpose:** Geocodes addresses using external API  
**JWT:** No authentication required  
**Version:** 6

```typescript
fetch('/functions/v1/geocode-address', {
  method: 'POST',
  body: JSON.stringify({ address: "Göteborg, Sweden" })
});
```

---

### 2. `unsplash-proxy-2`
**Purpose:** Proxies Unsplash API with authentication  
**JWT:** Requires authentication  
**Version:** 2

```typescript
fetch('/functions/v1/unsplash-proxy-2', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ query: "nature", per_page: 20 })
});
```

---

### 3. `download-and-store-unsplash`
**Purpose:** Downloads and stores Unsplash images  
**JWT:** Requires authentication  
**Version:** 4 (Last updated: 2025-02-08)

```typescript
fetch('/functions/v1/download-and-store-unsplash', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    unsplash_id: "photo_id",
    download_url: "https://images.unsplash.com/...",
    credit_name: "Photographer",
    credit_username: "username"
  })
});
```

---

### 4. `invite-magiclink`
**Purpose:** Sends magic link invitations  
**JWT:** Requires authentication  
**Version:** 6

```typescript
fetch('/functions/v1/invite-magiclink', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    email: "user@example.com",
    org_id: "uuid",
    role_id: 2
  })
});
```

---

## Storage Buckets

### 1. `aktiviteter`
- **Purpose:** Activity images and media
- **Public:** Yes
- **Limit:** 50 MB
- **Created:** 2025-10-04

```
aktiviteter/
  └── {activity_id}/
      ├── hero.jpg
      └── gallery/
          ├── img1.jpg
          └── img2.jpg
```

### 2. `avatars`
- **Purpose:** User profile pictures
- **Public:** Yes
- **Limit:** None
- **Created:** 2025-09-14

```
avatars/
  ├── {profile_id}.jpg
  └── {profile_id}.png
```

### 3. `public_images`
- **Purpose:** General public images
- **Public:** Yes
- **Limit:** None
- **Created:** 2025-09-13

```
public_images/
  ├── logos/
  ├── banners/
  └── misc/
```

### 4. `unsplash`
- **Purpose:** Cached Unsplash images
- **Public:** Yes
- **Limit:** None
- **Created:** 2025-09-18

```
unsplash/
  └── {unsplash_id}.jpg
```

### 5. `avatar` (Legacy)
- **Purpose:** Legacy bucket (prefer `avatars`)
- **Public:** Yes
- **Created:** 2025-11-23

**Total Buckets:** 5

---

## Enums

### Activity & Registration
- `activity_status`: DRAFT, PUBLISHED, ARCHIVED
- `activity_type`: NORMAL, RANDOM
- `registration_rules`: OPEN_FOR_ALL, ONLY_MEMBERS, SELECTED_MEMBERS
- `registration_status`: PENDING, INVITED, ACCEPTED, REJECTED, WAITLISTED, LOTTERY_REJECTED
- `visibility`: PUBLIC, PRIVATE

### Courses
- `course_status`: DRAFT, PUBLISHED, ARCHIVED
- `course_access_level`: OPEN_FOR_ALL, ONLY_MEMBERS, SELECTED_MEMBERS
- `enrollment_status`: ENROLLED, IN_PROGRESS, COMPLETED, DROPPED

### Rooms
- `room_type`: MEETING_ROOM, STUDIO, WORKSHOP_SPACE, CREATIVE_LAB, OTHER
- `room_status`: ACTIVE, INACTIVE, MAINTENANCE
- `room_booking_status`: PENDING, APPROVED, REJECTED, CANCELLED, COMPLETED
- `booking_rule`: OPEN_FOR_ALL, MEMBERS_ONLY, REQUIRES_PERK, STAFF_ONLY
- `amenity_type`: PROJECTOR, WHITEBOARD, SOUND_SYSTEM, PIANO, etc.

### Memberships & Perks
- `membership_state`: active, pending, expired, suspended, etc.
- `perk_category`: ROOM_ACCESS, DISCOUNT, PRIORITY_BOOKING, OTHER
- `perk_status`: ACTIVE, EXPIRED, REVOKED
- `perk_grant_condition`: ON_REGISTRATION, ON_APPROVAL, ON_COMPLETION

### Users
- `account_type`: digital, local
- `personal_status`: aktiv, inbjuden, ansökt, nekad, onboarding, inaktiv

### Chat
- `chat_participant_role`: admin, member

### Organizations
- `org_status`: pending, active, inactive, suspended
- `pricing_tier`: FREE, PRO, ENTERPRISE

---

## Security Summary

### RLS Status
✅ **All 88 tables** have RLS enabled (except `temp_test_users` - intentional)

### Fixed Security Issues (November 2024)
1. ✅ SECURITY DEFINER functions now use `SET search_path = public, pg_temp`
2. ✅ Comprehensive RLS policy audit completed
3. ✅ Immutability enforcement triggers added
4. ✅ Infinite recursion in policies fixed

### Remaining Security Issues

⚠️ **Missing Unique Constraints:**
- `org_user` - (org_id, profile_id)
- `memberships` - (org_id, profile_id)

⚠️ **Nullable Critical Foreign Keys:**
- `profiles.user_id` should be NOT NULL
- `org_user.user_id` should be NOT NULL

---

## Usage Examples

### Activity Registration
```sql
-- Check eligibility
SELECT kan_anmala_sig, anledning_kan_inte_anmala 
FROM members_activities 
WHERE aktivitet_id = 'uuid';

-- Register
SELECT register_for_activity('uuid');

-- Check status
SELECT * FROM members_schedule 
WHERE aktivitet_id = 'uuid';
```

### Course Management
```sql
-- Create course
SELECT create_or_update_course(
  p_name := 'Karate',
  p_owner_org_id := 'uuid',
  p_created_by := get_my_profile_id(),
  p_tag_names := ARRAY['Martial Arts'],
  p_modules := '[...]'::jsonb
);
```

### Notifications
```sql
-- Create
SELECT create_notification(
  p_assigned_user_id := 'uuid',
  p_type := 'activity_invitation',
  p_title := 'Ny inbjudan'
);

-- Get unread count
SELECT get_unread_notification_count();

-- Mark all read
SELECT mark_all_notifications_as_read();
```

### Room Booking
```sql
-- Check eligibility
SELECT can_user_book_room_at_time(
  'room-uuid',
  '2024-11-25 14:00:00+00'
);

-- Check conflicts
SELECT has_room_booking_conflict(
  'room-uuid',
  '2024-11-25 14:00:00+00',
  '2024-11-25 16:00:00+00'
);
```

---

## Recent Migrations (Last 20)

1. `add_membership_features` - Enhanced membership system
2. `update_memberships_rls` - Updated membership RLS
3. `fix_rpc_functions_remove_fodd_ar` - Removed deprecated field
4. `fix_rpc_column_names` - Fixed column naming
5. `add_get_org_members_json` - Organization members JSON
6. `update_get_activity_registrations_json_v2` - Updated registrations
7. `add_get_activity_registrations_json` - Activity registrations
8. `fix_rls_functions_profile_link_v2` - Fixed profile linking
9. `fix_modules_lessons_rls` - Fixed course RLS
10. `fix_courses_select_policy` - Fixed course policy
11. `add_dates_to_course_lessons` - Added lesson dates
12. `create_test_users_preparation` - Test data prep
13. `create_test_organization_v2` - Test organization
14. `add_kan_avregistrera_to_member_activities_view` - Cancel capability
15. `create_member_activities_view` - Member activities view
16. `remove_reserve_capacity_constraint` - Capacity constraint
17. `fix_activity_organisation_select_policy_allow_all` - Activity org policy
18. `drop_old_create_bulk_activities_function` - Cleanup
19. `add_city_id_param_to_create_bulk_activities` - City parameter
20. `add_notification_check_helper_function` - Notification helper

---

## Performance Tips

1. **Use RPC functions** instead of complex queries:
   ```sql
   SELECT get_my_profile_id() -- Fast
   -- Instead of: SELECT id FROM profiles WHERE user_id = auth.uid()
   ```

2. **Use member views** for common patterns:
   ```sql
   SELECT * FROM members_activities -- Pre-filtered, optimized
   -- Instead of: Complex JOIN query
   ```

3. **Leverage indexes** on foreign keys and frequently queried columns

4. **Use real-time subscriptions** sparingly - they consume resources

---

**Document Version:** 2.1  
**Last Updated:** November 23, 2025  
**Database Version:** PostgreSQL 14+  
**Platform:** Supabase  
**Project:** Noisify - Youth Recreation Center Management
