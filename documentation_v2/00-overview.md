# Project Overview

## 1. Introduction
Noisify is a comprehensive multi-tenant SaaS platform for managing Swedish youth recreation centers (fritidsgårdar). It serves teenagers, providing activity registration, course management, membership tracking, room booking, and media management.

### Core Value Proposition
- **Streamlined Management**: Efficient activity registration and member tracking.
- **Real-time Availability**: Live updates on capacity and conflict prevention.
- **Mobile-First**: Designed for Gen Z users with a responsive interface.
- **GDPR Compliant**: Secure data handling with strict privacy controls.
- **Multi-Organization**: Support for multiple centers with isolated data.
- **Mobile-First**: Designed for Gen Z users with a responsive interface.

### Target Users
1. **Youth Participants (Members)**: Discover activities, manage memberships, track registrations.
2. **Organization Staff**: Create activities, manage registrations, invite participants.
3. **System Administrators**: Manage organizations, system settings, and platform health.

## 2. Technical Architecture

### Technology Stack
- **Backend**: Supabase (PostgreSQL 14+, Auth, Storage, Realtime).
- **Frontend**: Next.js (React), Tailwind CSS, Chakra UI.
- **Language**: TypeScript, 100% Swedish interface.
- **Deployment**: Vercel.

### Authentication & Authorization
Authentication is handled via Supabase Auth (Email/Password, Magic Links).

#### User Roles
| Role ID | Role Name | Description |
| :--- | :--- | :--- |
| **0** | Member | Standard youth user (View only). |
| **1** | Vikarie | Temporary worker with limited access. |
| **2** | Staff | Standard staff permissions (Create activities, manage members). |
| **3** | Unit Manager | Coordinators and business developers. |
| **4** | Org Admin | Organization administrator (Manage org settings). |
| **5** | System Developer | Super Admin / IT Personnel. |

### Security
- **Row Level Security (RLS)**: Enforced on all tables to ensure data isolation between organizations.
- **Policies**: Scoped to `authenticated` users, with specific checks for organization membership and roles.

## 3. Key Success Metrics
- User engagement (registrations per user).
- Registration completion rate.
- Staff efficiency (time to manage activities).
- System uptime and performance.
