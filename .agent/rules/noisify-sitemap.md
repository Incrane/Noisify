---
trigger: always_on
---

# Noisify - Sitemap & Navigation Structure

**Project:** Noisify - Swedish Youth Recreation Center Management Platform  
**Target Age Group:** 10-20 years  
**Version:** 1.0  
**Last Updated:** November 2025

---

## Key Updates & Corrections

### Target Audience
- **Age Range:** 10-20 years (corrected from 13-18)
- **Primary Entry Point:** Landing page with comprehensive content

### Landing Page Strategy
The landing page (`/`) is the **primary entry point** for most members and must:
- ✅ Display public activities (readable but not registerable)
- ✅ Showcase all organizations
- ✅ Preview courses (future)
- ✅ Include organization onboarding section
- ✅ Clear CTAs: "Logga in" and "Skapa konto"
- ✅ Activity registration requires login with message: **"Logga in eller skapa konto för att anmäla sig"** (or shorter alternative)

### New Public Pages
1. `/organisationer` - Browse all participating organizations
2. `/organisationer/:id` - Individual organization details
3. `/for-organisationer` - Organization onboarding and contact
4. `/kurser` & `/kurser/:id` - Courses (planned for future)

### Registration Flow
- Members (10-20 years) → `/registrera` (account creation)
- Organizations → `/for-organisationer` (onboarding inquiry)

---

## Table of Contents
1. [Public Area](#public-area)
2. [Authenticated User Area](#authenticated-user-area)
3. [Staff Dashboard](#staff-dashboard)
4. [Admin Area](#admin-area)
5. [Utility Pages](#utility-pages)
6. [Navigation Structure](#navigation-structure)
7. [Access Control Matrix](#access-control-matrix)

---

## Public Area
**Authentication Required:** ❌ No

### Routes

```
/
├── / (Home/Landing Page)
│   ├── Hero section
│   ├── Public activities preview
│   ├── Organizations showcase
│   ├── Courses preview
│   ├── How it works
│   └── CTAs: "Logga in" | "Skapa konto"
│
├── /aktiviteter (Browse Activities)
│   ├── Filter & search
│   ├── Activity cards grid
│   └── /aktiviteter/:id (Activity Detail - Public)
│       └── "Logga in eller skapa konto för att anmäla sig" CTA
│
├── /organisationer (Organizations)
│   ├── List of all organizations
│   └── /organisationer/:id (Organization Detail)
│       ├── Organization info
│       ├── Their activities
│       └── Contact information
│
├── /kurser (Courses - Future)
│   ├── Browse available courses
│   └── /kurser/:id (Course Detail)
│
├── /for-organisationer (Organization Onboarding)
│   ├── Information for organizations
│   ├── Benefits of joining
│   ├── Contact form to get started
│   └── Pricing/partnership info
│
├── /logga-in (Login)
│   └── Email/password or magic link
│
└── /registrera (Member Sign Up)
    ├── Create account flow for members (10-20 years)
    ├── Required: Email, Password, Alias, Birth year
    └── Email verification
```

### Page Details

#### `/` - Home/Landing Page
- **Purpose:** Primary landing page for all visitors (10-20 year olds)
- **Key Sections:**
  1. **Hero Section**
     - Compelling headline about youth activities in Göteborg
     - Main CTAs: "Logga in" and "Skapa konto" buttons
     - Eye-catching visual
  
  2. **Public Activities Preview**
     - Grid/slider of upcoming activities
     - Show: Image, Name, Date, Organization
     - "Visa alla aktiviteter" link → `/aktiviteter`
     - Clickable cards → `/aktiviteter/:id` (public view)
  
  3. **Organizations Showcase**
     - Grid of participating organizations
     - Organization logos and names
     - "Se alla organisationer" link → `/organisationer`
     - Clickable → `/organisationer/:id`
  
  4. **Courses Preview** (Future)
     - Highlight featured courses
     - "Utforska kurser" link → `/kurser`
  
  5. **How It Works**
     - 3-step process: Browse → Create account → Register
     - Simple icons and text
  
  6. **For Organizations Section**
     - Call-out box for organizations
     - "Är du en organisation?" heading
     - Brief benefits text
     - CTA button → `/for-organisationer`
  
  7. **Footer**
     - Contact info
     - Links to policies
     - Social media

- **Behavior:**
  - All activities visible but registration disabled
  - Clicking activity shows detail page
  - Registration CTA redirects to `/logga-in` or `/registrera`

- **SEO:** High priority, public indexing
- **Target:** First impression for young users (10-20 years)

#### `/aktiviteter` - Browse Activities
- **Purpose:** Public discovery of all activities
- **Features:**
  - Filter by: Organization, Date range, Categories, Target subgroups, Age range, Registration status
  - Sort by: Date (upcoming first), Spots available, Newest first
  - Activity cards showing: Image, Name, Organization, Date/time, Available spots, Registration badge
- **SEO:** High priority, public indexing

#### `/aktiviteter/:id` - Activity Detail (Public View)
- **Purpose:** Full activity information for non-authenticated users
- **Content:**
  - Activity image and description
  - Date, time, location
  - Target groups and categories
  - Capacity indicator
  - Organization information
  - **"Logga in eller skapa konto för att anmäla sig"** prominent CTA button
  - Alternative: **"Logga in för att anmäla dig"** (shorter version)
- **Behavior:**
  - Can view all activity details
  - Cannot register without authentication
  - CTA button → `/logga-in?redirect=/aktiviteter/:id`
- **SEO:** High priority, public indexing per activity

#### `/organisationer` - Organizations List
- **Purpose:** Showcase all participating youth recreation centers
- **Features:**
  - Grid/list of all active organizations
  - Organization cards with:
    - Logo
    - Name
    - Description (excerpt)
    - Number of upcoming activities
    - Location/area
  - Search/filter by area
  - Sort by name, activity count
- **Behavior:**
  - Clickable cards → `/organisationer/:id`
  - Public view (no authentication required)
- **SEO:** High priority, public indexing

#### `/organisationer/:id` - Organization Detail
- **Purpose:** Detailed information about a specific organization
- **Content:**
  1. **Organization Header**
     - Logo and name
     - Description
     - Contact information
     - Address
  
  2. **Upcoming Activities**
     - List of organization's public activities
     - Clickable → `/aktiviteter/:id`
  
  3. **About Section**
     - Full description
     - Photos/gallery (future)
  
  4. **Contact Section**
     - Email, phone
     - Social media links
     - Map/directions (future)
- **SEO:** High priority, public indexing per organization

#### `/kurser` - Courses (Future Enhancement)
- **Purpose:** Browse available multi-session courses
- **Features:**
  - Similar to activities browse
  - Filter by organization, category, age group
  - Course cards showing duration, sessions, cost
- **Status:** Planned for Phase 2

#### `/kurser/:id` - Course Detail (Future)
- **Purpose:** Detailed course information
- **Content:**
  - Course syllabus
  - Session schedule
  - Prerequisites
  - Registration requirements
- **Status:** Planned for Phase 2

#### `/for-organisationer` - Organization Onboarding
- **Purpose:** Information and signup for organizations wanting to join
- **Target Audience:** Youth recreation center administrators
- **Content:**
  1. **Hero Section**
     - "Är er fritidsgård redo att gå med?"
     - Value proposition for organizations
  
  2. **Benefits Section**
     - Easy activity management
     - Reach more youth
     - Streamlined registration
     - Real-time capacity tracking
     - Multi-organization collaboration
  
  3. **Features Showcase**
     - Screenshots/demos of staff dashboard
     - Key features list
     - Success stories/testimonials (future)
  
  4. **How It Works**
     - 3-step onboarding process
     - What you need to get started
     - Timeline expectations
  
  5. **Pricing/Partnership** (if applicable)
     - Pricing tiers or free model
     - Partnership terms
  
  6. **Contact Form**
     - Organization name
     - Contact person
     - Email
     - Phone
     - Message/questions
     - "Kontakta oss" submit button
  
  7. **FAQ Section**
     - Common questions from organizations
- **SEO:** Medium priority, public indexing
- **Follow-up:** Admin contacts organization to set up account

#### `/logga-in` - Login
- **Purpose:** User authentication
- **Methods:**
  - Email/password
  - Magic link (passwordless)
- **Redirect:** After login → `/app/aktiviteter` or last visited page

#### `/registrera` - Sign Up (Member Registration)
- **Purpose:** New member account creation (for youth aged 10-20)
- **Target:** Young people wanting to register for activities
- **Required Fields:**
  - Email (verified)
  - Password (strength validation)
  - Alias (display name, 3-50 characters)
  - Birth year (född år) - Must be 2005-2015 (ages 10-20)
- **Validation:**
  - Age verification (must be 10-20 years old)
  - Email uniqueness check
  - Password requirements
- **Flow:** 
  1. Fill registration form
  2. Email verification sent
  3. Verify email
  4. Profile completion
  5. → Redirect to `/app/aktiviteter` (browse activities)
- **Additional Features:**
  - "Redan medlem? Logga in" link
  - Terms of service acceptance checkbox
  - Parent/guardian consent for users under 13 (GDPR requirement)

---

## Authenticated User Area
**Authentication Required:** ✅ Yes  
**Role Required:** 0+ (All authenticated users)

### Routes

```
/app
├── /app/aktiviteter (Browse Activities - Logged In)
│   ├── Personal registration indicators
│   ├── Time conflict warnings
│   └── Quick actions
│
├── /app/aktiviteter/:id (Activity Detail - Logged In)
│   ├── Registration button/status
│   ├── Accept/Reject buttons (if invited)
│   └── Cancel registration
│
├── /app/fritidsgårdar (Youth Centers)
│   ├── List of all youth centers
│   └── /app/fritidsgårdar/:id (Youth Center Detail)
│       ├── Youth center info
│       ├── Membership
│           ├── Apply for membership
│           ├── Membership status
│           ├── Membership end date
│       ├── Their activities
│       └── Contact information
│       └── Fritidsgårdar i närheten
│
├── /app/mina-anmalningar (My Registrations)
│   ├── Tab: Kommande (Upcoming)
│   ├── Tab: Pågår (Active)
│   ├── Tab: Avslutade (Past)
│   └── Tab: Inbjudningar (Invitations with badge)
│
└── /app/profil (My Profile)
    ├── Edit alias
    ├── View birth year
    ├── Change password
    ├── Memberships overview
    └── GDPR actions (Export data, Delete account)
```

### Page Details

#### `/app/aktiviteter` - Browse Activities (Logged In)
- **Purpose:** Activity discovery with personalized features
- **Enhanced Features:**
  - Personal registration status indicators
  - Time conflict warnings
  - Quick register/unregister actions
  - "My organizations" filter
- **Real-time Updates:** Registration status, capacity changes

#### `/app/aktiviteter/:id` - Activity Detail (Logged In)
- **Purpose:** Full activity details with registration capabilities
- **Interactive Elements:**
  - **"Anmäl dig" button** (if eligible)
    - Shows validation errors if not eligible
    - Confirms before registration
  - **"Avanmäl" button** (if already registered)
  - **"Acceptera" / "Avböj" buttons** (if invited)
  - Time conflict warning (if applicable)
  - Own registration status badge
- **Validation Display:**
  - "Anmälningstiden har gått ut"
  - "Du har redan en aktivitet på denna tid"
  - "Endast för medlemmar"
  - "Endast på inbjudan"
  - "Fullbokad"

#### `/app/mina-anmalningar` - My Registrations
- **Purpose:** Personal registration management hub
- **Tabs:**
  1. **Kommande (Upcoming)** - Future activities
  2. **Pågår (Active)** - Currently happening
  3. **Avslutade (Past)** - Completed activities
  4. **Inbjudningar (Invitations)** - Awaiting response (with count badge)
- **Card Display:**
  - Activity thumbnail
  - Date and time
  - Status badge (Godkänd, Väntande, Inbjuden, etc.)
  - Action buttons
  - Cancel button (if before start time)
- **Real-time Updates:** New invitations, status changes

#### `/app/pro