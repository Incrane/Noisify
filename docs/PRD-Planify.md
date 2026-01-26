# Product Requirements Document: Planify

**Version:** 3.0
**Date:** 2026-01-26
**Author:** Development Team
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary

Planify is a planning and coordination tool integrated into the Noisify platform, designed for organizations to plan, organize, and manage activities before publishing them. While Noisify focuses on publishing and sharing activities with members, Planify provides a collaborative internal planning environment for staff to coordinate schedules, assign responsibilities, and prepare activities for publication.

**Key Differentiators:**
- **Real-time collaboration** - Multiple staff see each other's changes instantly
- **Guest access** - Share plans with external collaborators without requiring accounts
- **Staff scheduling** - Manage availability, vacations, and activity assignments
- **Activity templates** - Reuse common activity configurations
- **Two-way sync** - Changes in Noisify reflect back to Planify

### 1.2 Problem Statement

Currently, organizations using Noisify lack a dedicated tool for:
- Planning activities before they are ready for publication
- Coordinating staff schedules and responsibilities
- Visualizing activity calendars across multiple weeks
- Managing collaborative planning with multiple team members
- Organizing activities into thematic plans (e.g., "Summer in Backa 2024")
- Sharing planning progress with external stakeholders
- Tracking staff availability and workload

### 1.3 Target Users

| User Type | Description | Access Level |
|-----------|-------------|--------------|
| **Plan Owner** | Creates and owns plans, full control | Full access |
| **Plan Editor** | Staff who can create/edit activities | Edit access |
| **Plan Viewer** | Staff with read-only access | View only |
| **Guest Viewer** | External users with shared link | View only (limited UI) |
| **Activity Coordinators** | Organize and oversee multiple activities | Edit access |

### 1.4 Success Metrics

- Reduction in time from activity conception to publication
- Number of activities planned per plan
- Staff adoption rate within organizations
- Guest share link usage
- Real-time collaboration session frequency
- Staff scheduling accuracy (planned vs. actual)

---

## 2. Architecture Decision: Integrated with Guest Access

### 2.1 Approach

Planify is **integrated within Noisify** with a **guest access system** for external viewers:

```
┌─────────────────────────────────────────────────────────────────┐
│                         NOISIFY APP                             │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   Noisify (Staff)   │    │         Planify (Staff)         │ │
│  │  /staff/*           │◄──►│  /planify/*                     │ │
│  │  - Activities       │sync│  - Plans                        │ │
│  │  - Members          │    │  - Activities                   │ │
│  │  - Settings         │    │  - Staff Scheduler              │ │
│  └─────────────────────┘    │  - Templates                    │ │
│                              └─────────────────────────────────┘ │
│                                          │                       │
│                                          │ share link            │
│                                          ▼                       │
│                              ┌─────────────────────────────────┐ │
│                              │    Guest View (Public)          │ │
│                              │  /planify/view/[token]          │ │
│                              │  - Read-only plan view          │ │
│                              │  - No Noisify navigation        │ │
│                              │  - No account required          │ │
│                              └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Benefits

| Benefit | Description |
|---------|-------------|
| Single codebase | No duplication, easier maintenance |
| Shared auth | Staff use same Noisify credentials |
| Real-time sync | Same Supabase instance, instant updates |
| Guest isolation | External viewers see only shared plan |
| Scalable | Add more "apps" to the switcher easily |

### 2.3 Guest Access Flow

```
1. Staff opens plan settings
2. Staff clicks "Dela plan" (Share plan)
3. System generates unique share token
4. Staff copies link: https://app.noisify.se/planify/view/abc123
5. Staff sends link to external collaborator
6. Guest opens link → sees read-only plan view
7. Guest sees: Calendar/List view, activity details
8. Guest does NOT see: Noisify navigation, edit controls, publish buttons
```

---

## 3. User Experience

### 3.1 Application Switching

Users access Planify through the "Applikationer" (Applications) dropdown in the staff dashboard header. The dropdown displays:

| Application | Description (Swedish) | Description (English) |
|-------------|----------------------|----------------------|
| Noisify | Publicera och dela aktiviteter | Publish and share activities |
| Planify | Planera aktiviteter i din verksamhet | Plan activities in your organization |

### 3.2 User Flows

#### 3.2.1 Create a New Plan

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

#### 3.2.2 Add Activity to Plan

```
1. User opens a plan
2. User clicks "+ Skapa Aktivitet" (+ Create Activity)
3. User fills out activity form:
   - Title, Category, Target group
   - Date, time, location
   - Description, contact information
   - Assigned staff (from available staff)
4. Activity appears on calendar/list
5. Activity status defaults to "Ej publicerad" (Not published)
6. Other staff see the new activity in real-time
```

#### 3.2.3 Publish Activity to Noisify

```
1. User opens activity details (requires publish permission)
2. User reviews all information
3. User clicks "Publicera" (Publish)
4. Activity is created in Noisify with status PUBLISHED
5. Activity status in Planify changes to "Publicerad" (Published)
6. Link established for two-way sync
```

#### 3.2.4 Share Plan with Guest

```
1. User opens plan settings (requires owner/admin permission)
2. User clicks "Dela" (Share)
3. User selects sharing options:
   - Generate view-only link
   - Set expiration (optional)
   - Password protect (optional)
4. User copies and shares link
5. Guest accesses plan without login
```

#### 3.2.5 Create Activity from Template

```
1. User clicks "+ Skapa Aktivitet"
2. User selects "Från mall" (From template)
3. User browses/searches templates
4. User selects template
5. Form pre-fills with template data
6. User modifies as needed
7. User saves activity
```

---

## 4. Granular Permission System

### 4.1 Overview

Planify uses a **granular permission system** where plan owners and organization admins can create custom **Permission Sets** that define exactly what users can do. This provides flexibility for different collaboration scenarios.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERMISSION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHO CAN MANAGE PERMISSIONS?                                    │
│  ├── Plan Owner (always)                                        │
│  └── Org Staff with role_id >= 3 (for plans in their org)      │
│                                                                 │
│  PERMISSION SETS                                                │
│  ├── System Defaults (read-only, available to all plans)       │
│  │   ├── "Full Access" (like owner, minus ownership transfer)  │
│  │   ├── "Manager" (edit all, publish, manage members)         │
│  │   ├── "Contributor" (create, edit own, view all)            │
│  │   ├── "Viewer" (view only)                                  │
│  │   └── "Guest" (view only, limited UI, no sensitive data)    │
│  │                                                              │
│  └── Custom Sets (per plan or per organization)                │
│      └── Created by owner/org admins with granular permissions │
│                                                                 │
│  SHARING TYPES                                                  │
│  ├── Within Organization (invite existing staff by profile)    │
│  │   └── Assign any permission set                             │
│  ├── External Invite (invite by email, creates account)        │
│  │   └── Assign any permission set (pending until accepted)    │
│  └── Public Link (anonymous access, no account)                │
│      └── Assign view-only or custom guest permission set       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Granular Permissions

All available permissions that can be combined into Permission Sets:

#### 4.2.1 Activity Permissions

| Permission Key | Description | Notes |
|----------------|-------------|-------|
| `activity.create` | Create new activities | - |
| `activity.view_own` | View activities created by self | Minimum for any access |
| `activity.view_all` | View all activities in the plan | - |
| `activity.edit_own` | Edit activities created by self | - |
| `activity.edit_all` | Edit any activity | Overrides edit_own |
| `activity.delete_own` | Delete activities created by self | - |
| `activity.delete_all` | Delete any activity | Overrides delete_own |
| `activity.publish` | Publish activities to Noisify | Requires Noisify staff access |
| `activity.unpublish` | Unpublish/unlink from Noisify | - |
| `activity.duplicate` | Duplicate existing activities | - |

#### 4.2.2 Plan Permissions

| Permission Key | Description | Notes |
|----------------|-------------|-------|
| `plan.view` | View plan details and metadata | Required for any access |
| `plan.edit` | Edit plan name, description, cover, dates | - |
| `plan.delete` | Delete the entire plan | Dangerous, usually owner-only |
| `plan.manage_members` | Invite/remove plan members | - |
| `plan.manage_sharing` | Create/revoke public share links | - |
| `plan.manage_permissions` | Create/edit custom permission sets | - |
| `plan.transfer_ownership` | Transfer plan ownership | Owner-only |

#### 4.2.3 Template Permissions

| Permission Key | Description | Notes |
|----------------|-------------|-------|
| `template.view` | View available templates | - |
| `template.create` | Create new templates | - |
| `template.edit_own` | Edit templates created by self | - |
| `template.edit_all` | Edit any template | - |
| `template.delete_own` | Delete templates created by self | - |
| `template.delete_all` | Delete any template | - |
| `template.use` | Use templates to create activities | Usually paired with activity.create |

#### 4.2.4 Schedule Permissions

| Permission Key | Description | Notes |
|----------------|-------------|-------|
| `schedule.view_own` | View own schedule and assignments | - |
| `schedule.view_team` | View team schedule and availability | - |
| `schedule.edit_own` | Edit own availability | - |
| `schedule.edit_team` | Edit any staff's availability | Admin feature |
| `schedule.request_timeoff` | Submit time-off requests | - |
| `schedule.approve_timeoff` | Approve/reject time-off requests | Manager feature |

#### 4.2.5 Assignment Permissions

| Permission Key | Description | Notes |
|----------------|-------------|-------|
| `assignment.view` | View activity assignments | - |
| `assignment.assign_self` | Assign self to activities | - |
| `assignment.assign_others` | Assign other staff to activities | - |
| `assignment.remove_self` | Remove self from activities | - |
| `assignment.remove_others` | Remove others from activities | - |

#### 4.2.6 Sync Permissions

| Permission Key | Description | Notes |
|----------------|-------------|-------|
| `sync.view_status` | View sync status with Noisify | - |
| `sync.trigger` | Manually trigger sync | - |
| `sync.resolve_conflicts` | Resolve sync conflicts | - |

### 4.3 System Default Permission Sets

These are read-only, system-provided permission sets available to all plans:

#### Full Access
```json
{
  "name": "Full Access",
  "name_sv": "Full åtkomst",
  "description": "Complete control over the plan (except ownership transfer)",
  "is_system": true,
  "permissions": [
    "activity.*",
    "plan.view", "plan.edit", "plan.manage_members",
    "plan.manage_sharing", "plan.manage_permissions",
    "template.*",
    "schedule.*",
    "assignment.*",
    "sync.*"
  ]
}
```

#### Manager
```json
{
  "name": "Manager",
  "name_sv": "Ansvarig",
  "description": "Can manage activities and members, publish to Noisify",
  "is_system": true,
  "permissions": [
    "activity.create", "activity.view_all", "activity.edit_all",
    "activity.delete_all", "activity.publish", "activity.unpublish",
    "activity.duplicate",
    "plan.view", "plan.edit", "plan.manage_members", "plan.manage_sharing",
    "template.*",
    "schedule.view_own", "schedule.view_team", "schedule.edit_own",
    "schedule.approve_timeoff",
    "assignment.*",
    "sync.*"
  ]
}
```

#### Contributor
```json
{
  "name": "Contributor",
  "name_sv": "Bidragsgivare",
  "description": "Can create and edit own activities, view all",
  "is_system": true,
  "permissions": [
    "activity.create", "activity.view_all", "activity.edit_own",
    "activity.delete_own", "activity.duplicate",
    "plan.view",
    "template.view", "template.create", "template.edit_own",
    "template.delete_own", "template.use",
    "schedule.view_own", "schedule.view_team", "schedule.edit_own",
    "schedule.request_timeoff",
    "assignment.view", "assignment.assign_self", "assignment.remove_self"
  ]
}
```

#### Viewer
```json
{
  "name": "Viewer",
  "name_sv": "Visare",
  "description": "Read-only access to plan and activities",
  "is_system": true,
  "permissions": [
    "activity.view_all",
    "plan.view",
    "template.view",
    "schedule.view_own",
    "assignment.view",
    "sync.view_status"
  ]
}
```

#### Guest
```json
{
  "name": "Guest",
  "name_sv": "Gäst",
  "description": "Limited view access for external users (no sensitive data)",
  "is_system": true,
  "is_guest": true,
  "permissions": [
    "activity.view_all",
    "plan.view"
  ],
  "restrictions": {
    "hide_contact_info": true,
    "hide_internal_notes": true,
    "hide_assignments": true,
    "limited_ui": true
  }
}
```

### 4.4 Custom Permission Sets

Plan owners and org admins (role_id >= 3) can create custom permission sets:

#### 4.4.1 Example: "Activity Creator"
A user who can create activities but only edit/delete their own:

```json
{
  "name": "Activity Creator",
  "name_sv": "Aktivitetsskapare",
  "description": "Can create activities, edit/delete only own",
  "plan_id": "uuid-of-plan",
  "permissions": [
    "activity.create", "activity.view_all", "activity.edit_own",
    "activity.delete_own", "activity.duplicate",
    "plan.view",
    "template.view", "template.use",
    "schedule.view_own", "schedule.edit_own",
    "assignment.view", "assignment.assign_self"
  ]
}
```

#### 4.4.2 Example: "External Partner"
For collaborators from partner organizations:

```json
{
  "name": "External Partner",
  "name_sv": "Extern partner",
  "description": "Partner organization with limited edit access",
  "plan_id": "uuid-of-plan",
  "permissions": [
    "activity.create", "activity.view_all", "activity.edit_own",
    "plan.view",
    "template.view", "template.use",
    "assignment.view"
  ],
  "restrictions": {
    "hide_internal_notes": true
  }
}
```

#### 4.4.3 Example: "Publisher Only"
Can only publish, not create or edit:

```json
{
  "name": "Publisher Only",
  "name_sv": "Endast publicerare",
  "description": "Can review and publish activities to Noisify",
  "plan_id": "uuid-of-plan",
  "permissions": [
    "activity.view_all", "activity.publish", "activity.unpublish",
    "plan.view",
    "sync.*"
  ]
}
```

### 4.5 Permission Management UI

#### 4.5.1 Plan Settings → Permissions Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ Planinställningar                                            ✕  │
├─────────────────────────────────────────────────────────────────┤
│  Allmänt │ Medlemmar │ Behörigheter │ Delning                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Behörighetsuppsättningar                    [+ Skapa ny]       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SYSTEM (kan inte redigeras)                              │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 🔒 Full åtkomst      Komplett kontroll över planen      │   │
│  │ 🔒 Ansvarig          Hantera aktiviteter och medlemmar   │   │
│  │ 🔒 Bidragsgivare     Skapa och redigera egna aktiviteter │   │
│  │ 🔒 Visare            Endast läsåtkomst                   │   │
│  │ 🔒 Gäst              Begränsad vy för externa användare  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ANPASSADE                                                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ ✏️ Aktivitetsskapare  Kan skapa, redigera egna    [✏️][🗑️]│   │
│  │ ✏️ Extern partner     Partner med begränsad åtkomst[✏️][🗑️]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.5.2 Create/Edit Permission Set Dialog

```
┌─────────────────────────────────────────────────────────────────┐
│ Skapa behörighetsuppsättning                                 ✕  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Namn: [________________________]                               │
│  Beskrivning: [________________________]                        │
│                                                                 │
│  Börja från mall: [Bidragsgivare ▼]                            │
│                                                                 │
│  ───────────────────────────────────────────────────────────── │
│                                                                 │
│  AKTIVITETER                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑️ Skapa aktiviteter                                     │   │
│  │ ☑️ Visa egna aktiviteter                                 │   │
│  │ ☑️ Visa alla aktiviteter                                 │   │
│  │ ☑️ Redigera egna aktiviteter                             │   │
│  │ ☐ Redigera alla aktiviteter                              │   │
│  │ ☑️ Ta bort egna aktiviteter                              │   │
│  │ ☐ Ta bort alla aktiviteter                               │   │
│  │ ☐ Publicera till Noisify                                 │   │
│  │ ☐ Avpublicera från Noisify                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  PLAN                                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑️ Visa plan                                             │   │
│  │ ☐ Redigera plan                                          │   │
│  │ ☐ Hantera medlemmar                                      │   │
│  │ ☐ Hantera delning                                        │   │
│  │ ☐ Hantera behörigheter                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  MALLAR                                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☑️ Visa mallar                                           │   │
│  │ ☑️ Skapa mallar                                          │   │
│  │ ☑️ Använda mallar                                        │   │
│  │ ...                                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  BEGRÄNSNINGAR (för känslig data)                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ☐ Dölj kontaktinformation                                │   │
│  │ ☐ Dölj interna anteckningar                              │   │
│  │ ☐ Dölj tilldelningar                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [Avbryt]  [Spara]                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.6 Member Management with Permissions

#### 4.6.1 Invite Member Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Bjud in medlem                                               ✕  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Bjud in från:                                                  │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │  Organisation   │  │  E-post         │                      │
│  │  (befintlig)    │  │  (extern)       │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  [ORG TAB SELECTED]                                             │
│                                                                 │
│  Sök personal: [__________________] 🔍                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Maria Andersson       maria@org.se        [+ Lägg till]│   │
│  │ 👤 Johan Eriksson        johan@org.se        [+ Lägg till]│   │
│  │ 👤 Emma Lindberg         emma@org.se         ✓ Redan med  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Behörighetsuppsättning: [Bidragsgivare ▼]                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ℹ️ Bidragsgivare kan:                                    │   │
│  │   • Skapa och redigera egna aktiviteter                 │   │
│  │   • Visa alla aktiviteter                               │   │
│  │   • Hantera egen tillgänglighet                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              [Avbryt]  [Bjud in]                │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.6.2 Members List with Permissions

```
┌─────────────────────────────────────────────────────────────────┐
│ Planinställningar                                            ✕  │
├─────────────────────────────────────────────────────────────────┤
│  Allmänt │ Medlemmar │ Behörigheter │ Delning                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Medlemmar (5)                                   [+ Bjud in]    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 👤 Rafael (du)              Ägare           👑            │   │
│  │    rafael@org.se            Full åtkomst                 │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 👤 Maria Andersson          Intern                       │   │
│  │    maria@org.se             [Ansvarig ▼]          [🗑️]   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 👤 Johan Eriksson           Intern                       │   │
│  │    johan@org.se             [Bidragsgivare ▼]     [🗑️]   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 👤 Emma Lindberg            Intern                       │   │
│  │    emma@org.se              [Aktivitetsskapare ▼] [🗑️]   │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 👤 Anders Partner           Extern          ⏳ Väntar     │   │
│  │    anders@partner.se        [Extern partner ▼]    [🗑️]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.7 Share Links with Permission Sets

Share links can now be assigned a permission set (typically Guest or a custom guest set):

```
┌─────────────────────────────────────────────────────────────────┐
│ Dela plan                                                    ✕  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Offentlig länk                                                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://app.noisify.se/planify/view/abc123xyz    [📋]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Behörighet: [Gäst ▼]                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ℹ️ Gäster kan:                                           │   │
│  │   • Visa aktiviteter (utan kontaktinfo)                 │   │
│  │   • Visa kalender och lista                             │   │
│  │   • INTE se interna anteckningar eller tilldelningar    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Avancerade inställningar:                                      │
│  ☐ Lösenordsskydda länken                                      │
│  ☐ Sätt utgångsdatum  [____________]                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Aktiva länkar (2)                                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ abc123xyz   Gäst      23 visningar   Aldrig    [🗑️]     │   │
│  │ def456uvw   Gäst      5 visningar    Om 7 dagar [🗑️]    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.8 Data Models

#### 4.8.1 Permission Set Model

```typescript
interface PermissionSet {
  id: string;

  // Scope - system sets have no plan_id/org_id
  plan_id?: string;              // Custom set for specific plan
  org_id?: string;               // Custom set for entire organization

  // Metadata
  name: string;
  name_sv: string;               // Swedish name
  description?: string;
  is_system: boolean;            // System default (read-only)
  is_guest: boolean;             // Designed for guest/external access

  // Permissions array
  permissions: string[];         // e.g., ["activity.create", "activity.view_all"]

  // Restrictions for sensitive data
  restrictions?: {
    hide_contact_info?: boolean;
    hide_internal_notes?: boolean;
    hide_assignments?: boolean;
    hide_financials?: boolean;
    limited_ui?: boolean;
  };

  // Audit
  created_by?: string;           // NULL for system sets
  created_at: Date;
  updated_at: Date;
}
```

#### 4.8.2 Plan Member Model (Updated)

```typescript
interface PlanMember {
  id: string;
  plan_id: string;

  // User identification
  profile_id?: string;           // NULL for pending external invites
  email: string;                 // Always stored for reference

  // Permission
  permission_set_id: string;     // References permission set

  // Membership type
  membership_type: 'internal' | 'external';  // From org or invited by email

  // Invitation tracking
  invited_by: string;            // Profile UUID
  invited_at: Date;
  accepted_at?: Date;
  status: 'pending' | 'active' | 'revoked';

  // Special flags
  is_owner: boolean;             // Plan owner (cannot be removed, always full access)
}
```

#### 4.8.3 Share Link Model (Updated)

```typescript
interface PlanShareLink {
  id: string;
  plan_id: string;

  // Access
  token: string;                 // Unique URL token
  permission_set_id: string;     // Permission set for guests using this link

  // Security
  password_hash?: string;        // Optional password protection
  expires_at?: Date;             // Optional expiration

  // Status
  is_active: boolean;

  // Analytics
  access_count: number;
  last_accessed_at?: Date;

  // Audit
  created_by: string;
  created_at: Date;
}
```

### 4.9 Permission Checking Logic

```typescript
// Server-side permission check utility
async function checkPermission(
  userId: string,
  planId: string,
  permission: string
): Promise<boolean> {
  // 1. Get user's membership in this plan
  const member = await getPlanMember(planId, userId);
  if (!member || member.status !== 'active') {
    return false;
  }

  // 2. Plan owner always has full access
  if (member.is_owner) {
    return true;
  }

  // 3. Get the permission set
  const permissionSet = await getPermissionSet(member.permission_set_id);

  // 4. Check if permission is granted
  return hasPermission(permissionSet.permissions, permission);
}

// Check permission with wildcard support
function hasPermission(permissions: string[], required: string): boolean {
  // Direct match
  if (permissions.includes(required)) return true;

  // Wildcard match (e.g., "activity.*" matches "activity.create")
  const category = required.split('.')[0];
  if (permissions.includes(`${category}.*`)) return true;

  // Full wildcard
  if (permissions.includes('*')) return true;

  return false;
}

// Check "own" vs "all" permissions
async function canEditActivity(
  userId: string,
  planId: string,
  activityId: string
): Promise<boolean> {
  const activity = await getActivity(activityId);

  // Check if user can edit all
  if (await checkPermission(userId, planId, 'activity.edit_all')) {
    return true;
  }

  // Check if user can edit own and is creator
  if (await checkPermission(userId, planId, 'activity.edit_own')) {
    return activity.created_by === userId;
  }

  return false;
}
```

### 4.10 Who Can Manage Permissions

Permission management (`plan.manage_permissions`) is restricted to:

1. **Plan Owner** - Always has full control
2. **Organization Staff with `role_id >= 3`** - Can manage permissions for any plan in their organization

```typescript
async function canManagePermissions(
  userId: string,
  planId: string
): Promise<boolean> {
  // Check if plan owner
  const member = await getPlanMember(planId, userId);
  if (member?.is_owner) {
    return true;
  }

  // Check if org admin (role_id >= 3)
  const plan = await getPlan(planId);
  const orgUser = await getOrgUser(plan.org_id, userId);
  if (orgUser?.role_id >= 3) {
    return true;
  }

  // Check if has permission via permission set
  return checkPermission(userId, planId, 'plan.manage_permissions');
}
```

---

## 5. Real-Time Collaboration

### 5.1 Overview

Multiple staff members can work on the same plan simultaneously, seeing each other's changes in real-time.

### 5.2 Real-Time Features

| Feature | Description |
|---------|-------------|
| **Live cursors** | See where other users are working (optional) |
| **Instant updates** | New/edited activities appear immediately |
| **Presence indicators** | See who is currently viewing the plan |
| **Conflict resolution** | Last-write-wins with notification |
| **Activity locking** | Optional: Lock activity while editing |

### 5.3 Technical Implementation

Using **Supabase Realtime** with PostgreSQL:

```typescript
// Subscribe to plan changes
const channel = supabase
  .channel(`plan:${planId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'planify_activities',
    filter: `plan_id=eq.${planId}`
  }, (payload) => {
    // Handle INSERT, UPDATE, DELETE
    handleActivityChange(payload)
  })
  .on('presence', { event: 'sync' }, () => {
    // Handle presence updates
    const state = channel.presenceState()
    setActiveUsers(state)
  })
  .subscribe()

// Track user presence
channel.track({
  user_id: currentUser.id,
  user_name: currentUser.name,
  online_at: new Date().toISOString(),
  viewing: 'calendar' // or 'list', 'activity:123'
})
```

### 5.4 Presence UI

```
┌─────────────────────────────────────────────────────────────────┐
│ Sommar i Backa 2024                              👤 Rafael      │
│ Kalendar | Lista | Statistik                     👤 Maria (2)   │
│                                                  👤 +3 online   │
└─────────────────────────────────────────────────────────────────┘
```

- Show avatars of active users
- Tooltip shows full list
- Color indicators for who's editing what

---

## 6. Two-Way Sync with Noisify

### 6.1 Sync Architecture

```
┌──────────────────┐         ┌──────────────────┐
│  Planify         │◄───────►│  Noisify         │
│  Activity        │  sync   │  Activity        │
│                  │         │                  │
│  id: "plan-123"  │────────►│  id: "nois-456"  │
│  noisify_id: ──────────────│                  │
│    "nois-456"    │◄────────│  planify_id: ────│
│                  │         │    "plan-123"    │
└──────────────────┘         └──────────────────┘
```

### 6.2 Sync Rules

| Scenario | Behavior |
|----------|----------|
| Planify activity published | Create Noisify activity, link IDs |
| Planify activity updated (published) | Update Noisify activity |
| Noisify activity updated | Update Planify activity |
| Noisify activity deleted | Mark Planify as "unlinked", keep data |
| Planify activity unpublished | Archive Noisify activity (configurable) |
| Planify activity deleted | Archive Noisify activity (configurable) |

### 6.3 Sync Field Mapping

| Planify Field | Noisify Field | Sync Direction |
|--------------|---------------|----------------|
| title | name | Bidirectional |
| description | description | Bidirectional |
| start_date + start_time | starts_at | Bidirectional |
| end_date + end_time | ends_at | Bidirectional |
| image_url | image_url | Bidirectional |
| address | address | Bidirectional |
| capacity | capacity | Bidirectional |
| - | status | Noisify → Planify (read-only) |
| - | registration_count | Noisify → Planify (read-only) |
| organizer | (mapped to org) | Planify → Noisify |
| category_id | (custom mapping) | Planify → Noisify |

### 6.4 Conflict Resolution

When the same activity is edited in both systems simultaneously:

1. **Last-write-wins** for simple fields
2. **Timestamp comparison** to determine latest
3. **Notification to editor** if their change was overwritten
4. **Audit log** tracks all sync events

### 6.5 Sync Status Indicators

| Status | Badge | Description |
|--------|-------|-------------|
| Not published | `Ej publicerad` (gray) | Only in Planify |
| Synced | `Synkad` (green) | In sync with Noisify |
| Pending sync | `Synkar...` (yellow) | Changes being synced |
| Sync conflict | `Konflikt` (red) | Manual resolution needed |
| Unlinked | `Olänkad` (orange) | Was published, Noisify deleted |

---

## 7. Activity Templates

### 7.1 Overview

Templates allow staff to save common activity configurations for reuse, reducing repetitive data entry.

### 7.2 Template Features

| Feature | Description |
|---------|-------------|
| Save as template | Create template from existing activity |
| Template library | Browse org's templates |
| Quick create | One-click create from template |
| Template categories | Organize templates |
| Default templates | System-provided common templates |

### 7.3 Template Data Model

```typescript
interface ActivityTemplate {
  id: string;
  org_id: string;
  name: string;                  // Template name
  description?: string;          // Template description

  // Pre-filled activity fields
  activity_title?: string;
  activity_description?: string;
  category_id?: string;
  duration_minutes?: number;     // Default duration
  default_organizer?: string;
  default_area?: string;
  target_groups?: string[];
  default_capacity?: number;

  // Template metadata
  is_system_template: boolean;   // Default templates
  usage_count: number;           // Track popularity
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
```

### 7.4 Template UI Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Skapa aktivitet                                              ✕  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Börja från:                                                    │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │   Tom           │  │   Mall          │                      │
│  │   aktivitet     │  │   (Template)    │                      │
│  └─────────────────┘  └─────────────────┘                      │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Populära mallar:                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🎵 Musikstudio session          Sport/Motion  │ Använd │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 🍕 Sommarfika aktivitet         Mat           │ Använd │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ 🏃 Sportevenemang               Sport/Motion  │ Använd │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Visa alla mallar]                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.5 Save as Template

From activity detail panel:
```
┌─────────────────────────────────────────┐
│ ...                                     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │           Duplicera                 │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │        Spara som mall ⭐            │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 8. Staff Scheduler

### 8.1 Overview

The Staff Scheduler helps organizations track staff availability, plan work assignments, and manage time-off requests.

### 8.2 Features

| Feature | Description |
|---------|-------------|
| **Availability calendar** | Staff set their available hours |
| **Vacation/time-off** | Request and approve time off |
| **Activity assignments** | See who's assigned to what |
| **Workload view** | Visualize staff workload distribution |
| **Conflict detection** | Alert when assigning unavailable staff |
| **Shift patterns** | Recurring availability (e.g., Mondays 9-17) |

### 8.3 Data Models

#### 8.3.1 Staff Availability

```typescript
interface StaffAvailability {
  id: string;
  profile_id: string;
  org_id: string;

  // Availability type
  type: 'available' | 'unavailable' | 'vacation' | 'sick' | 'other';

  // Time range
  start_date: Date;
  end_date: Date;
  start_time?: string;          // NULL = all day
  end_time?: string;

  // Recurrence (for regular schedules)
  is_recurring: boolean;
  rrule?: string;               // iCal recurrence rule

  // Metadata
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';  // For time-off requests
  approved_by?: string;
  created_at: Date;
}
```

#### 8.3.2 Activity Staff Assignment

```typescript
interface ActivityAssignment {
  id: string;
  activity_id: string;          // Planify activity
  profile_id: string;           // Assigned staff
  role: 'lead' | 'support' | 'volunteer';
  status: 'assigned' | 'confirmed' | 'declined';
  assigned_by: string;
  assigned_at: Date;
  notes?: string;
}
```

### 8.4 Staff Scheduler Views

#### 8.4.1 Personal Schedule View (`/planify/schedule`)

Staff member's personal view:

```
┌─────────────────────────────────────────────────────────────────┐
│ Mitt schema                                         Rafael      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Min tillgänglighet                      [+ Lägg till]       │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Måndag - Fredag    09:00 - 17:00       Återkommande  ✏️ 🗑️ │ │
│ │ Lördag             10:00 - 14:00       Återkommande  ✏️ 🗑️ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Ledighet & Frånvaro                     [+ Begär ledighet]  │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 15 jul - 30 jul    Semester            ✅ Godkänd          │ │
│ │ 5 aug              Läkarbesök          ⏳ Väntar            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Mina aktiviteter denna vecka           Vecka: 24            │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Mån 10 jun  13:00  Musikstudio          Ansvarig            │ │
│ │ Tis 11 jun  14:00  Sommarfika - Mellan  Stöd                │ │
│ │ Ons 12 jun  17:00  Planerad verksamhet  Ansvarig            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.4.2 Team Schedule View (`/planify/team-schedule`)

Manager view of all staff:

```
┌─────────────────────────────────────────────────────────────────┐
│ Personalschema                              Vecka: 24    Filter │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│        │ Mån 10  │ Tis 11  │ Ons 12  │ Tor 13  │ Fre 14  │     │
│ ───────┼─────────┼─────────┼─────────┼─────────┼─────────┼     │
│ Rafael │ ██ 2 akt│ ██ 1 akt│ ██ 1 akt│ ░░      │ ██ 3 akt│     │
│ Maria  │ ██ 1 akt│ ░░ LED  │ ░░ LED  │ ██ 2 akt│ ██ 1 akt│     │
│ Johan  │ ░░      │ ██ 2 akt│ ██ 2 akt│ ██ 1 akt│ ░░      │     │
│ Emma   │ ██ 1 akt│ ██ 1 akt│ ░░ SJUK │ ░░ SJUK │ ██ 2 akt│     │
│                                                                 │
│ ██ = Tillgänglig   ░░ = Ej tillgänglig   LED = Ledighet         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 8.4.3 Activity Assignment UI

When creating/editing an activity:

```
┌─────────────────────────────────────────────────────────────────┐
│ Tilldela personal                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Datum: Måndag 10 juni, 13:00 - 19:00                           │
│                                                                 │
│ Tillgänglig personal:                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✓ Rafael          09:00 - 17:00    [Ansvarig ▼]            │ │
│ │ ✓ Johan           10:00 - 18:00    [Stöd ▼]                │ │
│ │ ○ Maria           ⚠️ Ej tillgänglig (Ledighet)              │ │
│ │ ○ Emma            ✓ Tillgänglig    [Välj roll ▼]           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ⚠️ Maria är markerad som ledig denna dag                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.5 Time-Off Request Flow

```
1. Staff clicks "Begär ledighet" (Request time off)
2. Staff selects dates and type (vacation, sick, other)
3. Staff adds optional notes
4. Request saved with status "pending"
5. Admin/Owner receives notification
6. Admin reviews and approves/rejects
7. Staff notified of decision
8. Approved time-off blocks assignments
```

---

## 9. Features & Requirements (Updated)

### 9.1 Plans Management

#### 9.1.1 Plans Listing Page (`/planify`)

**Description:** A grid of plan cards showing all plans for the current organization.

**UI Components:**
- Header with "Planify" branding and user name
- Page title "Planer" (Plans)
- "+ Ny plan" button (top right)
- Grid of plan cards
- Active users indicator

**Plan Card Display:**
| Element | Description |
|---------|-------------|
| Cover Image | 16:9 aspect ratio, placeholder if none |
| Plan Name | Bold text, 2 lines max |
| Activity Count | "X aktiviteter" |
| Member Count | "X medlemmar" |
| Active Users | Avatars of currently viewing users |
| Share Status | 🔗 if shared externally |

**Functional Requirements:**
- [ ] Display all plans for current organization
- [ ] Sort by: recently modified, name, date range
- [ ] Click card to open plan detail view
- [ ] Create new plan modal/page
- [ ] Delete plan (with confirmation, owner only)
- [ ] Edit plan metadata
- [ ] Show active collaborators on each plan

#### 9.1.2 Plan Data Model (Updated)

```typescript
interface Plan {
  id: string;                    // UUID
  org_id: string;                // Organization UUID
  name: string;                  // Plan name
  description?: string;          // Optional description
  cover_image_url?: string;      // Cover image URL
  start_date?: Date;             // Optional date range start
  end_date?: Date;               // Optional date range end

  // Ownership & sharing
  created_by: string;            // Profile UUID (owner)
  is_shared: boolean;            // Has active share links

  // Settings
  default_sync_enabled: boolean; // Auto-sync new activities to Noisify

  created_at: Date;
  updated_at: Date;
}
```

### 9.2 Calendar View

(Same as before, with real-time updates)

**Additional Functional Requirements:**
- [ ] Real-time activity updates (Supabase Realtime)
- [ ] Show presence indicators for collaborators
- [ ] Conflict warning when editing same activity

### 9.3 List View

(Same as before, with real-time updates)

### 9.4 Activity Management

(Same as before, with templates and assignments)

**Additional Activity Fields:**
```typescript
interface PlanActivity {
  // ... existing fields ...

  // Staff assignments
  assignments: ActivityAssignment[];

  // Sync tracking
  last_synced_at?: Date;
  sync_status: 'not_published' | 'synced' | 'pending' | 'conflict' | 'unlinked';
  sync_error?: string;

  // Template reference
  created_from_template_id?: string;
}
```

### 9.5 Category Management

(Same as before)

### 9.6 Statistics View

**Additional Metrics:**
- Staff workload distribution
- Template usage statistics
- Sync status overview
- Guest view analytics (for shared plans)

### 9.7 Filtering & Search

(Same as before)

**Additional Filters:**
- Assigned to (staff member)
- Sync status
- Created from template

---

## 10. Technical Architecture

### 10.1 Database Schema (Updated)

```sql
-- =====================================================
-- PLANS
-- =====================================================

CREATE TABLE planify_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  is_shared BOOLEAN DEFAULT FALSE,
  default_sync_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PERMISSION SETS (Granular Permissions)
-- =====================================================

CREATE TYPE planify_member_status AS ENUM ('pending', 'active', 'revoked');
CREATE TYPE planify_membership_type AS ENUM ('internal', 'external');

-- Permission Sets define what users can do
CREATE TABLE planify_permission_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope: NULL = system default, org_id = org-wide, plan_id = plan-specific
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES planify_plans(id) ON DELETE CASCADE,

  -- Metadata
  name TEXT NOT NULL,
  name_sv TEXT NOT NULL,         -- Swedish name
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,  -- System defaults are read-only
  is_guest BOOLEAN DEFAULT FALSE,   -- Designed for guest/external access

  -- Permissions array (e.g., ["activity.create", "activity.view_all"])
  permissions TEXT[] NOT NULL DEFAULT '{}',

  -- Restrictions for sensitive data hiding
  restrictions JSONB DEFAULT '{}',
  -- Example: {"hide_contact_info": true, "hide_internal_notes": true}

  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique names within scope
  UNIQUE(org_id, plan_id, name)
);

-- =====================================================
-- PLAN MEMBERS (with Permission Sets)
-- =====================================================

CREATE TABLE planify_plan_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES planify_plans(id) ON DELETE CASCADE,

  -- User identification
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,           -- Always stored for reference

  -- Permission set reference
  permission_set_id UUID NOT NULL REFERENCES planify_permission_sets(id),

  -- Membership type
  membership_type planify_membership_type NOT NULL DEFAULT 'internal',

  -- Special flags
  is_owner BOOLEAN DEFAULT FALSE,  -- Plan owner (always full access)

  -- Invitation tracking
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status planify_member_status DEFAULT 'pending',

  -- Constraints
  UNIQUE(plan_id, profile_id),
  UNIQUE(plan_id, email)
);

-- =====================================================
-- SHARE LINKS (Guest Access with Permission Sets)
-- =====================================================

CREATE TABLE planify_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES planify_plans(id) ON DELETE CASCADE,

  -- Access
  token TEXT NOT NULL UNIQUE,    -- URL token
  permission_set_id UUID NOT NULL REFERENCES planify_permission_sets(id),

  -- Security
  password_hash TEXT,            -- Optional password
  expires_at TIMESTAMPTZ,        -- Optional expiration

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Analytics
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES
-- =====================================================

CREATE TABLE planify_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  is_default BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTIVITIES
-- =====================================================

CREATE TYPE planify_sync_status AS ENUM (
  'not_published', 'synced', 'pending', 'conflict', 'unlinked'
);

CREATE TABLE planify_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES planify_plans(id) ON DELETE CASCADE,
  noisify_activity_id UUID REFERENCES activity(id) ON DELETE SET NULL,

  -- Core fields
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES planify_categories(id),

  -- Schedule
  start_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_date DATE NOT NULL,
  end_time TIME NOT NULL,

  -- Location
  organizer TEXT NOT NULL,
  address TEXT,
  area TEXT,

  -- People
  target_groups TEXT[] DEFAULT '{}',
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  -- Media
  image_url TEXT,

  -- Sync
  sync_status planify_sync_status DEFAULT 'not_published',
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Template
  created_from_template_id UUID REFERENCES planify_templates(id) ON DELETE SET NULL,

  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ACTIVITY ASSIGNMENTS
-- =====================================================

CREATE TYPE assignment_role AS ENUM ('lead', 'support', 'volunteer');
CREATE TYPE assignment_status AS ENUM ('assigned', 'confirmed', 'declined');

CREATE TABLE planify_activity_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES planify_activities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role assignment_role DEFAULT 'support',
  status assignment_status DEFAULT 'assigned',
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,

  UNIQUE(activity_id, profile_id)
);

-- =====================================================
-- TEMPLATES
-- =====================================================

CREATE TABLE planify_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,

  -- Template fields
  activity_title TEXT,
  activity_description TEXT,
  category_id UUID REFERENCES planify_categories(id),
  duration_minutes INTEGER,
  default_organizer TEXT,
  default_area TEXT,
  target_groups TEXT[] DEFAULT '{}',
  default_capacity INTEGER,

  -- Metadata
  is_system_template BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STAFF AVAILABILITY
-- =====================================================

CREATE TYPE availability_type AS ENUM ('available', 'unavailable', 'vacation', 'sick', 'other');
CREATE TYPE availability_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE planify_staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  type availability_type NOT NULL,

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,              -- NULL = all day
  end_time TIME,

  is_recurring BOOLEAN DEFAULT FALSE,
  rrule TEXT,                   -- iCal recurrence rule

  notes TEXT,
  status availability_status DEFAULT 'approved',  -- 'pending' for time-off requests
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SYNC LOG (Audit Trail)
-- =====================================================

CREATE TABLE planify_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES planify_activities(id) ON DELETE SET NULL,
  noisify_activity_id UUID,
  action TEXT NOT NULL,          -- 'publish', 'sync', 'conflict', 'unlink'
  direction TEXT NOT NULL,       -- 'planify_to_noisify', 'noisify_to_planify'
  details JSONB,                 -- Changed fields, error details, etc.
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_planify_plans_org ON planify_plans(org_id);
CREATE INDEX idx_planify_permission_sets_org ON planify_permission_sets(org_id);
CREATE INDEX idx_planify_permission_sets_plan ON planify_permission_sets(plan_id);
CREATE INDEX idx_planify_permission_sets_system ON planify_permission_sets(is_system) WHERE is_system = TRUE;
CREATE INDEX idx_planify_plan_members_plan ON planify_plan_members(plan_id);
CREATE INDEX idx_planify_plan_members_profile ON planify_plan_members(profile_id);
CREATE INDEX idx_planify_plan_members_permission_set ON planify_plan_members(permission_set_id);
CREATE INDEX idx_planify_share_links_token ON planify_share_links(token);
CREATE INDEX idx_planify_share_links_plan ON planify_share_links(plan_id);
CREATE INDEX idx_planify_share_links_permission_set ON planify_share_links(permission_set_id);
CREATE INDEX idx_planify_activities_plan ON planify_activities(plan_id);
CREATE INDEX idx_planify_activities_dates ON planify_activities(start_date, end_date);
CREATE INDEX idx_planify_activities_noisify ON planify_activities(noisify_activity_id);
CREATE INDEX idx_planify_activities_created_by ON planify_activities(created_by);
CREATE INDEX idx_planify_activity_assignments_activity ON planify_activity_assignments(activity_id);
CREATE INDEX idx_planify_activity_assignments_profile ON planify_activity_assignments(profile_id);
CREATE INDEX idx_planify_templates_org ON planify_templates(org_id);
CREATE INDEX idx_planify_templates_created_by ON planify_templates(created_by);
CREATE INDEX idx_planify_staff_availability_profile ON planify_staff_availability(profile_id);
CREATE INDEX idx_planify_staff_availability_org ON planify_staff_availability(org_id);
CREATE INDEX idx_planify_staff_availability_dates ON planify_staff_availability(start_date, end_date);
CREATE INDEX idx_planify_categories_org ON planify_categories(org_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE planify_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_permission_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_plan_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_activity_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE planify_sync_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PERMISSION CHECKING FUNCTION
-- =====================================================

-- Function to check if user has a specific permission in a plan
CREATE OR REPLACE FUNCTION has_plan_permission(
  p_plan_id UUID,
  p_user_id UUID,
  p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_permissions TEXT[];
  v_is_owner BOOLEAN;
BEGIN
  -- Get member's permission set and owner status
  SELECT ps.permissions, pm.is_owner
  INTO v_permissions, v_is_owner
  FROM planify_plan_members pm
  JOIN planify_permission_sets ps ON ps.id = pm.permission_set_id
  WHERE pm.plan_id = p_plan_id
  AND pm.profile_id = p_user_id
  AND pm.status = 'active';

  -- Not a member
  IF v_permissions IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Owner always has full access
  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Check direct permission
  IF p_permission = ANY(v_permissions) THEN
    RETURN TRUE;
  END IF;

  -- Check wildcard (e.g., "activity.*" matches "activity.create")
  IF (split_part(p_permission, '.', 1) || '.*') = ANY(v_permissions) THEN
    RETURN TRUE;
  END IF;

  -- Check full wildcard
  IF '*' = ANY(v_permissions) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user can manage permissions (owner or org admin role_id >= 3)
CREATE OR REPLACE FUNCTION can_manage_plan_permissions(
  p_plan_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_org_id UUID;
  v_is_owner BOOLEAN;
  v_org_role_id INTEGER;
BEGIN
  -- Check if plan owner
  SELECT pm.is_owner INTO v_is_owner
  FROM planify_plan_members pm
  WHERE pm.plan_id = p_plan_id
  AND pm.profile_id = p_user_id
  AND pm.status = 'active';

  IF v_is_owner THEN
    RETURN TRUE;
  END IF;

  -- Check if org admin (role_id >= 3)
  SELECT p.org_id INTO v_org_id
  FROM planify_plans p
  WHERE p.id = p_plan_id;

  SELECT ou.role_id INTO v_org_role_id
  FROM org_user ou
  WHERE ou.org_id = v_org_id
  AND ou.profile_id = p_user_id;

  IF v_org_role_id >= 3 THEN
    RETURN TRUE;
  END IF;

  -- Check via permission set
  RETURN has_plan_permission(p_plan_id, p_user_id, 'plan.manage_permissions');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PERMISSION SETS POLICIES
-- =====================================================

-- Everyone can read system permission sets
CREATE POLICY "Anyone can read system permission sets"
  ON planify_permission_sets FOR SELECT
  USING (is_system = TRUE);

-- Plan members can read permission sets for their plans
CREATE POLICY "Plan members can read plan permission sets"
  ON planify_permission_sets FOR SELECT
  USING (
    plan_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM planify_plan_members pm
      WHERE pm.plan_id = planify_permission_sets.plan_id
      AND pm.profile_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Org staff can read org-level permission sets
CREATE POLICY "Org staff can read org permission sets"
  ON planify_permission_sets FOR SELECT
  USING (
    org_id IS NOT NULL AND plan_id IS NULL AND
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_permission_sets.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Permission managers can create/update/delete custom permission sets
CREATE POLICY "Permission managers can manage custom sets"
  ON planify_permission_sets FOR ALL
  USING (
    is_system = FALSE AND
    (
      -- Plan-level: check plan permission management
      (plan_id IS NOT NULL AND can_manage_plan_permissions(plan_id, auth.uid()))
      OR
      -- Org-level: org admins (role_id >= 3)
      (org_id IS NOT NULL AND plan_id IS NULL AND EXISTS (
        SELECT 1 FROM org_user
        WHERE org_user.org_id = planify_permission_sets.org_id
        AND org_user.profile_id = auth.uid()
        AND org_user.role_id >= 3
      ))
    )
  );

-- =====================================================
-- PLANS POLICIES (Updated for granular permissions)
-- =====================================================

-- Plan members can read plans (need plan.view permission)
CREATE POLICY "Plan members can read plans"
  ON planify_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM planify_plan_members pm
      WHERE pm.plan_id = planify_plans.id
      AND pm.profile_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Users with plan.edit permission can update plans
CREATE POLICY "Users with plan.edit can update plans"
  ON planify_plans FOR UPDATE
  USING (has_plan_permission(id, auth.uid(), 'plan.edit'));

-- Staff can create plans in their org
CREATE POLICY "Staff can create plans"
  ON planify_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_plans.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Users with plan.delete permission can delete plans
CREATE POLICY "Users with plan.delete can delete plans"
  ON planify_plans FOR DELETE
  USING (has_plan_permission(id, auth.uid(), 'plan.delete'));

-- =====================================================
-- ACTIVITIES POLICIES (Updated for granular permissions)
-- =====================================================

-- Members can read activities they have permission to view
CREATE POLICY "Members can read activities"
  ON planify_activities FOR SELECT
  USING (
    has_plan_permission(plan_id, auth.uid(), 'activity.view_all')
    OR (
      has_plan_permission(plan_id, auth.uid(), 'activity.view_own')
      AND created_by = auth.uid()
    )
  );

-- Users with activity.create can insert
CREATE POLICY "Users with activity.create can insert"
  ON planify_activities FOR INSERT
  WITH CHECK (has_plan_permission(plan_id, auth.uid(), 'activity.create'));

-- Users can update activities based on edit_own or edit_all permission
CREATE POLICY "Users can update activities"
  ON planify_activities FOR UPDATE
  USING (
    has_plan_permission(plan_id, auth.uid(), 'activity.edit_all')
    OR (
      has_plan_permission(plan_id, auth.uid(), 'activity.edit_own')
      AND created_by = auth.uid()
    )
  );

-- Users can delete activities based on delete_own or delete_all permission
CREATE POLICY "Users can delete activities"
  ON planify_activities FOR DELETE
  USING (
    has_plan_permission(plan_id, auth.uid(), 'activity.delete_all')
    OR (
      has_plan_permission(plan_id, auth.uid(), 'activity.delete_own')
      AND created_by = auth.uid()
    )
  );

-- =====================================================
-- PLAN MEMBERS POLICIES
-- =====================================================

-- Members can read other members of plans they belong to
CREATE POLICY "Members can read plan members"
  ON planify_plan_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM planify_plan_members pm
      WHERE pm.plan_id = planify_plan_members.plan_id
      AND pm.profile_id = auth.uid()
      AND pm.status = 'active'
    )
  );

-- Users with plan.manage_members can manage members
CREATE POLICY "Permission holders can manage members"
  ON planify_plan_members FOR ALL
  USING (
    has_plan_permission(plan_id, auth.uid(), 'plan.manage_members')
    OR can_manage_plan_permissions(plan_id, auth.uid())
  );

-- =====================================================
-- SHARE LINKS POLICIES
-- =====================================================

-- Users with plan.manage_sharing can manage share links
CREATE POLICY "Permission holders can manage share links"
  ON planify_share_links FOR ALL
  USING (has_plan_permission(plan_id, auth.uid(), 'plan.manage_sharing'));

-- =====================================================
-- TEMPLATES POLICIES
-- =====================================================

-- Users with template.view can read templates
CREATE POLICY "Users can read templates"
  ON planify_templates FOR SELECT
  USING (
    is_system_template = TRUE
    OR EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_templates.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Users with template.create can insert
CREATE POLICY "Users can create templates"
  ON planify_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_templates.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Users can update/delete their own or all templates based on permissions
CREATE POLICY "Users can update templates"
  ON planify_templates FOR UPDATE
  USING (
    is_system_template = FALSE AND
    (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_templates.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 3
    ))
  );

CREATE POLICY "Users can delete templates"
  ON planify_templates FOR DELETE
  USING (
    is_system_template = FALSE AND
    (created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_templates.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 3
    ))
  );

-- =====================================================
-- STAFF AVAILABILITY POLICIES
-- =====================================================

-- Staff can manage own availability
CREATE POLICY "Staff can manage own availability"
  ON planify_staff_availability FOR ALL
  USING (profile_id = auth.uid());

-- Org staff can read team availability
CREATE POLICY "Org staff can read team availability"
  ON planify_staff_availability FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_staff_availability.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 1
    )
  );

-- Managers can edit team availability
CREATE POLICY "Managers can edit team availability"
  ON planify_staff_availability FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM org_user
      WHERE org_user.org_id = planify_staff_availability.org_id
      AND org_user.profile_id = auth.uid()
      AND org_user.role_id >= 3
    )
  );

-- =====================================================
-- REALTIME
-- =====================================================

-- Enable realtime for collaborative features
ALTER PUBLICATION supabase_realtime ADD TABLE planify_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE planify_activity_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE planify_staff_availability;

-- =====================================================
-- SEED DEFAULT CATEGORIES
-- =====================================================

INSERT INTO planify_categories (name, color, is_default, sort_order) VALUES
  ('Dans', '#F59E0B', TRUE, 1),
  ('Mat', '#F97316', TRUE, 2),
  ('Öppen Fritidsgård', '#10B981', TRUE, 3),
  ('Sport/Motion', '#14B8A6', TRUE, 4),
  ('Spel/e-sport', '#8B5CF6', TRUE, 5),
  ('Event', '#EC4899', TRUE, 6);

-- =====================================================
-- SEED SYSTEM DEFAULT PERMISSION SETS
-- =====================================================

-- Full Access: Complete control over the plan
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Full Access',
  'Full åtkomst',
  'Complete control over the plan (except ownership transfer)',
  TRUE,
  FALSE,
  ARRAY[
    'activity.create', 'activity.view_own', 'activity.view_all',
    'activity.edit_own', 'activity.edit_all', 'activity.delete_own',
    'activity.delete_all', 'activity.publish', 'activity.unpublish',
    'activity.duplicate',
    'plan.view', 'plan.edit', 'plan.manage_members',
    'plan.manage_sharing', 'plan.manage_permissions',
    'template.view', 'template.create', 'template.edit_own',
    'template.edit_all', 'template.delete_own', 'template.delete_all',
    'template.use',
    'schedule.view_own', 'schedule.view_team', 'schedule.edit_own',
    'schedule.edit_team', 'schedule.request_timeoff', 'schedule.approve_timeoff',
    'assignment.view', 'assignment.assign_self', 'assignment.assign_others',
    'assignment.remove_self', 'assignment.remove_others',
    'sync.view_status', 'sync.trigger', 'sync.resolve_conflicts'
  ],
  '{}'::JSONB
);

-- Manager: Can manage activities and members, publish to Noisify
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Manager',
  'Ansvarig',
  'Can manage activities and members, publish to Noisify',
  TRUE,
  FALSE,
  ARRAY[
    'activity.create', 'activity.view_all', 'activity.edit_all',
    'activity.delete_all', 'activity.publish', 'activity.unpublish',
    'activity.duplicate',
    'plan.view', 'plan.edit', 'plan.manage_members', 'plan.manage_sharing',
    'template.view', 'template.create', 'template.edit_own',
    'template.edit_all', 'template.delete_own', 'template.delete_all',
    'template.use',
    'schedule.view_own', 'schedule.view_team', 'schedule.edit_own',
    'schedule.approve_timeoff',
    'assignment.view', 'assignment.assign_self', 'assignment.assign_others',
    'assignment.remove_self', 'assignment.remove_others',
    'sync.view_status', 'sync.trigger', 'sync.resolve_conflicts'
  ],
  '{}'::JSONB
);

-- Contributor: Can create and edit own activities, view all
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Contributor',
  'Bidragsgivare',
  'Can create and edit own activities, view all',
  TRUE,
  FALSE,
  ARRAY[
    'activity.create', 'activity.view_all', 'activity.edit_own',
    'activity.delete_own', 'activity.duplicate',
    'plan.view',
    'template.view', 'template.create', 'template.edit_own',
    'template.delete_own', 'template.use',
    'schedule.view_own', 'schedule.view_team', 'schedule.edit_own',
    'schedule.request_timeoff',
    'assignment.view', 'assignment.assign_self', 'assignment.remove_self',
    'sync.view_status'
  ],
  '{}'::JSONB
);

-- Viewer: Read-only access to plan and activities
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Viewer',
  'Visare',
  'Read-only access to plan and activities',
  TRUE,
  FALSE,
  ARRAY[
    'activity.view_all',
    'plan.view',
    'template.view',
    'schedule.view_own',
    'assignment.view',
    'sync.view_status'
  ],
  '{}'::JSONB
);

-- Guest: Limited view access for external users (no sensitive data)
INSERT INTO planify_permission_sets (
  name, name_sv, description, is_system, is_guest, permissions, restrictions
) VALUES (
  'Guest',
  'Gäst',
  'Limited view access for external users (no sensitive data)',
  TRUE,
  TRUE,
  ARRAY[
    'activity.view_all',
    'plan.view'
  ],
  '{"hide_contact_info": true, "hide_internal_notes": true, "hide_assignments": true, "limited_ui": true}'::JSONB
);

-- =====================================================
-- ADDITIONAL HELPER FUNCTIONS
-- =====================================================

-- Function to get staff availability for date range
CREATE OR REPLACE FUNCTION get_staff_availability(
  p_org_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE (
  profile_id UUID,
  date DATE,
  is_available BOOLEAN,
  availability_type availability_type,
  notes TEXT
) AS $$
BEGIN
  -- Implementation for recurring and non-recurring availability
  -- Returns availability status for each staff member for each day in range
  RETURN QUERY
  SELECT
    sa.profile_id,
    d.date,
    sa.type = 'available' AS is_available,
    sa.type,
    sa.notes
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS d(date)
  CROSS JOIN (
    SELECT DISTINCT profile_id FROM planify_staff_availability WHERE org_id = p_org_id
  ) AS staff
  LEFT JOIN planify_staff_availability sa ON
    sa.profile_id = staff.profile_id
    AND sa.org_id = p_org_id
    AND d.date BETWEEN sa.start_date AND sa.end_date
    AND sa.status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's effective permissions for a plan
CREATE OR REPLACE FUNCTION get_user_plan_permissions(
  p_plan_id UUID,
  p_user_id UUID
) RETURNS TABLE (
  permission TEXT,
  is_owner BOOLEAN,
  restrictions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(ps.permissions) AS permission,
    pm.is_owner,
    ps.restrictions
  FROM planify_plan_members pm
  JOIN planify_permission_sets ps ON ps.id = pm.permission_set_id
  WHERE pm.plan_id = p_plan_id
  AND pm.profile_id = p_user_id
  AND pm.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### 10.2 File Structure (Updated)

```
/app/planify/
├── page.tsx                          # Plans listing
├── layout.tsx                        # Planify layout with header
├── actions.ts                        # Server actions for plans
├── [planId]/
│   ├── page.tsx                      # Plan detail (calendar default)
│   ├── actions.ts                    # Server actions for activities
│   ├── settings/
│   │   ├── page.tsx                  # Plan settings (general)
│   │   ├── members/
│   │   │   └── page.tsx              # Members management
│   │   ├── permissions/
│   │   │   └── page.tsx              # Permission sets management
│   │   └── sharing/
│   │       └── page.tsx              # Share links management
│   └── loading.tsx                   # Loading state
├── view/
│   └── [token]/
│       └── page.tsx                  # Guest view (public, no auth)
├── schedule/
│   └── page.tsx                      # Personal schedule view
├── team-schedule/
│   └── page.tsx                      # Team schedule view (managers)
└── templates/
    └── page.tsx                      # Template management

/components/planify/
├── planify-header.tsx                # Simple header with logo + user
├── plan-card.tsx                     # Plan card for listing
├── plan-form.tsx                     # Create/edit plan form
├── activity-calendar.tsx             # Weekly calendar view
├── activity-list.tsx                 # Table list view
├── activity-card.tsx                 # Activity card for calendar
├── activity-form.tsx                 # Create/edit activity form
├── activity-detail-panel.tsx         # Slide-over detail panel
├── category-badge.tsx                # Color-coded category badge
├── week-navigator.tsx                # Week navigation component
├── filter-panel.tsx                  # Filter dropdown/panel
├── stats-dashboard.tsx               # Statistics view
├── publish-button.tsx                # Publish to Noisify action
├── sync-status-badge.tsx             # Sync status indicator
├── presence-avatars.tsx              # Active users display
├── share-dialog.tsx                  # Share link management
├── member-list.tsx                   # Plan members management
├── member-invite-dialog.tsx          # Invite member dialog
├── permission-set-list.tsx           # Permission sets listing
├── permission-set-form.tsx           # Create/edit permission set
├── permission-picker.tsx             # Permission checkboxes UI
├── template-picker.tsx               # Template selection dialog
├── template-form.tsx                 # Create/edit template
├── staff-assignment.tsx              # Staff assignment UI
├── availability-calendar.tsx         # Availability management
├── availability-form.tsx             # Set availability form
├── time-off-request.tsx              # Time-off request form
├── team-schedule-grid.tsx            # Team schedule visualization
└── guest-view-layout.tsx             # Minimal layout for guests

/actions/planify/
├── plans.ts                          # Plan CRUD actions
├── activities.ts                     # Activity CRUD actions
├── categories.ts                     # Category management
├── publish.ts                        # Publish/sync to Noisify
├── members.ts                        # Plan membership management
├── permissions.ts                    # Permission set management
├── sharing.ts                        # Share link management
├── templates.ts                      # Template CRUD actions
├── availability.ts                   # Staff availability actions
├── assignments.ts                    # Activity assignment actions
└── sync.ts                           # Two-way sync logic

/lib/planify/
├── realtime.ts                       # Supabase Realtime setup
├── permissions.ts                    # Permission checking utilities
├── permission-constants.ts           # All permission keys as constants
├── sync-engine.ts                    # Sync logic between Planify/Noisify
└── availability-utils.ts             # Availability calculation helpers
```

### 10.3 API Routes / Server Actions (Updated)

```typescript
// /actions/planify/plans.ts
export async function getPlans(orgId: string): Promise<Plan[]>
export async function getPlan(planId: string): Promise<Plan>
export async function createPlan(data: CreatePlanInput): Promise<Plan>
export async function updatePlan(planId: string, data: UpdatePlanInput): Promise<Plan>
export async function deletePlan(planId: string): Promise<void>

// /actions/planify/permissions.ts
export async function getPermissionSets(planId: string): Promise<PermissionSet[]>
export async function getSystemPermissionSets(): Promise<PermissionSet[]>
export async function createPermissionSet(planId: string, data: CreatePermissionSetInput): Promise<PermissionSet>
export async function updatePermissionSet(setId: string, data: UpdatePermissionSetInput): Promise<PermissionSet>
export async function deletePermissionSet(setId: string): Promise<void>
export async function getUserPermissions(planId: string, userId: string): Promise<UserPermissions>
export async function checkPermission(planId: string, permission: string): Promise<boolean>
export async function canManagePermissions(planId: string): Promise<boolean>

// /actions/planify/members.ts
export async function getPlanMembers(planId: string): Promise<PlanMember[]>
export async function inviteMember(planId: string, data: InviteMemberInput): Promise<void>
export async function updateMemberPermissions(memberId: string, permissionSetId: string): Promise<void>
export async function removeMember(memberId: string): Promise<void>
export async function acceptInvitation(planId: string): Promise<void>

// /actions/planify/sharing.ts
export async function createShareLink(planId: string, options: ShareLinkOptions): Promise<ShareLink>
export async function getShareLinks(planId: string): Promise<ShareLink[]>
export async function revokeShareLink(linkId: string): Promise<void>
export async function validateShareToken(token: string): Promise<Plan | null>

// /actions/planify/activities.ts
export async function getActivities(planId: string, filters?: ActivityFilters): Promise<PlanActivity[]>
export async function getActivitiesByWeek(planId: string, weekNumber: number, year: number): Promise<PlanActivity[]>
export async function getActivity(activityId: string): Promise<PlanActivity>
export async function createActivity(data: CreateActivityInput): Promise<PlanActivity>
export async function createActivityFromTemplate(templateId: string, data: Partial<CreateActivityInput>): Promise<PlanActivity>
export async function updateActivity(activityId: string, data: UpdateActivityInput): Promise<PlanActivity>
export async function deleteActivity(activityId: string): Promise<void>
export async function duplicateActivity(activityId: string): Promise<PlanActivity>

// /actions/planify/assignments.ts
export async function assignStaff(activityId: string, profileId: string, role: AssignmentRole): Promise<void>
export async function unassignStaff(activityId: string, profileId: string): Promise<void>
export async function updateAssignment(assignmentId: string, data: UpdateAssignmentInput): Promise<void>
export async function getAvailableStaff(activityId: string): Promise<StaffWithAvailability[]>

// /actions/planify/templates.ts
export async function getTemplates(orgId: string): Promise<ActivityTemplate[]>
export async function getTemplate(templateId: string): Promise<ActivityTemplate>
export async function createTemplate(data: CreateTemplateInput): Promise<ActivityTemplate>
export async function createTemplateFromActivity(activityId: string, name: string): Promise<ActivityTemplate>
export async function updateTemplate(templateId: string, data: UpdateTemplateInput): Promise<ActivityTemplate>
export async function deleteTemplate(templateId: string): Promise<void>

// /actions/planify/availability.ts
export async function getMyAvailability(orgId: string): Promise<StaffAvailability[]>
export async function getTeamAvailability(orgId: string, dateRange: DateRange): Promise<TeamAvailability[]>
export async function setAvailability(data: SetAvailabilityInput): Promise<StaffAvailability>
export async function requestTimeOff(data: TimeOffRequestInput): Promise<StaffAvailability>
export async function approveTimeOff(availabilityId: string): Promise<void>
export async function rejectTimeOff(availabilityId: string, reason?: string): Promise<void>
export async function deleteAvailability(availabilityId: string): Promise<void>

// /actions/planify/sync.ts
export async function publishToNoisify(activityId: string): Promise<{ noisifyActivityId: string }>
export async function unpublishFromNoisify(activityId: string): Promise<void>
export async function syncActivity(activityId: string, direction: 'to_noisify' | 'from_noisify'): Promise<void>
export async function resolveConflict(activityId: string, resolution: 'keep_planify' | 'keep_noisify'): Promise<void>
export async function getSyncStatus(activityId: string): Promise<SyncStatus>
```

---

## 11. Implementation Phases (Updated)

### Phase 1: Foundation

**Goal:** Basic plan management with permissions

**Features:**
- [ ] Planify route structure and layout
- [ ] App switcher navigation
- [ ] Plans listing page with cards
- [ ] Create/edit plan form
- [ ] Plan deletion (owner only)
- [ ] Basic plan membership (owner created automatically)

**Database:**
- [ ] `planify_plans` table
- [ ] `planify_plan_members` table
- [ ] Basic RLS policies

### Phase 2: Activity Management

**Goal:** Create and manage activities within plans

**Features:**
- [ ] Activity list view (table)
- [ ] Create activity form
- [ ] Edit activity form
- [ ] Delete activity
- [ ] Activity detail panel
- [ ] Duplicate activity
- [ ] Categories (default + custom)

**Database:**
- [ ] `planify_activities` table
- [ ] `planify_categories` table

### Phase 3: Calendar View & Real-Time

**Goal:** Visual calendar with live collaboration

**Features:**
- [ ] Weekly calendar component
- [ ] Week navigation
- [ ] Activity cards in calendar
- [ ] Supabase Realtime integration
- [ ] Presence indicators
- [ ] Live activity updates

### Phase 4: Permissions & Sharing

**Goal:** Full permission system and guest access

**Features:**
- [ ] Plan member management UI
- [ ] Invite members by email
- [ ] Role management (owner/admin/editor/viewer)
- [ ] Share link generation
- [ ] Guest view page (public route)
- [ ] Password-protected links (optional)

**Database:**
- [ ] `planify_share_links` table
- [ ] Updated RLS policies

### Phase 5: Publishing & Two-Way Sync

**Goal:** Bidirectional sync with Noisify

**Features:**
- [ ] Publish activity to Noisify
- [ ] Sync status indicators
- [ ] Noisify → Planify sync (webhook/trigger)
- [ ] Conflict detection and resolution
- [ ] Sync audit log
- [ ] Bulk publish

**Database:**
- [ ] `planify_sync_log` table
- [ ] Sync triggers/functions

### Phase 6: Templates

**Goal:** Activity templates for reuse

**Features:**
- [ ] Template library page
- [ ] Create template from activity
- [ ] Create activity from template
- [ ] Default system templates
- [ ] Template management (edit/delete)

**Database:**
- [ ] `planify_templates` table

### Phase 7: Staff Scheduler

**Goal:** Staff availability and assignment management

**Features:**
- [ ] Personal schedule view
- [ ] Set availability (recurring/one-time)
- [ ] Time-off requests
- [ ] Time-off approval workflow
- [ ] Activity staff assignment
- [ ] Availability conflict warnings
- [ ] Team schedule view (managers)

**Database:**
- [ ] `planify_staff_availability` table
- [ ] `planify_activity_assignments` table

### Phase 8: Statistics & Polish

**Goal:** Insights and final polish

**Features:**
- [ ] Statistics dashboard
- [ ] Staff workload charts
- [ ] Template usage analytics
- [ ] Export functionality
- [ ] Responsive mobile views
- [ ] Performance optimization
- [ ] Guest view analytics

---

## 12. Dependencies

### 12.1 Existing Dependencies (Available)

- **react-big-calendar** (1.19.4) - Calendar component base
- **date-fns** - Date manipulation
- **Radix UI** - UI primitives
- **TipTap** - Rich text editor
- **Framer Motion** - Animations
- **Supabase** - Database, Auth & Realtime

### 12.2 Potential New Dependencies

- **rrule** - For recurring availability parsing (if not using existing)
- **Chart.js** or **Recharts** - For statistics visualizations (optional)

---

## 13. Security Considerations

### 13.1 Authorization

- All Planify data scoped via RLS policies
- Plan access controlled by membership table
- Role-based permissions for all operations
- Guest access via secure tokens (UUID + validation)

### 13.2 Guest Access Security

- Share tokens are cryptographically random UUIDs
- Optional expiration dates
- Optional password protection (hashed)
- Access logging for audit
- Rate limiting on token validation
- No PII exposed in guest view (configurable)

### 13.3 Data Validation

- Server-side validation for all inputs
- Sanitize rich text content
- Validate date ranges (end >= start)
- Validate file uploads (images only, size limits)
- Permission checks on all mutations

---

## 14. Accessibility

- Keyboard navigation for calendar and list views
- ARIA labels for interactive elements
- Color contrast compliance for category badges
- Screen reader support for activity details
- Focus management in modal/panel interactions
- Presence indicators have text alternatives

---

## 15. Localization

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
| Synkad | Synced |
| Konflikt | Conflict |
| Duplicera | Duplicate |
| Spara som mall | Save as template |
| Från mall | From template |
| Målgrupp | Target group |
| Arrangör | Organizer |
| Kontaktperson | Contact person |
| Ansvarig | Responsible |
| Dela | Share |
| Bjud in | Invite |
| Ägare | Owner |
| Administratör | Admin |
| Redigerare | Editor |
| Visare | Viewer |
| Gäst | Guest |
| Tillgänglighet | Availability |
| Ledighet | Time off |
| Semester | Vacation |
| Sjuk | Sick |
| Begär ledighet | Request time off |
| Godkänd | Approved |
| Väntar | Pending |
| Avvisad | Rejected |
| Personalschema | Staff schedule |
| Mitt schema | My schedule |

---

## 16. Appendix

### A. Prototype Screenshots Reference

1. **Image 1:** App switcher dropdown showing Noisify and Planify options
2. **Image 2:** Plans listing page with "Sommar i Backa 2024" plan card
3. **Image 3 & 5:** Calendar view with activity detail panel
4. **Image 4:** List view with table format and all columns

### B. Related Documents

- Noisify Activity Management Specifications
- Noisify Database Schema
- Supabase RLS Policies Documentation
- Supabase Realtime Documentation

### C. Glossary

| Term | Definition |
|------|------------|
| Plan | A collection of activities organized around a theme or time period |
| Activity | A single event or activity within a plan |
| Kalendarium | Calendar status - whether published to Noisify |
| Arrangör | Organizer - the entity hosting the activity |
| Målgrupp | Target group - intended audience (Barn, Ungdom, etc.) |
| Område | Area - geographical area or district |
| Template | Reusable activity configuration |
| Share Link | URL token for guest access |
| Sync | Bidirectional data synchronization between Planify and Noisify |
| Availability | Staff working hours and time-off schedules |
| Assignment | Staff member allocated to work an activity |
