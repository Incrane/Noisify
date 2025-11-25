---
trigger: model_decision
description: when refactoring /app/profil and all its subpages
---

# Member Profile Page - Refactoring Specification

## Overview
Complete refactoring of the member profile page (`/app/profil`) with a focus on membership management through an intuitive card-swapping interface inspired by modern banking apps.

---

## 1. URL Structure

```
/app/profil                          # Main profile overview
├── /app/profil/installningar         # Settings (renamed from current structure)
│   ├── /app/profil/installningar/notiser          # Notification settings
│   ├── /app/profil/installningar/konto            # Account settings
│   ├── /app/profil/installningar/integritet      # Privacy settings
│   ├── /app/profil/installningar/aktiviteter     # Activity preferences
│   └── /app/profil/installningar/utseende        # Display/appearance settings
├── /app/profil/medlemskap            # Membership details & management
├── /app/profil/aktiviteter           # User's activity registrations
│   ├── /app/profil/aktiviteter/kommande          # Upcoming activities
│   ├── /app/profil/aktiviteter/pagaende          # Ongoing activities
│   ├── /app/profil/aktiviteter/avslutade        # Past activities
│   └── /app/profil/aktiviteter/inbjudningar     # Invitations
├── /app/profil/kurser                # User's course enrollments
├── /app/profil/favoriter             # Favorites (activities, courses, orgs)
├── /app/profil/forbattringar         # User's perks/benefits (förmågor)
└── /app/profil/intressen            # Manage interests
```

---

## 2. Database Mapping

### 2.1 Core Profile Data

**Source Tables & Views:**
- `profiles` - Public profile information
- `users_private` - Private/sensitive information (GDPR protected)
- `user_settings` - User preferences
- `v_user_profile` - Comprehensive view combining all profile data

**Available Fields:**

```typescript
interface UserProfile {
  // Public Profile (profiles)
  profile_id: string;
  user_id: string;
  alias: string;                    // Display name (3-50 chars)
  public_name: string | null;       // Optional public name
  image_url: string;                // Profile picture
  account_type: 'digital' | 'local';
  city_id: string;
  city: string;                     // Via cities join
  created_at: string;               // Account creation date
  
  // Private Information (users_private) - only visible to owner
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  birth_date: date | null;
  gender_id: string | null;
  
  // Statistics (from v_user_profile)
  total_accepted_activities: number;
  total_pending_activities: number;
  total_invited_activities: number;
  total_waitlisted_activities: number;
  total_favorites: number;
  total_active_courses: number;
  total_completed_courses: number;
  total_active_perks: number;
}
```

### 2.2 Memberships Data

**Source Tables & Views:**
- `memberships` - Organization memberships
- `members_dashboard` - Rich membership view with stats
- `v_my_organizations` - User's organizations with role info

**Available Fields:**

```typescript
interface MembershipCard {
  // Core Membership Info
  membership_id: string;
  profile_id: string;
  org_id: string;
  
  // Organization Details
  organization_name: string;
  organization_logo: string | null;
  org_description: string | null;
  org_address: string | null;
  org_contact: {
    epost: string;
    phonenumber: string;
  };
  city: string;
  
  // Membership Status
  membership_state: 
    | 'active' 
    | 'pending' 
    | 'upcoming' 
    | 'expired' 
    | 'grace_period'
    | 'out_of_date'
    | 'indefinite'
    | 'no_term'
    | 'suspended'
    | 'revoked'
    | 'cancelled'
    | 'suspended_due_to_policy'
    | 'unknown';
  
  // Dates
  start_date: string;
  end_date: string | null;          // null = indefinite
  member_since: string;             // membership creation
  state_changed_at: string | null;
  
  // Expiry Info
  days_remaining: number | null;    // Days until expiry
  expiry_status: string;            // "Ingen slutdatum" | "Utgånget" | "Går ut snart" | "Aktiv"
  membership_duration_days: number | null;
  
  // Statistics
  accepted_activities: number;      // Accepted registrations count
  pending_activities: number;       // Pending registrations count
  invited_activities: number;       // Invited registrations count
  waitlisted_activities: number;    // Waitlisted registrations count
  total_registrations: number;      // All registrations
  active_perks: number;             // Active perks from this org
  
  // Total org stats
  total_active_members: number;     // All active members in org
  upcoming_activities_count: number;// Org's upcoming activities
  
  // User Role (if staff)
  user_role_id: number | null;      // null if not staff
  user_role_name: string | null;    // e.g., "Admin", "Personal"
  is_staff: boolean;                // true if role_id >= 2
  
  // Status Metadata
  state_reason: string | null;      // Why state changed
  is_suspended: boolean;            // Currently suspended?
  last_registration_date: string;   // Most recent activity registration
  
  // Localized Status
  status_swedish: string;           // Swedish translation
  status_icon: string;              // Emoji icon (🟢🟡🔴⛔❌⚪)
  engagement_level: string;         // "Mycket aktiv" | "Aktiv" | "Måttlig" | "Inaktiv"
}
```

### 2.3 Interests/Categories

**Source Tables:**
- `profile_interests` - User's selected interests
- `categories` - Available categories

```typescript
interface UserInterest {
  id: string;
  profile_id: string;
  category_id: string;
  created_at: string;
  
  // From categories join
  cat_name: string;         // "Sport", "Musik", "Konst", etc.
  color: string | null;     // Text color
  bg_color: string | null;  // Background color
}
```

### 2.4 User Settings

**Source Table:** `user_settings`

```typescript
interface UserSettings {
  id: string;
  profile_id: string;
  
  // Language & Timezone
  language: 'sv' | 'en';                    // Default: 'sv'
  timezone: string;                          // Default: 'Europe/Stockholm'
  
  // Notifications (JSONB)
  notification_settings: {
    email: {
      enabled: boolean;
      activity_invitations: boolean;
      activity_registration_status: boolean;
      activity_reminders: boolean;
      course_updates: boolean;
      membership_updates: boolean;
      room_booking_updates: boolean;
      organization_announcements: boolean;
      new_activities_matching_interests: boolean;
    };
    sms: {
      enabled: boolean;
      urgent_only: boolean;
      activity_reminders: boolean;
    };
    push: {
      enabled: boolean;
    };
    frequency: {
      digest_enabled: boolean;
      digest_frequency: 'daily' | 'weekly';
    };
    reminder_timing: {
      activity_reminder_hours_before: number;  // Default: 24
      booking_reminder_hours_before: number;   // Default: 2
    };
  };
  
  // Privacy (JSONB)
  privacy_settings: {
    profile_visibility: 'public' | 'private';  // Default: 'public'
    show_activity_history: boolean;            // Default: false
    show_favorites: boolean;                   // Default: true
    show_email_to_members: boolean;            // Default: false
    show_phone_to_staff: boolean;              // Default: true
    allow_personalized_recommendations: boolean; // Default: true
  };
  
  // Communication (JSONB)
  communication_settings: {
    preferred_contact_method: 'email' | 'sms' | 'push';
    contact_time_preference: 'any' | 'morning' | 'afternoon' | 'evening';
    opt_in_newsletters: string[];  // Array of org IDs
  };
  
  // Activity Preferences (JSONB)
  activity_settings: {
    default_view: 'list' | 'grid' | 'calendar';
    default_filters: {
      time_range: 'upcoming' | 'all' | 'past';
      registration_status: 'open' | 'all' | 'closed';
    };
    hide_past_activities: boolean;            // Default: true
    show_only_favorite_orgs: boolean;         // Default: false
    auto_favorite_on_registration: boolean;   // Default: false
  };
  
  // Display (JSONB)
  display_settings: {
    theme: 'light' | 'dark' | 'auto';
    font_size: 'small' | 'medium' | 'large';
    high_contrast: boolean;
    reduced_motion: boolean;
  };
  
  created_at: string;
  updated_at: string;
}
```

### 2.5 Activities Data

**Source Views:**
- `v_my_schedule` - User's upcoming activities
- `member_activities_view` - Detailed activity info with registration status

```typescript
interface UserActivity {
  registration_id: string;
  registration_status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WAITLISTED' | 'INVITED';
  registered_at: string;
  
  activity_id: string;
  activity_name: string;
  description: string;
  image_url: string;
  starts_at: string;
  ends_at: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  address: string;
  
  organization_name: string;
  organization_id: string;
  organization_logo: string;
  city: string;
  
  time_label: 'today' | 'tomorrow' | 'past' | 'upcoming';
  seconds_until_start: number;
  
  capacity: number;
  accepted_count: number;
}
```

### 2.6 Perks/Benefits

**Source Tables:**
- `profile_perks` - User's perks
- `perk_types` - Perk definitions

```typescript
interface UserPerk {
  id: string;
  profile_id: string;
  perk_type_id: string;
  
  // Perk Details
  name: string;                     // e.g., "Studiotillgång", "Förmånsbiljetter"
  slug: string;
  description: string | null;
  icon_url: string | null;
  category: 'ROOM_ACCESS' | 'DISCOUNT' | 'PRIORITY_BOOKING' | 'OTHER';
  
  // Status
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  granted_at: string;
  expires_at: string | null;
  
  // Source
  granted_by: string | null;                // Profile ID of granter
  granted_via_activity_id: string | null;   // If from activity completion
  granted_via_course_id: string | null;     // If from course completion
  
  // Organization
  org_id: string;
  notes: string | null;
}
```

### 2.7 Favorites

**Source View:** `v_my_favorites`

```typescript
interface UserFavorite {
  favorite_type: 'activity' | 'course' | 'organization';
  favorite_id: string;
  favorited_at: string;
  
  item_id: string;
  item_name: string;
  description: string;
  image_url: string;
  
  // Type-specific fields
  starts_at?: string;          // Activities only
  ends_at?: string;            // Activities only
  organization_name: string;
  organization_logo: string;
  city: string;
  
  // Activity-specific
  capacity?: number;
  accepted_count?: number;
  capacity_status?: 'unlimited' | 'full' | 'almost_full' | 'available';
  time_status?: 'past' | 'today' | 'tomorrow' | 'upcoming';
}
```

---

## 3. Membership Card Swapping Feature

### 3.1 Design Inspiration

Based on the uploaded banking app examples:
- **3D Card Stack Effect** - Cards appear stacked with perspective
- **Smooth Transitions** - Fluid animations when switching cards
- **Touch Gestures** - Swipe up/down (mobile) or left/right (desktop)
- **Visual Hierarchy** - Active card prominent, others slightly faded/scaled
- **Card Navigation** - Dots/indicators showing total and current position

### 3.2 Component Structure

```typescript
<MembershipCardStack>
  <MembershipCard 
    membership={membership}
    isActive={currentIndex === index}
    onSwipe={handleSwipe}
  />
</MembershipCardStack>
```

### 3.3 Card Design

**Each membership card should display:**

**Front Side (Default View):**
```
┌─────────────────────────────────────────┐
│  [Org Logo]                    [Status]  │
│                                           │
│  Organisation Name                        │
│  Medlem sedan: [Date]                     │
│                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                           │
│  📅 [X] Aktiviteter                      │
│  🎯 [X] Förmåner                         │
│  👥 [X] Medlemmar totalt                 │
│                                           │
│  [Gradient/Color based on org]           │
└─────────────────────────────────────────┘
```

**Card Variants by Status:**

1. **Active** (`membership_state = 'active'`)
   - Gradient: Green (#10b981 → #059669)
   - Icon: 🟢
   - Show: Days remaining (if end_date exists)

2. **Pending** (`membership_state = 'pending'`)
   - Gradient: Yellow (#fbbf24 → #f59e0b)
   - Icon: 🟡
   - Show: "Väntar på godkännande"

3. **Expired** (`membership_state = 'expired'`)
   - Gradient: Red (#ef4444 → #dc2626)
   - Icon: 🔴
   - Show: "Utgick [date]"
   - Semi-transparent overlay

4. **Suspended** (`membership_state = 'suspended'`)
   - Gradient: Orange (#f97316 → #ea580c)
   - Icon: ⛔
   - Show: Suspension reason

### 3.4 Swipe Interactions

**Mobile (Touch):**
```typescript
const handleTouchStart = (e: TouchEvent) => {
  startY = e.touches[0].clientY;
  startX = e.touches[0].clientX;
};

const handleTouchMove = (e: TouchEvent) => {
  const deltaY = e.touches[0].clientY - startY;
  const deltaX = e.touches[0].clientX - startX;
  
  // Vertical swipe (primary on mobile)
  if (Math.abs(deltaY) > Math.abs(deltaX)) {
    if (deltaY < -50) navigateNext();  // Swipe up
    if (deltaY > 50) navigatePrev();   // Swipe down
  }
};
```

**Desktop (Mouse/Trackpad):**
```typescript
const handleWheel = (e: WheelEvent) => {
  // Horizontal scroll
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
    if (e.deltaX > 0) navigateNext();  // Swipe right
    if (e.deltaX < 0) navigatePrev();  // Swipe left
  }
};

// Or navigation buttons
<button onClick={navigatePrev}>←</button>
<button onClick={navigateNext}>→</button>
```

### 3.5 CSS Transforms for 3D Effect

```css
.card-stack {
  perspective: 1000px;
  position: relative;
  height: 400px;
}

.membership-card {
  position: absolute;
  width: 100%;
  transition: transform 0.3s ease, opacity 0.3s ease;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* Active card - front and center */
.card-active {
  transform: translateZ(0) scale(1);
  opacity: 1;
  z-index: 10;
}

/* Next card - slightly behind, scaled down */
.card-next {
  transform: translateZ(-50px) translateY(20px) scale(0.95);
  opacity: 0.7;
  z-index: 5;
}

/* Previous card - behind, more scaled down */
.card-prev {
  transform: translateZ(-100px) translateY(40px) scale(0.9);
  opacity: 0.4;
  z-index: 1;
}

/* Hidden cards */
.card-hidden {
  transform: translateZ(-150px) translateY(60px) scale(0.85);
  opacity: 0;
  pointer-events: none;
}
```

### 3.6 Navigation Indicators

```typescript
<div className="card-indicators">
  {memberships.map((_, index) => (
    <div 
      key={index}
      className={`indicator ${index === currentIndex ? 'active' : ''}`}
      onClick={() => setCurrentIndex(index)}
    />
  ))}
</div>
```

```css
.card-indicators {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  cursor: pointer;
  transition: all 0.3s ease;
}

.indicator.active {
  width: 24px;
  border-radius: 4px;
  background: #3b82f6;
}
```

### 3.7 Empty State

When user has no memberships:

```
┌─────────────────────────────────────────┐
│                                           │
│           [Empty State Icon]              │
│                                           │
│      Du har inga medlemskap ännu          │
│                                           │
│  Bli medlem i en organisation för att     │
│  få tillgång till alla aktiviteter       │
│                                           │
│      [Utforska Organisationer]            │
│                                           │
└─────────────────────────────────────────┘
```

---

## 4. Page Layouts

### 4.1 Main Profile Page (`/app/profil`)

**Layout Structure:**

```
┌──────────────────────────────────────────────────┐
│  Header Section                                   │
│  ┌────────┐  Alias                    [Redigera] │
│  │ Avatar │  Göteborg                             │
│  └────────┘                                       │
│            2 Aktiviteter  0 Kurser  5 Förmågor   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Mina Medlemskap                                  │
│                                                    │
│  [Membership Card Stack Component]                │
│  • Swipe to navigate between memberships          │
│  • Shows active/pending/expired status            │
│  • Quick stats per organization                   │
│                                                    │
│  ○ ━ ○ ○  (Navigation dots)                      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Mina Intressen (9)                          [+] │
│                                                    │
│  [Idrott] [Musik] [Workshop] [Gaming]            │
│  [Konst] [Sport] [E-Sport] [Studiecirkel]        │
│  [Musik Produktion]                               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Snabbåtkomst                                     │
│                                                    │
│  🔔 Notiser              →                        │
│  👤 Konto                →                        │
│  📅 Aktiviteter          →                        │
│  🔒 Integritet           →                        │
│  🎨 Utseende             →                        │
│  🔑 Ändra lösenord       →                        │
│  🚪 Logga ut             →                        │
│  🗑️  Radera konto        →                        │
└──────────────────────────────────────────────────┘
```

**Data Sources:**
- Header: `v_user_profile` (alias, image_url, city, stats)
- Membership Cards: `members_dashboard` or `v_my_organizations`
- Interests: `profile_interests` joined with `categories`
- Quick Access: Navigation links

### 4.2 Membership Details (`/app/profil/medlemskap`)

**When a user taps on a membership card:**

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Backa Fritidsgård           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  [Large Org Logo]                                 │
│                                                    │
│  Backa Fritidsgård                                │
│  Göteborg                                         │
│                                                    │
│  Status: 🟢 Aktiv                                 │
│  Medlem sedan: 15 jan 2024                        │
│  Utgår: 31 dec 2025 (401 dagar kvar)            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Din Aktivitet                                    │
│                                                    │
│  📅 12 Godkända aktiviteter                      │
│  ⏳ 3 Väntande godkännanden                      │
│  💌 1 Inbjudan                                    │
│  📋 2 På väntelista                              │
│                                                    │
│  Senaste registrering: 3 dagar sedan             │
│  Engagemangsnivå: Mycket aktiv                   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Dina Förmåner (3)                               │
│                                                    │
│  🎹 Studiotillgång                               │
│     Aktiv t.o.m. 31 dec 2025                     │
│                                                    │
│  🎫 Förmånsbiljetter                             │
│     Aktiv t.o.m. 30 jun 2025                     │
│                                                    │
│  📚 Bibliotekstillgång                           │
│     Ingen slutdatum                               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Om Organisationen                                │
│                                                    │
│  Backa Fritidsgård är en mötesplats för          │
│  ungdomar i Göteborg...                           │
│                                                    │
│  📍 Adress: Backagatan 123                       │
│  📧 Email: info@backa.se                         │
│  📞 Telefon: 031-123 45 67                       │
│                                                    │
│  👥 1,234 Aktiva medlemmar                       │
│  📅 47 Kommande aktiviteter                      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  [Visa alla aktiviteter från Backa]             │
│  [Utforska förmåner]                             │
└──────────────────────────────────────────────────┘
```

**Data Sources:**
- Organization info: `organizations` table
- Membership status: `memberships` table
- Statistics: `members_dashboard` view
- Perks: `profile_perks` filtered by org
- Activities: `v_my_schedule` filtered by org

### 4.3 Settings Pages

#### Main Settings Hub (`/app/profil/installningar`)

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Inställningar                │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Notifikationer                              →   │
│  Hantera e-post, SMS och push-notiser            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Konto                                       →   │
│  Redigera profil, lösenord och kontaktinfo       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Integritet                                  →   │
│  Kontrollera vem som kan se din profil           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Aktivitetsinställningar                     →   │
│  Standardvy, filter och preferenser               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Utseende                                    →   │
│  Tema, typsnitt och tillgänglighet                │
└──────────────────────────────────────────────────┘
```

#### Notification Settings (`/app/profil/installningar/notiser`)

**Data Source:** `user_settings.notification_settings` (JSONB)

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Notifikationer               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  E-post                                           │
│                                                    │
│  ☑ Aktivera e-postnotifikationer                 │
│  ☑ Aktivitetsinbjudningar                        │
│  ☑ Status på anmälningar                         │
│  ☑ Aktivitetspåminnelser                         │
│  ☐ Kursuppdateringar                             │
│  ☑ Medlemskapsstatus                             │
│  ☑ Rumsbokningar                                 │
│  ☐ Organisationsmeddelanden                      │
│  ☑ Nya aktiviteter som matchar intressen         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  SMS                                              │
│                                                    │
│  ☐ Aktivera SMS-notifikationer                   │
│  ☑ Endast brådskande meddelanden                 │
│  ☐ Aktivitetspåminnelser                         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Push-notifikationer                              │
│                                                    │
│  ☐ Aktivera push-notifikationer                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Påminnelsetider                                  │
│                                                    │
│  Aktiviteter:  [24] timmar innan                  │
│  Bokningar:    [2]  timmar innan                  │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Sammanfattningar                                 │
│                                                    │
│  ☐ Aktivera veckosammanfattning                  │
│  Frekvens:  ○ Daglig  ● Veckovis                │
└──────────────────────────────────────────────────┘
```

#### Account Settings (`/app/profil/installningar/konto`)

**Data Sources:** `profiles`, `users_private`, `user_settings`

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Konto                        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Profilbild                                       │
│                                                    │
│  [Current Avatar]         [Ladda upp ny]         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Grundläggande information                        │
│                                                    │
│  Alias:          [_____________]                  │
│  Offentligt namn: [_____________] (valfritt)      │
│                                                    │
│  Förnamn:        [_____________]                  │
│  Efternamn:      [_____________]                  │
│  Födelsedatum:   [__/__/____]                    │
│  Kön:            [Välj...]                        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Kontaktinformation                               │
│                                                    │
│  E-post:         [_____________]                  │
│  Telefon:        [_____________]                  │
│  Stad:           [Göteborg ▼]                    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Språk & Tidszon                                 │
│                                                    │
│  Språk:          [Svenska ▼]                     │
│  Tidszon:        [Europe/Stockholm ▼]            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Lösenord                                        │
│                                                    │
│  [Ändra lösenord] →                              │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  [Spara ändringar]                               │
└──────────────────────────────────────────────────┘
```

#### Privacy Settings (`/app/profil/installningar/integritet`)

**Data Source:** `user_settings.privacy_settings` (JSONB)

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Integritet                   │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Profilens synlighet                              │
│                                                    │
│  ● Offentlig - Alla kan se min profil            │
│  ○ Privat - Endast jag kan se min profil         │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Vad andra kan se                                │
│                                                    │
│  ☐ Visa aktivitetshistorik                       │
│  ☑ Visa favoriter                                │
│  ☐ Visa e-post för medlemmar                     │
│  ☑ Visa telefon för personal                     │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Rekommendationer                                 │
│                                                    │
│  ☑ Tillåt personliga rekommendationer            │
│     (baserat på intressen och aktivitet)          │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  GDPR & Dataskydd                                │
│                                                    │
│  [Ladda ner mina data] →                         │
│  [Radera mitt konto] →                           │
│                                                    │
│  ℹ️ Läs mer om hur vi hanterar din data          │
└──────────────────────────────────────────────────┘
```

#### Activity Settings (`/app/profil/installningar/aktiviteter`)

**Data Source:** `user_settings.activity_settings` (JSONB)

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Aktivitetsinställningar      │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Standardvy                                       │
│                                                    │
│  ● Lista                                          │
│  ○ Rutnät                                         │
│  ○ Kalender                                       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Standardfilter                                   │
│                                                    │
│  Tidsperiod:  ● Kommande  ○ Alla  ○ Tidigare    │
│  Status:      ● Öppna     ○ Alla  ○ Stängda     │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Preferenser                                      │
│                                                    │
│  ☑ Dölj tidigare aktiviteter                     │
│  ☐ Visa endast från favoritorganisationer        │
│  ☐ Lägg till som favorit vid anmälan             │
└──────────────────────────────────────────────────┘
```

#### Display Settings (`/app/profil/installningar/utseende`)

**Data Source:** `user_settings.display_settings` (JSONB)

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Utseende                     │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Tema                                             │
│                                                    │
│  ● Ljust                                          │
│  ○ Mörkt                                          │
│  ○ Auto (följ systemet)                          │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Typsnittsstorlek                                 │
│                                                    │
│  ○ Liten    ● Medel    ○ Stor                    │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Tillgänglighet                                   │
│                                                    │
│  ☐ Hög kontrast                                  │
│  ☐ Reducera rörelser                             │
└──────────────────────────────────────────────────┘
```

### 4.4 Activities Page (`/app/profil/aktiviteter`)

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Mina Aktiviteter             │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Tabs:                                            │
│  ● Kommande (5)  ○ Pågående (0)                  │
│  ○ Avslutade (12)  ○ Inbjudningar (1)           │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  [Activity Card 1]                                │
│  Musikproduktion Workshop                         │
│  Måndag 25 nov • 18:00-20:00                     │
│  Backa Fritidsgård                               │
│  Status: 🟢 Godkänd                              │
│  [Avanmäl]                                       │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  [Activity Card 2]                                │
│  Gaming Turnering                                 │
│  Fredag 29 nov • 17:00-21:00                     │
│  Selma Lagerlöfs Hus                             │
│  Status: ⏳ Väntar på godkännande               │
└──────────────────────────────────────────────────┘

...more cards...
```

**Data Source:** `v_my_schedule` or `member_activities_view`

**Filter by status:**
- Kommande: `time_label = 'upcoming' OR time_label = 'today'`
- Pågående: Based on time (starts_at <= now AND ends_at >= now)
- Avslutade: `time_label = 'past'`
- Inbjudningar: `registration_status = 'INVITED'`

### 4.5 Interests Management (`/app/profil/intressen`)

```
┌──────────────────────────────────────────────────┐
│  ← Tillbaka          Mina Intressen               │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Valda intressen (9)                              │
│                                                    │
│  [Idrott ✕] [Musik ✕] [Workshop ✕]              │
│  [Gaming ✕] [Konst ✕] [Sport ✕]                 │
│  [E-Sport ✕] [Studiecirkel ✕]                   │
│  [Musik Produktion ✕]                            │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│  Tillgängliga kategorier                          │
│                                                    │
│  ☐ Dans                                           │
│  ☐ Film                                           │
│  ☐ Foto                                           │
│  ☐ Matlagning                                     │
│  ☐ Mode                                           │
│  ☐ Programmering                                  │
│  ☐ Språk                                          │
│  ☐ Teater                                         │
│  ...                                              │
└──────────────────────────────────────────────────┘

ℹ️ Dina intressen används för att ge personliga
   rekommendationer på aktiviteter du kan gilla.
```

**Data Source:**
- Selected: `profile_interests` joined with `categories`
- Available: All categories from `categories` table

---

## 5. API/RPC Calls Needed

### 5.1 Profile Management

```typescript
// Get full user profile
const { data: profile } = await supabase
  .from('v_user_profile')
  .select('*')
  .single();

// Update profile info
const { data, error } = await supabase
  .from('profiles')
  .update({
    alias: newAlias,
    public_name: newPublicName,
    image_url: newImageUrl,
    city_id: newCityId
  })
  .eq('user_id', userId);

// Update private info
const { data, error } = await supabase
  .from('users_private')
  .update({
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone_number: phone,
    birth_date: birthDate,
    gender_id: genderId
  })
  .eq('user_id', userId);

// Update settings
const { data, error } = await supabase
  .from('user_settings')
  .update({
    notification_settings: { ...newSettings },
    // or specific JSONB path:
    // notification_settings: Supabase.functions.jsonSet(
    //   'notification_settings',
    //   ['email', 'enabled'],
    //   true
    // )
  })
  .eq('profile_id', profileId);
```

### 5.2 Memberships

```typescript
// Get all memberships with full details
const { data: memberships } = await supabase
  .from('members_dashboard')
  .select('*')
  .eq('profile_id', profileId)
  .order('membership_state', { ascending: true });

// Or use v_my_organizations for more org details
const { data: orgs } = await supabase
  .from('v_my_organizations')
  .select('*');

// Get specific membership details
const { data: membership } = await supabase
  .from('members_dashboard')
  .select('*')
  .eq('membership_id', membershipId)
  .single();

// Get perks for a membership
const { data: perks } = await supabase
  .from('profile_perks')
  .select(`
    *,
    perk_types (
      name,
      description,
      icon_url,
      category,
      org_id
    )
  `)
  .eq('profile_id', profileId)
  .eq('perk_types.org_id', orgId)
  .eq('status', 'ACTIVE');
```

### 5.3 Activities

```typescript
// Get user's activities (all statuses)
const { data: activities } = await supabase
  .from('v_my_schedule')
  .select('*')
  .order('starts_at', { ascending: true });

// Filter by status
const { data: upcoming } = await supabase
  .from('v_my_schedule')
  .select('*')
  .in('time_label', ['upcoming', 'today'])
  .order('starts_at', { ascending: true });

const { data: invitations } = await supabase
  .from('v_my_schedule')
  .select('*')
  .eq('registration_status', 'INVITED')
  .order('starts_at', { ascending: true });

// Cancel registration (only before activity starts)
const { error } = await supabase
  .from('registration')
  .delete()
  .eq('id', registrationId)
  .eq('profile_id', profileId);
```

### 5.4 Interests

```typescript
// Get current interests
const { data: interests } = await supabase
  .from('profile_interests')
  .select(`
    id,
    created_at,
    categories (
      id,
      cat_name,
      color,
      bg_color
    )
  `)
  .eq('profile_id', profileId);

// Add interest
const { error } = await supabase
  .from('profile_interests')
  .insert({
    profile_id: profileId,
    category_id: categoryId
  });

// Remove interest
const { error } = await supabase
  .from('profile_interests')
  .delete()
  .eq('profile_id', profileId)
  .eq('category_id', categoryId);

// Get all available categories
const { data: categories } = await supabase
  .from('categories')
  .select('*')
  .order('cat_name', { ascending: true });
```

### 5.5 Favorites

```typescript
// Get all favorites
const { data: favorites } = await supabase
  .from('v_my_favorites')
  .select('*')
  .order('favorited_at', { ascending: false });

// Filter by type
const { data: activityFavorites } = await supabase
  .from('v_my_favorites')
  .select('*')
  .eq('favorite_type', 'activity');
```

---

## 6. Mobile Responsiveness

### 6.1 Breakpoints

```css
/* Mobile First */
.membership-card-stack {
  /* Base: Mobile (320px - 767px) */
  padding: 16px;
  height: 380px;
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) {
  .membership-card-stack {
    padding: 24px;
    height: 420px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .membership-card-stack {
    padding: 32px;
    height: 460px;
    max-width: 800px;
    margin: 0 auto;
  }
}
```

### 6.2 Touch Gestures Priority

**Mobile:**
- Primary: Vertical swipe (up/down) for card navigation
- Secondary: Tap on dots to jump to specific card
- Long press: Show card actions menu

**Desktop:**
- Primary: Horizontal scroll/swipe (left/right)
- Secondary: Click on navigation arrows
- Click on dots: Jump to specific card

---

## 7. Accessibility

### 7.1 ARIA Labels

```typescript
<div 
  role="region" 
  aria-label="Medlemskapskort"
  aria-live="polite"
  aria-atomic="true"
>
  <div 
    role="tablist"
    aria-label="Välj medlemskap"
  >
    {memberships.map((membership, index) => (
      <button
        key={membership.membership_id}
        role="tab"
        aria-selected={index === currentIndex}
        aria-controls={`membership-${index}`}
        onClick={() => setCurrentIndex(index)}
      >
        {membership.organization_name}
      </button>
    ))}
  </div>
  
  <div 
    id={`membership-${currentIndex}`}
    role="tabpanel"
    aria-labelledby={`tab-${currentIndex}`}
  >
    <MembershipCard {...currentMembership} />
  </div>
</div>
```

### 7.2 Keyboard Navigation

```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      navigatePrev();
      break;
    case 'ArrowRight':
    case 'ArrowDown':
      navigateNext();
      break;
    case 'Home':
      setCurrentIndex(0);
      break;
    case 'End':
      setCurrentIndex(memberships.length - 1);
      break;
  }
};
```

### 7.3 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  .membership-card {
    transition: none;
  }
  
  .card-stack {
    perspective: none;
  }
}
```

---

## 8. Performance Optimizations

### 8.1 Data Fetching Strategy

```typescript
// Use SWR or React Query for caching
const { data: profile } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => fetchProfile(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Prefetch adjacent membership cards
useEffect(() => {
  if (currentIndex < memberships.length - 1) {
    prefetchMembershipDetails(memberships[currentIndex + 1].membership_id);
  }
  if (currentIndex > 0) {
    prefetchMembershipDetails(memberships[currentIndex - 1].membership_id);
  }
}, [currentIndex]);
```

### 8.2 Image Optimization

```typescript
// Use Supabase Storage transformations
const getOptimizedImage = (url: string, size: 'small' | 'medium' | 'large') => {
  const dimensions = {
    small: '100x100',
    medium: '300x300',
    large: '600x600'
  };
  
  return `${url}?width=${dimensions[size]}&format=webp`;
};
```

### 8.3 Virtualization

For long lists (e.g., past activities), use virtual scrolling:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const ActivityList = ({ activities }) => {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: activities.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated card height
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <ActivityCard
            key={virtualItem.key}
            activity={activities[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

---

## 9. Testing Checklist

### 9.1 Functional Testing

- [ ] Card swapping works on mobile (vertical swipe)
- [ ] Card swapping works on desktop (horizontal swipe)
- [ ] Navigation dots update correctly
- [ ] Keyboard navigation works (arrow keys)
- [ ] All settings save correctly to database
- [ ] Profile updates reflect immediately
- [ ] Interest add/remove works
- [ ] Activity cancellation works (only before start)
- [ ] Privacy settings affect profile visibility
- [ ] GDPR data export generates correct file
- [ ] All links navigate to correct pages

### 9.2 UI/UX Testing

- [ ] Card stack 3D effect displays correctly
- [ ] Smooth transitions between cards
- [ ] Status badges show correct colors
- [ ] Empty states display appropriately
- [ ] Loading states don't cause layout shift
- [ ] Images load with proper aspect ratios
- [ ] Text doesn't overflow containers
- [ ] Touch targets are minimum 44x44px

### 9.3 Accessibility Testing

- [ ] Screen reader announces card changes
- [ ] All interactive elements have labels
- [ ] Focus visible on keyboard navigation
- [ ] Color contrast meets WCAG AA standards
- [ ] Works with reduced motion preference
- [ ] All forms have proper labels
- [ ] Error messages are descriptive

### 9.4 Performance Testing

- [ ] Page loads in < 3s on 4G
- [ ] Smooth 60fps animations
- [ ] No layout shift (CLS < 0.1)
- [ ] Images lazy load correctly
- [ ] No memory leaks in card swapping

---

## 10. Implementation Priority

### Phase 1: Core Profile (Week 1)
1. ✅ Main profile page layout
2. ✅ Membership card component (basic)
3. ✅ Profile header with stats
4. ✅ Settings navigation

### Phase 2: Membership Cards (Week 2)
1. ✅ Card swapping animation
2. ✅ Touch gesture handling
3. ✅ Card design variants by status
4. ✅ Navigation indicators
5. ✅ Membership details page

### Phase 3: Settings Pages (Week 3)
1. ✅ Notifications settings
2. ✅ Account settings
3. ✅ Privacy settings
4. ✅ Activity settings
5. ✅ Display settings

### Phase 4: Additional Features (Week 4)
1. ✅ Activities page with filtering
2. ✅ Interests management
3. ✅ Favorites page
4. ✅ Perks display
5. ✅ GDPR features

### Phase 5: Polish & Optimization (Week 5)
1. ✅ Animations refinement
2. ✅ Accessibility improvements
3. ✅ Performance optimization
4. ✅ Mobile testing
5. ✅ Error handling

---

## 11. Notes & Considerations

### 11.1 Business Logic

**Membership Expiry Handling:**
- Show warning 30 days before expiry
- Automatic state transition when end_date passes
- Grace period support (configurable per org)

**Privacy Enforcement:**
- Check `privacy_settings.profile_visibility` before showing profile
- Filter data based on viewer's relationship to user
- Staff can see more data than regular members

**GDPR Compliance:**
- Data export must include all tables with user data
- Account deletion must anonymize, not hard delete
- Preserve historical records for legal requirements

### 11.2 Edge Cases

**No Memberships:**
- Show empty state with CTA
- Link to organization discovery
- Don't hide membership section

**Expired Memberships:**
- Keep in card stack but visually distinct
- Show "Förnya medlemskap" button if applicable
- Option to hide expired in settings

**Multiple Roles:**
- User can be staff in one org, member in another
- Show appropriate interface per organization
- Badge/indicator for staff status

**Conflicting Settings:**
- Privacy > Communication preferences
- Organization settings > User preferences
- GDPR rights supersede all

### 11.3 Future Enhancements

1. **QR Code Membership Cards**
   - Generate QR code for check-in
   - Store in Apple/Google Wallet

2. **Achievements & Badges**
   - Gamification for engagement
   - Display on profile

3. **Social Features**
   - Friend connections
   - Activity buddy finder

4. **Advanced Analytics**
   - Participation trends
   - Category preferences
   - Time-of-day patterns

---

## 12. Quick Reference

### Key Views to Use:
- `v_user_profile` - Complete user profile
- `members_dashboard` - Membership cards data
- `v_my_organizations` - Organization details
- `v_my_schedule` - Activity registrations
- `v_my_favorites` - Favorites list

### Key Color Codes:
- Active (Green): `#10b981` → `#059669`
- Pending (Yellow): `#fbbf24` → `#f59e0b`
- Expired (Red): `#ef4444` → `#dc2626`
- Suspended (Orange): `#f97316` → `#ea580c`

### Status Icons:
- 🟢 Active
- 🟡 Pending
- 🔴 Expired
- ⛔ Suspended
- ❌ Cancelled
- ⚪ Unknown

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Status:** Ready for Implementation
