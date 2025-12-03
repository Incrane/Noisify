# Sitemap & User Flows

## Sitemap

### Public Area (No Authentication)
- **`/` (Landing Page)**: Hero, Activities Preview, Org Showcase, Login/Register CTAs.
- **`/aktiviteter`**: Browse all public activities. Filter by date, org, category.
- **`/aktiviteter/[slug]`**: Activity details. CTA to login for registration.
- **`/organisationer`**: List of all organizations.
- **`/organisationer/[slug]`**: Organization details, contact info, activities.
- **`/for-organisationer`**: Info for prospective organizations.
- **`/for-organisationer/registrera`**: Organization onboarding wizard.
- **`/logga-in`**: User login (Email/Password, Magic Link).
- **`/registrera`**: Member registration (Age 10-20).
- **`/join`**: Guest join page for Open Quizzes.

### Authenticated App (Members)
- **`/app`**: Redirects to `/app/aktiviteter`.
- **`/app/aktiviteter`**: Personalized activity feed. Registration status, conflict warnings.
- **`/app/aktiviteter/[slug]`**: Activity details with "Anmäl dig" (Register) button.
- **`/app/fritidsgardar`**: List of youth centers. Membership application.
- **`/app/fritidsgardar/[slug]`**: Youth center details with "Anmäl dig" (Register) button.
- **`/app/mina-anmalningar`**: My Registrations (Upcoming, Active, Past, Invites).
- **`/app/profil`**: User profile settings, membership cards, interests.
- **`/app/profil/intressen`**: User interests settings.
- **`/app/profil/notiser`**: User notifications settings.
- **`/app/profil/konto`**: User profile and account settings.
- **`/app/profil/instegritet`**: User privacy and data settings.
- **`/app/profil/utseende`**: User interface settings.
- **`/app/profil/andra-losenord`**: User password change settings.
- **`/app/profil/radera-konto`**: User account deletion settings.
- **`/app/quiz`**: Live quiz player interface.

### Staff Dashboard (Role 2+)
- **`/staff`**: Dashboard overview (Today's activities, quick actions).
- **`/staff/verksamhet/medlemmar`**: Manage members, approve memberships.
- **`/staff/verksamhet/personal`**: Manage staff, approve memberships.
- **`/staff/verksamhet/installningar`**: Manage organization settings, öppettider, medlemskap inställningar, bland annat.
- **`/staff/verksamhet/statistik`**: Statistics overview, registrations, conflicts, capacity.
- **`/staff/aktiviteter`**: Create/Edit activities, manage registrations.
- **`/staff/aktiviteter/nytt`**: Create new activity.
- **`/staff/aktiviteter/[slug]/redigera`**: Edit activity.
- **`/staff/kurser`**: Create/Edit courses, manage registrations.
- **`/staff/kurser/nytt`**: Create new course.
- **`/staff/kurser/[slug]/redigera`**: Edit course.
- **`/staff/rum`**: Manage rooms, manage registrations.
- **`/staff/rum/nytt`**: Create new room.
- **`/staff/rum/[slug]/redigera`**: Edit room.
- **`/staff/chatt`**: Chat with members, create groups.
- **`/staff/quiz`**: Create/Host quizzes.
- **`/staff/quiz/nytt`**: Create new quiz.
- **`/staff/quiz/[id]/redigera`**: Edit quiz.
- **`/staff/quiz/host/[id]`**: Host quiz.

## Key User Flows

### 1. Activity Registration (Member)
1. **Browse**: User finds activity on `/app/aktiviteter`.
2. **Register**: Clicks "Anmäl dig".
3. **System Validation** (via `register_for_activity` RPC):
   - **Authentication**: Verifies user is logged in.
   - **Registration Open**: Checks `anmalningsfrist` (deadline) and `PUBLISHED` status.
   - **Eligibility**:
     - `OPEN_FOR_ALL`: No restrictions.
     - `ONLY_MEMBERS`: Verifies active membership in the organization.
     - `SELECTED_MEMBERS`: Checks specific criteria (e.g., age, tags).
   - **Conflicts**: Checks `has_registration_time_conflict()` for overlapping activities.
   - **Capacity**: Checks if `registrations_count` < `capacity`.
4. **Outcome**:
   - **Success**: Status set to `ACCEPTED` (or `PENDING` for manual approval/lottery).
   - **Waitlist**: If full, status set to `WAITLISTED`.
   - **Failure**: Returns specific error (e.g., "Fullbokad", "Krockar", "Kräver medlemskap").

### 2. Organization Onboarding
1. **Start**: Go to `/for-organisationer/registrera`.
2. **Account**: Create admin user account.
3. **Org Info**: Enter name, address, logo.
4. **Submit**: Organization created with `status: pending`.
5. **Approval**: System Admin approves organization.

### 3. Course Enrollment (Member)
1. **Browse**: User finds course on `/app/kurser` (or via search).
2. **Details**: Views syllabus, instructors, and schedule.
3. **Enroll**: Clicks "Gå kursen".
4. **Validation**: Checks eligibility (e.g., age, prerequisites) and capacity.
5. **Progress**:
   - **Enrolled**: Access to course material.
   - **In Progress**: Tracks completion of modules/lessons.
   - **Completed**: Receives certificate/confirmation.

### 4. Room Booking (Member/Staff)
1. **Find**: User browses rooms on `/app/lokaler` (Member) or `/staff/rum` (Staff).
2. **Check**: Selects date/time to check availability via `can_user_book_room_at_time`.
3. **Book**: Submits booking request.
4. **Validation**:
   - **Rules**: Checks membership perks and access rules.
   - **Conflicts**: Checks `has_room_booking_conflict`.
5. **Outcome**:
   - **Auto-Approve**: If rules allow, booking is confirmed immediately.
   - **Request**: Otherwise, status `PENDING` awaiting staff approval.

### 5. Chat & Messaging
1. **Access**: User opens `/app/chatt` (Member) or `/staff/chatt` (Staff).
2. **Connect**:
   - **Group**: Selects an active group (e.g., "Music Studio Team").
   - **DM**: Starts 1-on-1 with staff or allowed member.
3. **Interact**: Sends text/media. Real-time delivery via Supabase.
4. **Notify**: Recipients receive push/badge notifications.
5. **Moderate**: Staff can block users or delete messages if needed.

### 6. Staff: Create Activity
1. **Initiate**: Staff goes to `/staff/aktiviteter/nytt`.
2. **Draft**: Fills in details (Title, Time, Capacity, Description).
3. **Configure**:
   - **Registration**: Open/Members Only/Invite Only.
   - **Publishing**: Save as `DRAFT` or `PUBLISH` immediately.
4. **Create**: System runs `create_bulk_activities` (if recurring) or inserts single.
5. **Distribute**: Notifications sent to eligible members (if configured).

### 7. Live Quiz Participation
1. **Join**: User goes to `/app/quiz` (or `/join` for guests).
2. **PIN**: Enters 6-digit PIN provided by Host.
3. **Lobby**: Waits for host to start.
4. **Game**: Answers questions in real-time.
5. **Results**: Sees score and leaderboard.
