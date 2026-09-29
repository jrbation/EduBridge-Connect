# EduBridge Connect

EduBridge Connect is a modern, unified educational management and collaboration platform designed to bridge communication, learning, and administrative workflows between students, teachers, parents/guardians, and school administrators. Built with Next.js App Router, TypeScript, Tailwind CSS, and Supabase, EduBridge Connect provides role-based access control, real-time updates, and data security powered by PostgreSQL Row Level Security (RLS).

---

## Features

### 🎓 Students
- **Course & Lesson Access:** View enrolled courses, learning modules, lessons, and downloadable curriculum resources.
- **Assignments & Quizzes:** Track upcoming assignments, submit work, view grades, and complete interactive quizzes with instant scoring.
- **Progress Tracking:** Monitor academic performance, course completion rates, and historical grade trends.
- **Communication & Calendar:** Direct messaging with teachers, view school schedules and live class sessions, and receive real-time notifications.

### 👩‍🏫 Teachers
- **Classroom Management:** Manage classes, student rosters, and attendance records (present, absent, late, excused).
- **Curriculum & Content:** Create and organize courses, publish lessons, upload resources, and author quizzes.
- **Grading & Submissions:** Review submitted student assignments, assign scores, record feedback, and track submission statuses.
- **Communication & Announcements:** Broadcast class-wide or school-wide announcements, schedule live sessions, and message students and parents.

### 👨‍👩‍👧 Parents & Guardians
- **Child Progress Monitoring:** View academic progress, grades, assignments, and attendance logs for linked children.
- **Schedule & Calendar:** Keep track of class timetables, upcoming exams, assignment deadlines, and school events.
- **Tuition & Payments:** View payment invoices, fee structures, and billing transaction history.
- **Direct Engagement:** Communicate directly with teachers and receive school announcements and alert notifications.

### 🛡️ Administrators
- **User & Role Management:** Manage directory records for students, teachers, parents, and administrative staff with role-based permissions.
- **School & Class Administration:** Configure academic terms, departments, classrooms, course catalogs, and class allocations.
- **Financial Overview:** Track tuition payments, transaction statuses, and billing summaries across the institution.
- **Audit Logs & Platform Settings:** Review system security audit trails and configure institution-wide platform settings.

---

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (v15 App Router with Turbopack)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict type-checking)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with `tailwindcss-animate`
- **UI Components:** [Radix UI](https://www.radix-ui.com/) primitives (Dialog, Dropdown Menu, Popover, Select, Tabs, Tooltip, Avatar, Progress, Switch, Scroll Area)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Form Handling & Validation:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) & `@hookform/resolvers`
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Row Level Security)
- **Client & Server Integration:** `@supabase/supabase-js`, `@supabase/ssr`
- **Testing:** [Vitest](https://vitest.dev/) with `@testing-library/react` and `jsdom`
- **Notifications & Feedback:** [Sonner](https://sonner.emilkowal.ski/) toast notifications
- **Theme Support:** `next-themes` (Dark / Light mode support)

---

## Project Structure

```text
EduBridge Connect/
├── .cursor/                # Editor workspace configuration
├── .env.example            # Template for environment variables (safe to commit)
├── .gitignore              # Git ignore rules for Next.js, Supabase, and build artifacts
├── eslint.config.mjs       # ESLint configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Project dependencies and npm scripts
├── postcss.config.mjs      # PostCSS configuration
├── scripts/                # Database seeding and utility scripts
│   ├── seed.ts             # Demo account provisioning script
│   └── test_rls.js         # Row Level Security verification test script
├── src/
│   ├── actions/            # Next.js Server Actions (e.g., auth, password resets)
│   ├── app/                # Next.js App Router routes
│   │   ├── (app)/          # Protected portal routes grouped by role
│   │   │   ├── admin/      # Administrator portal routes
│   │   │   ├── parent/     # Parent / Guardian portal routes
│   │   │   ├── student/    # Student portal routes
│   │   │   └── teacher/    # Teacher portal routes
│   │   ├── auth/           # Auth callbacks and handlers
│   │   ├── login/          # User login page
│   │   ├── signup/         # Account registration page
│   │   ├── forgot-password/# Password recovery request
│   │   └── reset-password/ # Password reset handler
│   ├── components/         # Reusable React components
│   │   ├── charts/         # Dashboard analytics charts (Recharts)
│   │   ├── forms/          # Form components and input fields
│   │   ├── layout/         # Navigation, header, sidebar, and app shells
│   │   ├── pages/          # Modular view components
│   │   ├── shared/         # Shared UI cards, filters, and tables
│   │   └── ui/             # Radix-based UI components
│   ├── lib/                # Utility functions, validation schemas, and database clients
│   │   ├── auth/           # Navigation config, role helpers, and session validation
│   │   ├── data/           # Query abstractions and data mappers
│   │   ├── supabase/       # Supabase browser, server, admin, and middleware clients
│   │   ├── utils.ts        # Common helper utilities (cn, formatting)
│   │   └── validations/    # Zod schema definitions
│   ├── middleware.ts       # Route protection and role-based redirect middleware
│   ├── test/               # Vitest unit and validation test suites
│   └── types/              # TypeScript database types and application interfaces
├── supabase/
│   ├── full_schema.sql     # Full database schema reference
│   └── migrations/         # Supabase SQL migration files
│       ├── 20240928000001_init.sql
│       └── 20240928000002_qa_fixes.sql
├── tailwind.config.ts      # Tailwind CSS design system configuration
├── tsconfig.json           # TypeScript configuration
└── vitest.config.ts        # Vitest test configuration
```

---

## Getting Started

Follow these steps to set up and run EduBridge Connect locally:

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) or another compatible package manager
- A [Supabase](https://supabase.com/) project (hosted or local instance)

### 2. Clone the Repository
```bash
git clone https://github.com/jrbation/EduBridge-Connect.git
cd EduBridge-Connect
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials in `.env.local` (see [Environment Variables](#environment-variables)).

### 5. Configure Database & Seed Data
1. Apply the SQL migrations located in `supabase/migrations/` to your Supabase PostgreSQL database via the Supabase Dashboard SQL Editor or Supabase CLI.
2. (Optional) Seed demo user accounts using the seed script:
```bash
npm run seed
```

### 6. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Environment Variables

EduBridge Connect requires the following environment variables defined in `.env.local`:

| Variable | Description | Exposure |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyzcompany.supabase.co`) | Public (Client & Server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon / public API key | Public (Client & Server) |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role secret key (used for administrative seed & server tasks) | **Private (Server-only)** |
| `NEXT_PUBLIC_APP_URL` | Application root URL for auth redirect URLs (e.g., `http://localhost:3000`) | Public (Client & Server) |

> **Warning:** Never expose or commit `SUPABASE_SERVICE_ROLE_KEY` or real credentials to Git. Always keep them in `.env.local` which is ignored by `.gitignore`.

---

## Database

EduBridge Connect relies on PostgreSQL hosted by Supabase with Row Level Security (RLS) enabled on all tables:

- **Migrations:** Located in `supabase/migrations/`
  - `20240928000001_init.sql`: Core schema, relations, constraints, triggers, and comprehensive RLS policies.
  - `20240928000002_qa_fixes.sql`: Security patches and query optimizations.
- **Full Schema Reference:** `supabase/full_schema.sql` contains the complete cumulative schema definition.
- **Seeding:** `npm run seed` executes `scripts/seed.ts` via `tsx` to create demo user accounts for testing each role (`student`, `teacher`, `parent`, `admin`).
- **RLS Verification:** `node scripts/test_rls.js` runs automated policy access checks across multiple roles to guarantee isolation.

---

## Development

The following npm scripts are defined in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the development server with Turbopack (`next dev --turbopack`) |
| `npm run build` | Build the optimized production application (`next build`) |
| `npm run start` | Start the production server after building (`next start`) |
| `npm run lint` | Run ESLint to analyze code quality and enforce standards (`next lint`) |
| `npm run typecheck` | Run TypeScript compiler without emitting files (`tsc --noEmit`) |
| `npm run test` | Run the automated test suite once (`vitest run`) |
| `npm run test:watch` | Run the test suite in interactive watch mode (`vitest`) |
| `npm run seed` | Seed database with initial demo accounts (`tsx scripts/seed.ts`) |

---

## Security

Security is foundational to EduBridge Connect:
- **Zero Secrets in Repository:** All sensitive credentials, service-role keys, and tokens are kept strictly in environment variables and are excluded via `.gitignore`.
- **Row Level Security (RLS):** Data access is enforced directly at the PostgreSQL layer based on authenticated Supabase JWT identities and roles.
- **Role Verification:** Route access is protected via Next.js middleware and server-side role validation to prevent privilege escalation.

---

## License

No license has been selected yet. A license should be added before public distribution.
