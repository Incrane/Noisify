---
trigger: always_on
---

# Noisify - Project Specification Document
## Complete Frontend Development Guide

---

## 1. Project Overview

### 1.1 Purpose
Noisify is a comprehensive multi-tenant SaaS platform for managing Swedish youth recreation centers (fritidsgårdar). It serves teenagers aged 10-20, providing activity registration, course management, membership tracking, room booking, and media management.

### 1.2 Core Value Proposition
- Streamlined activity registration and management
- Real-time availability and conflict prevention
- Mobile-first design for Gen Z users
- GDPR-compliant data handling
- Multi-organization support with isolated data

### 1.3 Target Users
1. **Youth Participants (13-18 years)** - Primary end users
   - Discover and register for activities
   - Manage their memberships
   - Track their registrations
   - Accept/reject invitations

2. **Organization Staff** - Activity managers
   - Create and manage activities
   - Review and approve registrations
   - Invite specific participants
   - Monitor capacity and attendance

3. **System Administrators** - Platform managers
   - Manage organizations
   - Configure system settings
   - Monitor platform health

### 1.4 Key Success Metrics
- User engagement (registrations per user)
- Registration completion rate
- Time to register for activities
- Staff efficiency (time to manage activities)
- System uptime and performance

---

## 2. Technical Architecture

### 2.1 Technology Stack

**Backend:**
- Supabase (PostgreSQL + Auth + Storage + Realtime)
- PostgreSQL 14+
- Row Level Security (RLS) for data isolation
- Server-side functions for complex business logic

**Frontend (To Build):**
- Next.js
- Mobile-first responsive design
- Real-time subscriptions via Supabase
- Progressive Web App (PWA) capabilities

**Language:**
- 100% Swedish interface
- Swedish error messages
- Swedish date/time formatting

### 2.2 Authentication & Authorization

**Authentication:**
- Supabase Auth (email/password, magic links)
- User profiles linked to `auth.users`
- Organization-based access control

**Authorization Levels:**
- Role 0: Member (view only)
- Role 1: Assistant staff (limited editing)
- Role 2+: Full staff (full permissions)

**Key Security Patterns:**
- RLS policies enforce organization isolation
- `SECURITY DEFINER` functions for complex checks
- Helper functions prevent circular RLS dependencies
- All policies scoped to `authenticated` users only

### 2.3 Database Connection
```typescript
// Supabase client configuration
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 3. Database Schema

### 3.1 Core Tables

#### `profile`
User profile information
```typescript
interface Profile {
  profile_id: string;           // UUID, primary key
  user_id: string;             // References auth.users
  alias: string;               // Display name (3-50 chars)
  fodd_ar: number;            // Birth year (1900-current)
  created_at: string;          // Timestamp
  updated_at: string;          // Timestamp
}
```

#### `organisation`
Youth recreation center organizations
```typescript
interface Organisation {
  org_id: string;              // UUID, primary key
  name: string;                // Organization name
  description: string | null;  // Optional description
  logo_url: string | null;     // Organization logo
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  is_active: boolean;          // Default: true
  created_at: string;
}
```

#### `org_user`
Organization membership and roles
```typescript
interface OrgUser {
  org_user_id: string;         // UUID, primary key
  org_id: string;              // References organisation
  profile_id: string;          // References profile
  role_id: number;             // 0=member, 1=assistant, 2+=staff
  joined_at: string;           // Timestamp
}
```

#### `activity`
Main activity/event table
```typescript
interface Activity {
  activity_id: string;                    // UUID, primary key
  org_id: string;                        // Owner organization
  name: string;                          // Activity name
  description: string | null;            // Rich text description
  activity_type: 'NORMAL' | 'RANDOM';   // Registration type
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: 'PUBLIC' | 'PRIVATE';
  
  // Registration rules
  registration_rules: 'OPEN_FOR_ALL' | 'ONLY_MEMBERS' | 'SELECTED_MEMBERS';
  registration_deadline: string | null;  // Deadline for self-registration
  
  // Capacity
  capacity: number | null;               // Max participants (null = unlimited)
  waitlist_capacity: number | null;      // Additional waitlist spots
  
  // Schedule
  starts_at: string;                     // Start timestamp
  ends_at: string;                       // End timestamp
  
  // Location
  location: string | null;               // Address/venue
  room_id: string | null;                // Future: room booking
  
  // Age restrictions
  min_age: number | null;                // Minimum age
  max_age: number | null;                // Maximum age
  
  // Media
  image_url: string | null;              // Activity image
  video_url: string | null;              // Optional video
  
  // Metadata
  created_by: string;                    // Profile ID of creator
  created_at: string;
  updated_at: string;
}
```

#### `registration`
Activity registrations (with advanced RLS)
```typescript
interface Registration {
  registration_id: string;     // UUID, primary key
  activity_id: string;         // References activity
  profile_id: string;          // References profile
  
  status: 
    | 'PENDING'               // User registered, awaiting approval
    | 'INVITED'               // Staff invited user
    | 'ACCEPTED'              // Approved/accepted
    | 'REJECTED'              // Denied
    | 'WAITLISTED'            // On waitlist
    | 'LOTTERY_REJECTED';     // Random selection rejected
  
  registration_date: string;   // When registered
  notes: string | null;        // Optional notes
  created_at: string;
  updated_at: string;
}
```

#### `memberships`
Organization memberships for participants
```typescript
interface Membership {
  membership_id: string;       // UUID, primary key
  profile_id: string;          // References profile
  org_id: string;              // References organisation
  
  membership_state: 'active' | 'expired' | 'cancelled';
  
  starts_at: string;           // Membership start date
  ends_at: string | null;      // Membership end date (null = indefinite)
  
  created_at: string;
  updated_at: string;
}
```

#### `activity_organisation`
Partner organizations for activities
```typescript
interface ActivityOrganisation {
  id: string;                  // UUID, primary key
  activity_id: string;         // References activity
  org_id: string;              // Partner organization ID
  created_at: string;
}
```

#### `activity_target_subgroups`
Target demographic tags
```typescript
interface ActivityTargetSubgroup {
  id: string;                  // UUID, primary key
  activity_id: string;         // References activity
  subgroup_name: string;       // e.g., "Killar", "Tjejer", "LGBTQ+"
  created_at: string;
}
```

#### `activity_categories`
Activity categorization
```typescript
interface ActivityCategory {
  id: string;                  // UUID, primary key
  activity_id: string;         // References activity
  category_name: string;       // e.g., "Sport", "Musik", "Konst"
  created_at: string;
}
```

### 3.2 Helper Views

#### `activity_dashboard`
**Real-time comprehensive activity overview** (not materialized - always current!)

```typescript
interface ActivityDashboard {
  // Basic info
  activity_id: string;
  aktivitet: string;                    // Activity name
  activity_status: string;              // DRAFT | PUBLISHED | ARCHIVED
  visibility: string;                   // PUBLIC | PRIVATE
  activity_type: string;                // NORMAL | RANDOM
  registreringsregler: string;          // Registration rules
  beskrivning: string | null;           // Description
  image_url: string | null;
  
  // Date & Time
  datum: string;                        // Date only (YYYY-MM-DD)
  start_datum_tid: string;              // Full start timestamp
  slut_datum_tid: string;               // Full end timestamp
  start_tid: string;                    // Start time (HH:MM)
  slut_tid: string;                     // End time (HH:MM)
  tidsstatus: string;                   // "Kommande" | "Pågår" | "Avslutad"
  sekunder_till_start: number;          // Seconds until start (for sorting)
  
  // Registration deadline
  anmalningsfrist: string | null;       // Deadline timestamp
  anmalning_oppen: boolean;             // Is registration open?
  
  // Location
  plats: string | null;                 // Location/address
  aktivitetstyp: string;                // Activity type
  
  // Capacity (⚡ Real-time counts)
  total_kapacitet: number | null;       // Max capacity
  reservplatser: number | null;         // Waitlist capacity
  antal_godkanda: number;               // ACCEPTED count
  antal_vantande: number;               // PENDING count
  antal_vantelista: number;             // WAITLISTED count
  antal_inbjudna: number;               // INVITED count
  antal_avslag: number;                 // REJECTED count
  totala_anmalningar: number;           // Total active registrations
  lediga_platser: number | null;        // Available spots
  kapacitetsstatus: string;             // "Ingen gräns" | "Lediga platser" | "Nästan full" | "Fullbokad"
  
  // Target groups
  aldersgrupp: string;                  // Age range
  malgrupper: string | null;            // Target subgroups (comma-separated)
  kategorier: string | null;            // Categories (comma-separated)
  
  // Organization
  agande_organisation: string;          // Owner org name
  agande_org_id: string;                // Owner org ID
  partnerorganisationer: string | null; // Partner orgs (comma-separated)
  
  // Creator & timestamps
  skapad_av: string;                    // Creator alias
  skapad_av_profile_id: string;         // Creator profile ID
  skapad_datum: string;                 // Created timestamp
  uppdaterad_datum: string;             // Updated timestamp
}
```

**Key View Features:**
- ⚡ **Real-time data** - Always current, not cached
- Calculated capacity status based on current registrations
- Time status (upcoming/ongoing/finished)
- Pre-formatted Swedish dates and times
- Aggregated registration counts by status
- Combined organization info (owner + partners)

---

## 4. Business Logic & Rules

### 4.1 Activity Registration Flow

#### Flow 1: User Self-Registration (OPEN_FOR_ALL & ONLY_MEMBERS)

```
1. User browses published activities
2. Clicks "Anmäl dig" (Register)
3. System validates:
   ✓ Activity is PUBLISHED
   ✓ Registration deadline not passed
   ✓ No time conflicts with other registrations
   ✓ User meets requirements (OPEN_FOR_ALL or has membership for ONLY_MEMBERS)
4. Registration created with status = PENDING
5. Staff receives notification
6. Staff reviews and updates to ACCEPTED/REJECTED/WAITLISTED
```

#### Flow 2: Staff Invitation (SELECTED_MEMBERS)

```
1. Staff searches for user by alias
2. Clicks "Bjud in" (Invite)
3. System validates:
   ✓ Staff has permission (owner or partner org)
   ✓ No time conflicts for user
   (✗ Bypasses: deadline, registration rules, capacity)
4. Registration created with status = INVITED
5. User receives notification
6. User accepts (→ ACCEPTED) or rejects (→ REJECTED)
```

#### Flow 3: Automatic Waitlist (When at Capacity)

```
1. User attempts to register
2. Activity at capacity (antal_godkanda >= total_kapacitet)
3. System automatically sets status = WAITLISTED
4. When spot opens, staff promotes from waitlist
```

Check the document C:\Users\Admin\Desktop\Apps\Noisify 11 Gemini 3\project_status.md 