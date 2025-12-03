# Design System & UI Guidelines

## Overview
Noisify uses a modern, clean, and accessible design system built on **Tailwind CSS v4** and **Shadcn UI**. The design language prioritizes clarity, youthfulness, and ease of use, featuring a vibrant color palette anchored by Indigo and Slate.

## Color Palette

### Primary Brand Colors
The primary brand color is **Indigo**, representing creativity, trust, and energy. It is used for primary actions, active states, and key brand elements.

| Role | Tailwind Class | Hex Value | Usage |
|------|----------------|-----------|-------|
| **Primary** | `bg-indigo-600` | `#4f46e5` | Primary buttons, active links, brand accents |
| **Hover** | `bg-indigo-700` | `#4338ca` | Hover states for primary elements |
| **Light** | `bg-indigo-50` | `#eef2ff` | Backgrounds for active items, badges |
| **Border** | `border-indigo-100` | `#e0e7ff` | Subtle borders on branded elements |

### Secondary & Accent Colors
**Violet** and **Purple** are used as accent colors, often in gradients with Indigo to create a dynamic and modern look.

| Role | Tailwind Class | Hex Value | Usage |
|------|----------------|-----------|-------|
| **Accent** | `text-violet-600` | `#7c3aed` | Gradients, decorative text |
| **Decorative** | `bg-purple-200` | `#e9d5ff` | Decorative blobs, illustrations |

### Neutral Colors (Slate)
We use the **Slate** scale for text, borders, and neutral backgrounds to ensure high contrast and readability.

| Role | Tailwind Class | Hex Value | Usage |
|------|----------------|-----------|-------|
| **Heading Text** | `text-slate-900` | `#0f172a` | Main headings, strong text |
| **Body Text** | `text-slate-600` | `#475569` | Paragraphs, secondary text |
| **Muted Text** | `text-slate-400` | `#94a3b8` | Placeholders, disabled text, icons |
| **Borders** | `border-slate-200` | `#e2e8f0` | Card borders, dividers |
| **Background** | `bg-slate-50` | `#f8fafc` | Page backgrounds, section backgrounds |
| **Surface** | `bg-white` | `#ffffff` | Card backgrounds, modals |

### Semantic Colors (Functional)
These colors are used to convey meaning and status.

| Role | Color Family | Usage |
|------|--------------|-------|
| **Success** | Green | Confirmation messages, success states |
| **Warning** | Amber | Alerts, warnings, "attention needed" |
| **Error** | Rose/Red | Destructive actions, error messages |
| **Info** | Blue | Informational alerts |

## Typography
The project uses the **Geist** font family (Sans and Mono) via `next/font/google`.

- **Font Family**: `var(--font-geist-sans)` (Sans-serif default)
- **Monospace**: `var(--font-geist-mono)` (Code, technical data)

### Type Scale
- **H1**: `text-5xl md:text-7xl font-extrabold` (Hero headings)
- **H2**: `text-3xl md:text-4xl font-bold` (Section headings)
- **H3**: `text-2xl font-bold` (Card titles)
- **Body**: `text-base` or `text-lg` (Standard readability)
- **Small**: `text-sm font-medium` (Labels, metadata)

## UI Components & Radius
The design features a soft, friendly aesthetic with rounded corners.

- **Buttons**: `rounded-full` (Pill shape) for primary calls to action.
- **Cards**: `rounded-xl` or `rounded-2xl` for content containers.
- **Inputs**: `rounded-xl` or `rounded-md`.

## CSS Variables (Shadcn UI)
The application uses CSS variables for theming Shadcn UI components. These should map to our Tailwind palette:

```css
:root {
  --background: 0 0% 100%; /* White */
  --foreground: 240 10% 3.9%; /* Slate 950 approx */
  
  --primary: 243.4 75.4% 58.6%; /* Indigo 600 */
  --primary-foreground: 210 40% 98%; /* White/Slate 50 */
  
  --secondary: 210 40% 96.1%; /* Slate 100 */
  --secondary-foreground: 222.2 47.4% 11.2%; /* Slate 900 */
  
  --muted: 210 40% 96.1%; /* Slate 100 */
  --muted-foreground: 215.4 16.3% 46.9%; /* Slate 500 */
  
  --accent: 210 40% 96.1%; /* Slate 100 */
  --accent-foreground: 222.2 47.4% 11.2%; /* Slate 900 */
  
  --destructive: 0 84.2% 60.2%; /* Red 500 */
  --destructive-foreground: 210 40% 98%;
  
  --border: 214.3 31.8% 91.4%; /* Slate 200 */
  --input: 214.3 31.8% 91.4%; /* Slate 200 */
  --ring: 243.4 75.4% 58.6%; /* Indigo 600 */
  
  --radius: 0.5rem;
}
```

*Note: If these variables are missing in `globals.css`, Shadcn components may not reflect the brand colors correctly.*
