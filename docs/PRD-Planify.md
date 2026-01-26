# Product Requirements Document: Planify

**Version:** 1.0
**Date:** 2026-01-26
**Author:** Development Team
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary

Planify is a planning and coordination tool integrated into the Noisify platform, designed for organizations to plan, organize, and manage activities before publishing them. While Noisify focuses on publishing and sharing activities with members, Planify provides a collaborative internal planning environment for staff to coordinate schedules, assign responsibilities, and prepare activities for publication.

### 1.2 Problem Statement

Currently, organizations using Noisify lack a dedicated tool for:
- Planning activities before they are ready for publication
- Coordinating staff schedules and responsibilities
- Visualizing activity calendars across multiple weeks
- Managing collaborative planning with multiple team members
- Organizing activities into thematic plans (e.g., "Summer in Backa 2024")

### 1.3 Target Users

- **Staff Members:** Plan and manage activities within their organization
- **Activity Coordinators:** Organize and oversee multiple activities
- **Team Leaders:** Assign responsibilities and track planning progress

### 1.4 Success Metrics

- Reduction in time from activity conception to publication
- Number of activities planned per plan
- Staff adoption rate within organizations
- User satisfaction scores for planning workflow

---

## 2. User Experience

### 2.1 Application Switching

Users access Planify through the "Applikationer" (Applications) dropdown in the staff dashboard header. The dropdown displays:

| Application | Description (Swedish) | Description (English) |
|-------------|----------------------|----------------------|
| Noisify | Publicera och dela aktiviteter | Publish and share activities |
| Planify | Planera aktiviteter i din verksamhet | Plan activities in your organization |

### 2.2 User Flows

#### 2.2.1 Create a New Plan

```
1. User clicks "Planify" in app switcher
2. User lands on Plans listing page
3. User clicks "+ Ny plan" (+ New plan)
4. User enters plan details:
   - Plan name (required)
   - Cover image (optional)
   - Description (optional)
   - Date range (optional)
5. User saves plan
6. User is redirected to the plan's calendar view
```

#### 2.2.2 Add Activity to Plan

```
1. User opens a plan
2. User clicks "+ Skapa Aktivitet" (+ Create Activity)
3. User fills out activity form:
   - Title, Category, Target group
   - Date, time, location
   - Description, contact information
4. Activity appears on calendar/list
5. Activity status defaults to "Ej publicerad" (Not published)
```

#### 2.2.3 Publish Activity to Noisify

```
1. User opens activity details
2. User reviews all information
3. User clicks "Publicera" (Publish)
4. Activity is created in Noisify with status PUBLISHED
5. Activity status in Planify changes to "Publicerad" (Published)
```

---

## 3. Features & Requirements

### 3.1 Plans Management

#### 3.1.1 Plans Listing Page (`/planify`)

**Description:** A grid of plan cards showing all plans for the current organization.

**UI Components:**
- Header with "Planify" branding and user name
- Page title "Planer" (Plans)
- "+ Ny plan" button (top right)
- Grid of plan cards

**Plan Card Display:**
| Element | Description |
|---------|-------------|
| Cover Image | 16:9 aspect ratio, placeholder if none |
| Plan Name | Bold text, 2 lines max |
| Activity Count | Optional: "X aktiviteter" |
| Date Range | Optional: "10 jun - 16 jun" |

**Functional Requirements:**
- [ ] Display all plans for current organization
- [ ] Sort by: recently modified, name, date range
- [ ] Click card to open plan detail view
- [ ] Create new plan modal/page
- [ ] Delete plan (with confirmation)
- [ ] Edit plan metadata

#### 3.1.2 Plan Data Model

```typescript
interface Plan {
  id: string;                    // UUID
  org_id: string;                // Organization UUID
  name: string;                  // Plan name
  description?: string;          // Optional description
  cover_image_url?: string;      // Cover image URL
  start_date?: Date;             // Optional date range start
  end_date?: Date;               // Optional date range end
  created_by: string;            // Profile UUID
  created_at: Date;
  updated_at: Date;
}
```

### 3.2 Calendar View

#### 3.2.1 Weekly Calendar (`/planify/[planId]?view=calendar`)

**Description:** A weekly calendar view showing activities organized by day.

**UI Components:**
- Plan header with back button and plan name
- Tab navigation: "Kalendar" | "Lista" | "Statistik"
- Week navigation: "< Vecka: 24 >"
- "+ Skapa Aktivitet" button
- "Filter" button
- 7-column day grid (Måndag - Söndag)
- Activity cards within each day

**Activity Card Display (Calendar):**
| Element | Description |
|---------|-------------|
| Category Badge | Color-coded label (Dans, Mat, Sport/Motion, etc.) |
| Activity Title | Bold, 2 lines max |
| Time | "13:00 - 19:00" format |
| Organizer | Organization name |
| Location Icon + Name | Pin icon with location |

**Category Color Coding:**
| Category | Color | Swedish |
|----------|-------|---------|
| Dans (Dance) | Yellow/Orange | Dans |
| Mat (Food) | Orange | Mat |
| Öppen Fritidsgård | Green | Öppen Fritidsgård |
| Sport/Motion | Teal/Cyan | Sport/Motion |
| Spel/e-sport | Purple | Spel/e-sport |
| Event | Red/Pink | Event |
| Custom | Configurable | User-defined |

**Functional Requirements:**
- [ ] Display activities for current week
- [ ] Navigate between weeks (previous/next)
- [ ] Jump to specific week number
- [ ] Click activity to open detail panel
- [ ] Drag-and-drop to reschedule (future)
- [ ] Visual distinction for published vs unpublished
- [ ] Filter by category, status, contact person

### 3.3 List View

#### 3.3.1 Activity List (`/planify/[planId]?view=list`)

**Description:** A tabular view of all activities with sortable/filterable columns.

**Table Columns:**
| Column | Swedish | Type | Sortable |
|--------|---------|------|----------|
| Nr | Nr | Auto-increment | No |
| Aktivitet titel | Activity Title | Text | Yes |
| Kategori | Category | Badge | Yes |
| Kalendarium | Calendar Status | Status dropdown | Yes |
| Målgrupp | Target Group | Tags | Yes |
| Arrangör | Organizer | Text | Yes |
| Område | Area | Text | Yes |
| Datum | Date | Date range | Yes |
| Kontaktperson | Contact Person | Text | Yes |
| Ansvarig | Responsible | Text | Yes |
| Team | Team | Text | Yes |
| Actions | - | Icon button | No |

**Calendar Status (Kalendarium):**
- `Ej publicerad` (Not published) - Default
- `Publicerad` (Published) - Synced to Noisify

**View Options Dropdown:**
- Veckoschema (Weekly schedule) - Default
- Alla aktiviteter (All activities)
- Kommande (Upcoming)
- Tidigare (Past)

**Functional Requirements:**
- [ ] Sort by any column (click header)
- [ ] Filter by status, category, target group
- [ ] Inline editing of fields where appropriate
- [ ] Batch actions (select multiple)
- [ ] Export to CSV/Excel
- [ ] Week navigation (same as calendar)
- [ ] "Etiketter" (Labels) button for managing tags

### 3.4 Activity Management

#### 3.4.1 Activity Detail Panel

**Description:** A slide-over panel showing full activity details.

**Panel Sections:**

**Header:**
- Activity image (large)
- Close (X) button
- Activity title
- Category badge

**Info Section:**
| Field | Swedish | Icon |
|-------|---------|------|
| Date | Datum | Calendar |
| Time | Tid | Clock |
| Calendar Status | Kalendarium | - |

**Description Section:**
- Rich text description
- "Beskrivning" heading

**Details Section:**
| Field | Swedish |
|-------|---------|
| Target Group | Målgrupp |
| Organizer | Arrangör |
| Address | Adress |
| Area | Område |
| Contact Person | Kontaktperson |
| Phone | Telefon |
| Email | E-post |
| Published By | Publicerad av |

**Actions:**
- "Duplicera" (Duplicate) button
- Edit button
- Delete button
- Publish/Unpublish button

#### 3.4.2 Activity Data Model

```typescript
interface PlanActivity {
  id: string;                    // UUID
  plan_id: string;               // Plan UUID
  noisify_activity_id?: string;  // Linked Noisify activity UUID (when published)

  // Core fields
  title: string;
  description?: string;          // Rich text HTML
  category_id: string;           // Category UUID

  // Schedule
  start_date: Date;
  start_time: string;            // "HH:MM" format
  end_date: Date;
  end_time: string;

  // Location
  organizer: string;             // Arrangör
  address?: string;
  area?: string;                 // Område

  // People
  target_groups: string[];       // ["Barn", "Ungdom"]
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  responsible?: string;          // Ansvarig (internal)
  team?: string;                 // Team assignment

  // Media
  image_url?: string;

  // Status
  calendar_status: 'not_published' | 'published';

  // Metadata
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
```

#### 3.4.3 Create/Edit Activity Form

**Form Sections:**

**Basic Information:**
- Title (required)
- Category (required, dropdown)
- Description (rich text editor)
- Image upload

**Schedule:**
- Start date + time (required)
- End date + time (required)
- All-day toggle

**Location:**
- Organizer/Arrangör (required)
- Address
- Area/Område (dropdown of existing areas)

**Target & Assignment:**
- Target groups (multi-select: Barn, Ungdom, etc.)
- Contact person
- Phone
- Email
- Responsible staff (internal assignment)
- Team (dropdown)

### 3.5 Category Management

#### 3.5.1 Categories

**Default Categories:**
| ID | Name (Swedish) | Name (English) | Color |
|----|---------------|----------------|-------|
| 1 | Dans | Dance | #F59E0B (Amber) |
| 2 | Mat | Food | #F97316 (Orange) |
| 3 | Öppen Fritidsgård | Open Youth Center | #10B981 (Emerald) |
| 4 | Sport/Motion | Sports/Exercise | #14B8A6 (Teal) |
| 5 | Spel/e-sport | Gaming/E-sports | #8B5CF6 (Purple) |
| 6 | Event | Event | #EC4899 (Pink) |

**Category Data Model:**
```typescript
interface PlanCategory {
  id: string;
  org_id: string;
  name: string;
  color: string;           // Hex color code
  is_default: boolean;     // System default vs org-created
  sort_order: number;
  created_at: Date;
}
```

### 3.6 Statistics View

#### 3.6.1 Plan Statistics (`/planify/[planId]?view=stats`)

**Metrics Dashboard:**
- Total activities in plan
- Published vs unpublished count
- Activities by category (pie/bar chart)
- Activities by day of week
- Activities by target group
- Contact person activity count
- Team workload distribution

### 3.7 Filtering & Search

#### 3.7.1 Filter Panel

**Filter Options:**
- Category (multi-select)
- Calendar status (published/not published)
- Target group (multi-select)
- Area (multi-select)
- Contact person (search/select)
- Date range

#### 3.7.2 Quick Filters

- "Visa bara opublicerade" (Show only unpublished)
- "Visa bara publicerade" (Show only published)
- "Mina aktiviteter" (My activities)

---

## 4. Technical Architecture

### 4.1 Database Schema

#### 4.1.1 New Tables

```sql
-- Plans table
CREATE TABLE planify_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan activities table
CREATE TABLE planify_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES planify_plans(id) ON DELETE CASCADE,
  noisify_activity_id UUID REFERENCES activity(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES planify_categories(id),

  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE NOT NULL,
  end_time TIME NOT NULL,

  organizer TEXT NOT NULL,
  address TEXT,
  area TEXT,

  target_groups TEXT[] DEFAULT '{}',
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  responsible TEXT,
  team TEXT,

  image_url TEXT,
  calendar_status TEXT DEFAULT 'not_published' CHECK (calendar_status IN ('not_published', 'published')),

  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE planify_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_planify_plans_org ON planify_plans(org_id);
CREATE INDEX idx_planify_activities_plan ON planify_activities(plan_id);
CREATE INDEX idx_planify_activities_dates ON planify_activities(start_date, end_date);
CREATE INDEX idx_planify_categories_org ON planify_categories(org_id);

-- RLS policies
ALTER TABLE planify_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_categories ENABLE ROW LEVEL SECURITY;

-- Plans: Staff can read/write their org's plans
CREATE POLICY "Staff can manage org plans"
  ON planify_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_plans.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Activities: Staff can manage activities in their org's plans
CREATE POLICY "Staff can manage plan activities"
  ON planify_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM planify_plans p
      JOIN org_user ou ON ou.org_id = p.org_id
      WHERE p.id = planify_activities.plan_id
      AND ou.profile_id = auth.uid()
      AND ou.role_id >= 1
    )
  );

-- Categories: Staff can read default + their org's categories
CREATE POLICY "Staff can read categories"
  ON planify_categories FOR SELECT
  USING (
    is_default = TRUE
    OR EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_categories.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );
```

#### 4.1.2 Seed Default Categories

```sql
INSERT INTO planify_categories (name, color, is_default, sort_order) VALUES
  ('Dans', '#F59E0B', TRUE, 1),
  ('Mat', '#F97316', TRUE, 2),
  ('Öppen Fritidsgård', '#10B981', TRUE, 3),
  ('Sport/Motion', '#14B8A6', TRUE, 4),
  ('Spel/e-sport', '#8B5CF6', TRUE, 5),
  ('Event', '#EC4899', TRUE, 6);
```

### 4.2 File Structure

```
/app/planify/
├── page.tsx                      # Plans listing
├── layout.tsx                    # Planify layout with header
├── actions.ts                    # Server actions for plans
├── [planId]/
│   ├── page.tsx                  # Plan detail (calendar default)
│   ├── actions.ts                # Server actions for activities
│   └── loading.tsx               # Loading state

/components/planify/
├── planify-header.tsx            # Simple header with logo + user
├── plan-card.tsx                 # Plan card for listing
├── plan-form.tsx                 # Create/edit plan form
├── activity-calendar.tsx         # Weekly calendar view
├── activity-list.tsx             # Table list view
├── activity-card.tsx             # Activity card for calendar
├── activity-form.tsx             # Create/edit activity form
├── activity-detail-panel.tsx     # Slide-over detail panel
├── category-badge.tsx            # Color-coded category badge
├── week-navigator.tsx            # Week navigation component
├── filter-panel.tsx              # Filter dropdown/panel
├── stats-dashboard.tsx           # Statistics view
└── publish-button.tsx            # Publish to Noisify action

/actions/planify/
├── plans.ts                      # Plan CRUD actions
├── activities.ts                 # Activity CRUD actions
├── categories.ts                 # Category management
└── publish.ts                    # Publish to Noisify action
```

### 4.3 Integration with Noisify

#### 4.3.1 Publishing Flow

When a Planify activity is published to Noisify:

1. Create a new `activity` record in Noisify database
2. Map Planify fields to Noisify activity fields:

| Planify Field | Noisify Field |
|--------------|---------------|
| title | name |
| description | description |
| start_date + start_time | starts_at |
| end_date + end_time | ends_at |
| organizer | (custom field or org name) |
| address | address |
| target_groups | (membership rules or tags) |
| image_url | image_url |
| - | status = 'PUBLISHED' |
| - | owner_org_id = current org |

3. Store the created `activity.id` in `planify_activities.noisify_activity_id`
4. Update `calendar_status` to 'published'

#### 4.3.2 Sync Considerations

- Changes to published activities in Noisify should optionally sync back
- Unpublishing in Planify should archive/delete in Noisify (configurable)
- Duplicate detection to prevent republishing

### 4.4 API Routes / Server Actions

```typescript
// /actions/planify/plans.ts
export async function getPlans(orgId: string): Promise<Plan[]>
export async function getPlan(planId: string): Promise<Plan>
export async function createPlan(data: CreatePlanInput): Promise<Plan>
export async function updatePlan(planId: string, data: UpdatePlanInput): Promise<Plan>
export async function deletePlan(planId: string): Promise<void>

// /actions/planify/activities.ts
export async function getActivities(planId: string, filters?: ActivityFilters): Promise<PlanActivity[]>
export async function getActivitiesByWeek(planId: string, weekNumber: number, year: number): Promise<PlanActivity[]>
export async function getActivity(activityId: string): Promise<PlanActivity>
export async function createActivity(data: CreateActivityInput): Promise<PlanActivity>
export async function updateActivity(activityId: string, data: UpdateActivityInput): Promise<PlanActivity>
export async function deleteActivity(activityId: string): Promise<void>
export async function duplicateActivity(activityId: string): Promise<PlanActivity>

// /actions/planify/publish.ts
export async function publishToNoisify(activityId: string): Promise<{ noisifyActivityId: string }>
export async function unpublishFromNoisify(activityId: string): Promise<void>
```

---

## 5. UI/UX Specifications

### 5.1 Design System

Planify inherits the Noisify design system with these specifications:

**Colors:**
- Background: `#F8FAFC` (Slate 50)
- Card Background: `#FFFFFF`
- Primary Text: `#0F172A` (Slate 900)
- Secondary Text: `#64748B` (Slate 500)
- Primary Action: `#0F172A` (Dark button like "+ Ny plan")
- Secondary Action: `#10B981` (Emerald for "+ Skapa Aktivitet")

**Typography:**
- Headings: Inter/System font, semibold
- Body: Inter/System font, regular
- Font sizes following Tailwind defaults

**Spacing:**
- Consistent 4px grid
- Card padding: 16px-24px
- Section gaps: 24px-32px

### 5.2 Responsive Behavior

| Breakpoint | Calendar | List | Detail Panel |
|------------|----------|------|--------------|
| Desktop (1280px+) | 7-day grid | Full table | Side panel |
| Tablet (768-1279px) | 5-day grid, scroll | Reduced columns | Full-screen modal |
| Mobile (< 768px) | 1-day view | Cards instead of table | Full-screen modal |

### 5.3 Component Specifications

#### Week Navigator

```
┌─────────────────────────────────────────┐
│  <  │  Vecka: 24  │  >                  │
└─────────────────────────────────────────┘
```
- Left arrow: Previous week
- Right arrow: Next week
- Week number: Clickable to open week picker

#### Activity Card (Calendar)

```
┌─────────────────────────────────────────┐
│ ┌──────────┐                            │
│ │  Dans    │                            │
│ └──────────┘                            │
│ Musikstudio -                           │
│ Studiokörkort krävs                     │
│                                         │
│ 13:00 - 19:00                          │
│ Brunnsbo Fritidsgård                    │
│ 📍 Brunnsbo                             │
└─────────────────────────────────────────┘
```

#### Detail Panel

```
┌─────────────────────────────────────────┐
│                                      ✕  │
│ ┌─────────────────────────────────────┐ │
│ │         [Activity Image]            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Activity Title              ┌─────────┐ │
│                             │ Event   │ │
│                             └─────────┘ │
│                                         │
│ 📅 13 juni        🕐 09:30 - 10:30     │
│ Kalendarium: Publicerad                 │
│                                         │
│ ─────────────────────────────────────── │
│ Beskrivning                             │
│ Activity description text here...       │
│                                         │
│ ─────────────────────────────────────── │
│ Målgrupp:        Barn                   │
│ Arrangör:        Made in Backa          │
│ Adress:          Ellen keysskolan       │
│ Område:          Backa-röd              │
│ Kontaktperson:   Homeira Tari           │
│ Telefon:         076136i387             │
│ E-post:          homeira.tari@...       │
│                                         │
│ Publicerad av:                          │
│ homeira.tari@socialhisingen.goteborg.se │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │           Duplicera                 │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 6. Implementation Phases

### Phase 1: Foundation (MVP)

**Goal:** Basic plan management and activity listing

**Features:**
- [ ] Planify route structure and layout
- [ ] App switcher navigation (existing component functional)
- [ ] Plans listing page with cards
- [ ] Create/edit plan form
- [ ] Plan deletion with confirmation

**Database:**
- [ ] `planify_plans` table with RLS
- [ ] Basic migrations

### Phase 2: Activity Management

**Goal:** Create and manage activities within plans

**Features:**
- [ ] Activity list view (table)
- [ ] Create activity form
- [ ] Edit activity form
- [ ] Delete activity
- [ ] Activity detail panel
- [ ] Duplicate activity

**Database:**
- [ ] `planify_activities` table with RLS
- [ ] `planify_categories` table with defaults

### Phase 3: Calendar View

**Goal:** Visual weekly calendar view

**Features:**
- [ ] Weekly calendar component
- [ ] Week navigation
- [ ] Activity cards in calendar
- [ ] Click to view details
- [ ] Category color coding

### Phase 4: Filtering & Search

**Goal:** Find and filter activities easily

**Features:**
- [ ] Filter panel component
- [ ] Filter by category, status, target group
- [ ] Quick filter buttons
- [ ] Search within plan
- [ ] View mode dropdown (list view)

### Phase 5: Publishing Integration

**Goal:** Publish activities to Noisify

**Features:**
- [ ] Publish activity action
- [ ] Unpublish activity action
- [ ] Status sync display
- [ ] Bulk publish selected

### Phase 6: Statistics & Polish

**Goal:** Insights and final polish

**Features:**
- [ ] Statistics dashboard view
- [ ] Charts for activity distribution
- [ ] Export functionality
- [ ] Responsive mobile views
- [ ] Performance optimization

---

## 7. Dependencies

### 7.1 Existing Dependencies (Available)

- **react-big-calendar** (1.19.4) - Calendar component base
- **date-fns** - Date manipulation
- **Radix UI** - UI primitives
- **TipTap** - Rich text editor
- **Framer Motion** - Animations
- **Supabase** - Database & Auth

### 7.2 Potential New Dependencies

- None required - existing stack is sufficient

---

## 8. Security Considerations

### 8.1 Authorization

- All Planify data scoped to organization via RLS
- Only staff (role_id >= 1) can access Planify
- Activity publishing requires appropriate Noisify permissions

### 8.2 Data Validation

- Server-side validation for all inputs
- Sanitize rich text content
- Validate date ranges (end >= start)
- Validate file uploads (images only, size limits)

---

## 9. Accessibility

- Keyboard navigation for calendar and list views
- ARIA labels for interactive elements
- Color contrast compliance for category badges
- Screen reader support for activity details
- Focus management in modal/panel interactions

---

## 10. Localization

Primary language: Swedish (sv-SE)

Key translations:
| Swedish | English |
|---------|---------|
| Planer | Plans |
| Ny plan | New plan |
| Skapa Aktivitet | Create Activity |
| Kalendar | Calendar |
| Lista | List |
| Statistik | Statistics |
| Filter | Filter |
| Vecka | Week |
| Publicerad | Published |
| Ej publicerad | Not published |
| Duplicera | Duplicate |
| Målgrupp | Target group |
| Arrangör | Organizer |
| Kontaktperson | Contact person |
| Ansvarig | Responsible |

---

## 11. Open Questions

1. **Collaboration:** Should multiple staff see each other's edits in real-time?
2. **Permissions:** Can any staff member publish, or only certain roles?
3. **History:** Should we track activity change history/audit log?
4. **Templates:** Allow saving activities as templates for reuse?
5. **Import:** Support importing activities from external sources (CSV, iCal)?
6. **Notifications:** Notify team members when assigned to activities?
7. **Integration:** Two-way sync with Noisify, or one-way publish only?

---

## 12. Appendix

### A. Prototype Screenshots Reference

1. **Image 1:** App switcher dropdown showing Noisify and Planify options
2. **Image 2:** Plans listing page with "Sommar i Backa 2024" plan card
3. **Image 3 & 5:** Calendar view with activity detail panel
4. **Image 4:** List view with table format and all columns

### B. Related Documents

- Noisify Activity Management Specifications
- Noisify Database Schema
- Supabase RLS Policies Documentation

### C. Glossary

| Term | Definition |
|------|------------|
| Plan | A collection of activities organized around a theme or time period |
| Activity | A single event or activity within a plan |
| Kalendarium | Calendar status - whether published to Noisify |
| Arrangör | Organizer - the entity hosting the activity |
| Målgrupp | Target group - intended audience (Barn, Ungdom, etc.) |
| Område | Area - geographical area or district |
