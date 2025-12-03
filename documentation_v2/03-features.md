# Feature Specifications

## 1. Activity Management
Comprehensive system for creating, managing, and participating in youth activities.

### Core Features
- **Creation Wizard**: Staff can create single or recurring activities with:
  - **Rich Text Editor**: Formatting tools for detailed descriptions.
  - **Unsplash Integration**: Built-in search for high-quality, royalty-free cover images.
  - **Multiple Contact Persons**: Assign multiple staff members as contacts.
- **Registration Logic**:
  - **Open**: Available to all eligible members.
  - **Members Only**: Restricted to active members of the organization.
  - **Invite Only**: Private activities requiring a direct invitation.
  - **Random Selection**: Fair lottery system for high-demand activities.
- **Power Ups**:
  - **Waitlist System**: Automatic waitlist handling when capacity is reached.
  - **Deadlines**: Set registration and confirmation deadlines.
  - **Targeting**: Restrict by age, gender, or specific target groups.
  - **Recurrence**: Create repeating activities (daily, weekly, monthly).
- **Conflict Detection**: Prevents users from registering for overlapping activities.
- **Attendance**: Digital check-in system for staff to track participation.

## 2. Course Platform
Educational platform for multi-session courses (e.g., music production, dance, coding).

### Core Features
- **Structure**: Courses are organized into modules and lessons.
- **Enrollment**: Users enroll in the entire course, tracking progress through lessons.
- **Instructors**: Dedicated instructor profiles linked to courses.
- **Tags & Categories**: Easy discovery via interest-based tagging.
- **Certificates**: (Planned) Digital certificates upon course completion.

## 3. Room Booking System
Resource management for booking physical spaces (studios, meeting rooms, halls).

### Core Features
- **Availability Calendar**: Real-time view of room availability.
- **Booking Rules**:
  - **Perk-based Access**: Some rooms require specific membership perks (e.g., "Studio License").
  - **Time Limits**: Restrictions on booking duration and frequency.
- **Approval Workflow**: Staff review and approve/reject booking requests.
- **Check-in**: Users must check in to their booking to retain the slot.

## 4. Chat & Messaging
Real-time communication tool to foster community and facilitate support.

### Core Features
- **Group Chats**: Staff-created groups for teams, projects, or interests.
- **Direct Messages**: 1-on-1 messaging between staff and members (with safety controls).
- **Moderation**: Staff can block users, delete messages, and manage participants.
- **Real-time**: Instant message delivery and read receipts via Supabase Realtime.
- **Notifications**: Push and in-app notifications for new messages.

## 5. Live Quiz System (Kahoot-style)
Interactive engagement tool for events and casual hangouts.

### Core Features
- **Host Mode**: Staff launch quizzes on a big screen.
- **Player Mode**: Youth join via PIN on their mobile devices.
- **Game Logic**:
  - Points for speed and accuracy.
  - Streak bonuses.
  - Live leaderboards.
- **Community Library**: Shared repository of quizzes across all organizations.

## 6. Membership & Roles
Flexible membership system handling access and privileges.

### Core Features
- **Digital Membership Cards**: QR-code based proof of membership.
- **Role-based Access**:
  - **Guest**: Limited access.
  - **Member**: Full access to their organization.
  - **Staff**: Management capabilities.
- **Perks**: Special privileges (e.g., "Free Coffee", "Studio Access") assigned to memberships.
- **Expiry Tracking**: Automated notifications for expiring memberships.

## 7. User Profile & Settings
Personalized hub for every user.

### Core Features
- **Interests**: Users select interests to get personalized activity recommendations.
- **Privacy Controls**: Manage data visibility and GDPR settings.
- **Notification Preferences**: Granular control over email and push notifications.
- **My Activities**: Centralized view of all registrations, bookings, and course progress.
- **Favorites**: Save interesting activities and organizations for later.

## 8. Organization Management
Tools for organizations to manage their presence and operations.

### Core Features
- **Onboarding Wizard**: Self-service setup for new organizations.
- **Staff Management**: Invite and manage staff roles and permissions.
- **Statistics**: Dashboard with key metrics (registrations, unique visitors, popular activities).
- **Customization**: Manage profile, location, opening hours, and social media links.
- **Subscription Tiers**: Free, Pro, and Enterprise levels with varying resource limits.
