# Page Structure & Routes

This document details the structure of every page in the Noisify application, organized by user role and area.

## 1. Public Area (Unauthenticated)

These pages are accessible to everyone and focus on discovery and onboarding.

### Landing Page (`/`)
- **Purpose**: First impression, value proposition, and entry point.
- **Components**:
  - **`SiteHeader`**: Navigation, City Selector (`CityModal`), Login/Register buttons.
  - **Hero Section**: "Hitta din grej" headline, animated background blobs, search bar (mockup), CTA buttons.
  - **`CityModal`**: Pop-up for selecting a city if no cookie is set.
  - **`ActivityCard` Grid**: Displays top 9 upcoming public activities.
  - **Filter Tags**: Horizontal scroll of categories (fetched from `categories` table).
  - **Org Showcase**: Grid of `OrganizationCard`s (fetched from `organizations` table).
  - **`SiteFooter`**: Links to legal pages, contact info, social media.
- **Data Requirements**:
  - `cities`: List of available cities.
  - `categories`: List of activity categories.
  - `organizations`: Active organizations in the selected city.
  - `activities`: Top 9 upcoming `PUBLISHED` activities with `PUBLIC` visibility.
- **User Actions**:
  - Select City (sets cookie).
  - Search/Filter activities (redirects to `/aktiviteter`).
  - Click "Logga in" / "Skapa konto".
  - Click Activity Card (navigates to details).

### Activities (`/aktiviteter`)
- **Purpose**: Browse and filter all public activities.
- **Components**:
  - **Filter Sidebar/Top**: Date picker, Category dropdown, Organization dropdown, Age slider.
  - **Activity Grid**: Infinite scroll of `ActivityCard` components.
  - **Empty State**: "Inga aktiviteter hittades" message.
- **Data Requirements**:
  - `activities`: Paginated list filtered by query params.
  - `filters`: Dynamic lists for categories and organizations.
- **User Actions**:
  - Apply filters.
  - Click Activity Card.

### Activity Details (`/aktiviteter/[slug]`)
- **Purpose**: Detailed information about a specific activity.
- **Components**:
  - **Header**: Cover image (Unsplash/Upload), Title, Organization Logo.
  - **Info Column**: 
    - Description (Rich Text).
    - Metadata: Date, Time, Location (`MapPin`), Age range, Price.
  - **Action Column**: 
    - "Logga in för att anmäla" button (redirects to login).
    - "Dela" button (Share API).
    - Organization Info Card.
- **Data Requirements**:
  - `activity`: Full details via `slug`.
  - `organization`: Owner details.
- **User Actions**:
  - View details.
  - Share activity.
  - Navigate to Organization profile.

### Organizations (`/organisationer`)
- **Purpose**: Directory of all youth centers.
- **Components**:
  - **Search Bar**: Filter by name.
  - **Grid**: List of `OrganizationCard`s showing logo, name, and active activity count.
- **Data Requirements**:
  - `organizations`: List of active organizations.

### Organization Details (`/organisationer/[slug]`)
- **Purpose**: Profile page for a youth center.
- **Components**:
  - **Header**: Logo, Cover Image, Name, Description.
  - **Tabs**: 
    - **"Om oss"**: Extended description, opening hours, contact info.
    - **"Aktiviteter"**: List of `ActivityCard`s owned by this org.
    - **"Kontakt"**: Map and address.
- **Data Requirements**:
  - `organization`: Full profile.
  - `activities`: List of future activities for this org.

### For Organizations (`/for-organisationer`)
- **Purpose**: B2B landing page to attract new youth centers.
- **Components**: 
  - Value Proposition ("För fritidsgårdar: alltid enkelt").
  - Feature Breakdown (Admin tools, Statistics).
  - Pricing Tiers (Free, Pro, Enterprise).
  - "Registrera er" CTA.

---

## 2. Authenticated App (Members)

Accessible only to logged-in users (Role 0+).

### Dashboard / Feed (`/app/aktiviteter`)
- **Purpose**: Personalized feed of activities.
- **Components**:
  - **`InvitationBanner`**: Alert for pending invites (e.g., "Du har 2 inbjudningar").
  - **"Mina närmaste aktiviteter"**: `ActivityListRow` for top 3 upcoming registered activities.
  - **"Alla aktiviteter"**: Grid of `ActivityCard`s.
  - **`DashboardFavorites`**: Horizontal scroll of favorited activities.
- **Data Requirements**:
  - `user`: Auth session.
  - `profile`: User profile ID.
  - `activities`: All published future activities.
  - `registrations`: User's status (`ACCEPTED`, `PENDING`, `WAITLISTED`, `INVITED`).
  - `favorites`: User's favorited activity IDs.
- **User Actions**:
  - View upcoming schedule.
  - Accept/Decline invites.
  - Click Activity Card (navigates to `/app/aktiviteter/[id]`).

### My Registrations (`/app/mina-anmalningar`)
- **Purpose**: Manage own participation.
- **Components**:
  - **Tabs**:
    - **"Kommande"**: List of `ACCEPTED` future registrations.
    - **"Förfrågningar"**: List of `INVITED` or `PENDING` requests.
    - **"Historik"**: List of past activities.
- **User Actions**:
  - Cancel registration ("Avanmäl").
  - Accept/Decline invites.

### Profile (`/app/profil`)
- **Purpose**: Manage user account and settings.
- **Components**:
  - **Sidebar**: Navigation to subpages.
  - **Main Content**:
    - **`/intressen`**: Toggle tags for activity recommendations.
    - **`/notiser`**: Checkboxes for Email/Push/SMS notifications.
    - **`/konto`**: Form to change Email, Password, or Delete Account.
    - **`/medlemskort`**: QR code generator for check-in.

### Live Quiz (`/app/quiz`)
- **Purpose**: Player interface for live quizzes.
- **Components**:
  - **PIN Entry**: Input field for 6-digit game code.
  - **Lobby**: Waiting screen with player list.
  - **Game View**: Question text, 4 answer buttons (Color/Shape coded).
  - **Results**: Scoreboard and rank.
- **Data Requirements**:
  - Real-time subscription to `quiz_sessions` and `quiz_participants`.

---

## 3. Staff Dashboard (Role 2+)

Accessible to Staff, Managers, and Admins.

### Overview (`/staff`)
- **Purpose**: Daily operations hub.
- **Components**:
  - **Stats Cards**: Total Members, Active Activities, Pending Requests.
  - **"Idag"**: List of activities happening today with check-in button.
  - **Quick Actions**: "Ny aktivitet", "Nytt utskick".

### Activity Management (`/staff/aktiviteter`)
- **Purpose**: CRUD for activities.
- **Components**:
  - **Data Table**: Sortable list of activities with status badges (`DRAFT`, `PUBLISHED`).
  - **Filters**: By date, status, category.
- **Create/Edit (`/nytt`, `/[id]/redigera`)**:
  - **`ActivityForm`**: Multi-step wizard.
    - **Basic Info**: Title, Rich Text Description, Category/Target Group (MultiSelect).
    - **Time & Place**: Date pickers, Address input.
    - **Image**: `UnsplashModal` or File Upload.
    - **Settings**: Capacity, Waitlist, Registration Rules (`OPEN`, `MEMBERS_ONLY`).
- **Activity Details (`/staff/aktiviteter/[id]`)**:
  - **Attendee List**: Table of registered users.
  - **Actions**: Check-in user, Move to Waitlist, Cancel User, Export List.

### Member Management (`/staff/verksamhet/medlemmar`)
- **Purpose**: CRM for organization members.
- **Components**:
  - **Member Table**: Name, Age, Membership Status, Last Active.
  - **Member Detail Modal**: Contact info, notes, ban toggle.
  - **Approval Queue**: List of pending membership applications.

### Settings (`/staff/verksamhet/installningar`)
- **Purpose**: Configure organization details.
- **Components**:
  - **Org Profile Form**: Name, Logo, Description.
  - **Membership Rules**: Toggle "Open Membership" vs "Application Required".
  - **Staff Management**: List of staff with Role assignment (2-4).

### Chat (`/staff/chatt`)
- **Purpose**: Communication with members.
- **Components**:
  - **Conversation List**: Sidebar with search.
  - **Chat Window**: Message history, input field, attachment button.
  - **Group Creator**: Modal to select members and name a group.

### Quiz Host (`/staff/quiz`)
- **Purpose**: Create and host quizzes.
- **Components**:
  - **Quiz Builder**: Form to add questions, answers, and time limits.
  - **Host Controller**: "Start Game", "Next Question", "Show Leaderboard" buttons.
  - **Live View**: Real-time participant count and answer stats.

---

## 4. Admin Area (Super Admin)

Accessible only to System Admins (Role 5).

### Dashboard (`/super_admin`)
- **Purpose**: Platform-wide oversight.
- **Components**:
  - **Org Table**: List of all organizations with status (`PENDING`, `ACTIVE`).
  - **User Search**: Global user lookup.
  - **System Logs**: Error rates and performance graphs.
