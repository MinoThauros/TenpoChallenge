# Tenpo UI Kit

> **LICENSE NOTICE:** This UI kit is the proprietary property of Tenpo, Inc. It is provided solely for use during the authorized hackathon event. You may not copy, distribute, sublicense, publish, or use any part of this code, design system, or design tokens in any other project, product, or context — personal, commercial, or otherwise. Unauthorized use will be pursued to the fullest extent of the law.

A component library built with **Next.js 16**, **Radix UI**, **Tailwind CSS 4**, and **React 19**.

## Quick Start

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page, or go to [/ds](http://localhost:3000/ds) to explore the design system showcase.

## Using Components

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

## Components

| Category | Components |
|---|---|
| **Actions** | Button, TextArrowButton |
| **Forms** | Input, Textarea, Select, Checkbox, RadioGroup, Switch, Slider, PhoneInput, PasswordInput, SearchInput, DatePicker, DateRangePicker, TimePicker, Form (react-hook-form + zod) |
| **Data Display** | Card, Table, Badge, Avatar, Accordion, Progress, Separator, Skeleton, Calendar |
| **Overlays** | Dialog, AlertDialog, Sheet, Popover, Tooltip, Command, DropdownMenu |
| **Feedback** | Alert, Sonner (toasts), ConfettiCelebration |
| **Navigation** | Breadcrumb, Pagination, Tabs |

## Project Structure

```
src/
├── app/
│   ├── globals.css        # Design tokens & base styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── ds/                # Design system showcase
├── components/
│   ├── ui/                # All UI components
│   └── icons/             # Status icons (warning, success, error, info, loading)
├── lib/
│   ├── utils.ts           # cn() helper (clsx + tailwind-merge)
│   └── date.ts            # Date formatting utilities
└── fonts/                 # Host Grotesk & Seriously Nostalgic typefaces
```

## Design Tokens

Defined in `src/app/globals.css` using Tailwind 4's `@theme`:

- **Colors** — primary, secondary, tertiary, destructive, muted, status variants, brand aliases
- **Typography** — h1–h6, subtitle, body, caption, overline, display and nostalgic font families
- **Border Radius** — sm through full
- **Chart Colors** — 5-color palette

## Key Dependencies

- [Radix UI](https://www.radix-ui.com/) — accessible primitives
- [Tailwind CSS 4](https://tailwindcss.com/) — utility-first CSS
- [Lucide React](https://lucide.dev/) — icons
- [react-hook-form](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) — form validation
- [date-fns](https://date-fns.org/) + [react-day-picker](https://react-day-picker.js.org/) — date handling
- [Sonner](https://sonner.emilkowal.dev/) — toast notifications
