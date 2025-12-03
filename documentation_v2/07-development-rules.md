---
trigger: always_on
---

# Development Rules & Guidelines

## 1. Tech Stack & Environment
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + Shadcn/UI
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **State**: React Server Components (RSC) + Server Actions

## 2. Design & UI/UX
- **Aesthetics**:
  - **Premium Feel**: Use vibrant colors, glassmorphism, and modern layouts. Avoid generic/MVP designs.
  - **Typography**: Use **Inter** or **Outfit** (Google Fonts). Avoid browser defaults.
  - **Icons**: Use **Lucide React** for consistent iconography.
- **Interactivity**:
  - **Animations**: Use `framer-motion` or CSS transitions for hover effects, page transitions, and micro-interactions.
  - **Feedback**: Provide immediate visual feedback for all actions (loading states, toast notifications).
- **Responsiveness**:
  - **Mobile-First**: Ensure all views work perfectly on mobile devices.
  - **Tailwind**: Use standard Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).

## 3. Coding Standards

### General
- **Language**: 
  - **Code/Comments**: English 🇬🇧
  - **UI/Content**: Swedish 🇸🇪 (sv-SE)
- **No Placeholders**: Do not leave `TODO`, `FIXME`, or empty blocks. Implement fully or not at all.
- **Clean Code**: Remove unused imports, variables, and console logs before committing.

### Components
- Use **Functional Components** with named exports.
- Prefer **Server Components** by default. Use `'use client'` only when necessary (interactivity, hooks).
- Props interface should be named `[ComponentName]Props`.

### Database & Supabase
- **RLS**: Row Level Security must be enabled on all tables.
- **Types**: Use generated Supabase types (`Database` interface).
- **RPC**: Use Database Functions (RPC) for complex logic (e.g., registration validation, booking conflicts).

## 4. Workflow & Git
- **Commits**: Use conventional commits (e.g., `feat: add activity wizard`, `fix: registration bug`).
- **Branches**: `feature/[name]`, `fix/[name]`, `chore/[name]`.
- **Docs**: Update documentation (`documentation_v2`) when features change.
- **Changelog**: Update `documentation_v2/05-project-status.md` with significant changes.

## 5. Project Specifics
- **Port**: Check local server port (default 3000, but may vary).
- **Progress**: When communicating with the user, estimate progress percentage (e.g., "40% complete").
- **Documentation Path**: All active documentation is in `documentation_v2`.

## 6. Testing
- **End-to-End**: Playwright for critical flows (Auth, Registration, Onboarding).
- **Manual**: Verify UI responsiveness on mobile and desktop.