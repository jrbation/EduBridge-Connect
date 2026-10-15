# EduBridge Connect

A unified educational management platform that connects students, teachers, parents, and school administrators. Built with Next.js, TypeScript, Tailwind CSS, and Supabase, EduBridge Connect provides role-based access control, real-time collaboration tools, and secure data management through PostgreSQL Row Level Security.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)
- [Authentication & Security](#authentication--security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

EduBridge Connect is designed to streamline educational workflows by providing:

- **Role-based portals** for students, teachers, parents, and administrators
- **Academic management** including courses, lessons, assignments, and quizzes
- **Communication tools** with messaging, announcements, and notifications
- **Administrative controls** for user management, attendance, payments, and auditing
- **Parent-student connections** with an approval workflow for data access

The platform uses Supabase for authentication, database, and real-time features, with Next.js App Router for server-side rendering and React Server Actions for form handling.

## Key Features

### Student Portal
- View enrolled courses and learning materials
- Submit assignments and complete quizzes
- Track academic progress and grades
- Access schedules and live class sessions
- Message teachers and receive notifications

### Teacher Portal
- Manage classes and student rosters
- Create courses, lessons, and resources
- Grade assignments and provide feedback
- Record attendance (present, absent, late, excused)
- Author quizzes with multiple question types
- Broadcast announcements to students

### Parent Portal
- Link to student accounts via connection codes (with approval workflow)
- Monitor children's grades, assignments, and attendance
- View payment invoices and transaction history
- Communicate with teachers
- Access school schedules and announcements

### Administrator Portal
- Manage users across all roles (students, teachers, parents, admins)
- Configure schools, classes, and course catalogs
- Review audit logs and platform settings
- Monitor payment transactions
- View institution-wide reports

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router and Turbopack
- **React 19** - UI library
- **TypeScript** - Type-safe development with strict mode
- **Tailwind CSS** - Utility-first styling with custom design system
- **Radix UI** - Accessible component primitives (Dialog, Dropdown, Tabs, Avatar, etc.)
- **Lucide React** - Icon library
- **Recharts** - Data visualization and charts
- **next-themes** - Dark/light mode support

### Backend & Database
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication (email/password, password reset)
  - Real-time subscriptions
- **Next.js Server Actions** - Server-side form handling
- **@supabase/ssr** - Server-side Supabase client integration

### Form Handling & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Zod integration with React Hook Form

### Testing
- **Vitest** - Unit and integration testing
- **@testing-library/react** - React component testing
- **jsdom** - DOM environment for tests

### Development Tools
- **ESLint** - Code linting with Next.js config
- **PostCSS** - CSS processing
- **tsx** - TypeScript execution for scripts

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│                    (Next.js Client Components)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Server                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  App Router                                                │  │
│  │  ├── Role-based routes (/student, /teacher, /parent, /admin)│  │
│  │  ├── Server Actions (auth, academic, account)            │  │
│  │  └── Middleware (route protection, session validation)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Supabase Client (Browser/Server/Admin)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Supabase Platform                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                                     │  │
│  │  ├── 29 tables (schools, profiles, students, etc.)      │  │
│  │  ├── Row Level Security (RLS) policies                  │  │
│  │  └── Triggers & constraints                              │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  Authentication                                           │  │
│  │  ├── Email/password authentication                       │  │
│  │  ├── Password reset flows                                 │  │
│  │  └── JWT-based session management                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication**: Users sign in via Supabase Auth; middleware validates sessions and roles
2. **Route Protection**: Next.js middleware enforces role-based access to portal routes
3. **Data Access**: Server Actions and server components use Supabase client with RLS policies
4. **Real-time Updates**: Supabase subscriptions enable live notifications and messaging
5. **Form Validation**: Zod schemas validate inputs before database operations

## Prerequisites

- **Node.js** v20 or higher
- **npm** (or compatible package manager)
- **Supabase project** (hosted at supabase.com or local instance)
- **Git** (for cloning the repository)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/jrbation/EduBridge-Connect.git
cd EduBridge-Connect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials (see [Environment Variables](#environment-variables)).

### 4. Set Up the Database

Apply the SQL migrations to your Supabase project:

1. Open your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run each migration file in order from `supabase/migrations/`:
   - `20240928000001_init.sql` - Core schema, tables, and RLS policies
   - `20240928000002_qa_fixes.sql` - Security patches and optimizations
   - `20250106000001_parent_approval.sql` - Parent-student approval workflow

Alternatively, use the Supabase CLI:

```bash
supabase db push
```

### 5. Seed Demo Accounts (Optional)

To create demo user accounts for testing:

```bash
npm run seed
```

This creates four accounts with password `EduBridge123!`:
- `student@edubridge.test` (Student)
- `parent@edubridge.test` (Parent)
- `teacher@edubridge.test` (Teacher)
- `admin@edubridge.test` (Administrator)

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The following environment variables are required in `.env.local`:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xyzcompany.supabase.co`) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin operations and seeding) | Yes |
| `NEXT_PUBLIC_APP_URL` | Application root URL for auth redirects (e.g., `http://localhost:3000`) | Yes |

> **⚠️ Security Warning**: Never commit `.env.local` or any file containing real credentials to Git. The `.gitignore` file is configured to exclude environment files. The `SUPABASE_SERVICE_ROLE_KEY` should only be used server-side and never exposed to the client.

## Database Setup

### Schema Overview

The database consists of 29 tables organized into the following domains:

**Core Entities:**
- `schools` - Institution records
- `profiles` - User profiles linked to Supabase Auth
- `students`, `parents`, `teachers` - Role-specific profile extensions
- `parent_student_relationships` - Parent-child links with approval workflow

**Academic Structure:**
- `classes` - Classroom entities
- `class_students` - Student enrollment in classes
- `courses` - Course catalog
- `lessons` - Individual lessons within courses
- `lesson_progress` - Student lesson completion tracking
- `course_favorites` - User bookmarks for courses

**Content & Assessment:**
- `resources` - Learning materials (PDF, video, notes, links)
- `assignments` - Assignment definitions
- `assignment_submissions` - Student work submissions
- `grades` - Grade records
- `quizzes` - Quiz definitions
- `quiz_questions` - Quiz questions (multiple choice, true/false, short answer)
- `quiz_answers` - Correct answer references
- `quiz_attempts` - Student quiz attempts
- `quiz_attempt_answers` - Student quiz responses

**Operations:**
- `attendance` - Attendance records (present, absent, late, excused)
- `schedules` - Calendar events (class, live, exam, event)
- `announcements` - School communications
- `messages` - Direct messaging
- `notifications` - User notifications
- `payments` - Tuition and fee transactions
- `audit_logs` - System activity tracking
- `platform_settings` - Global configuration

### Row Level Security (RLS)

All tables have RLS policies enabled that enforce:
- Users can only read their own data unless granted specific permissions
- Role-based access control (e.g., teachers can access their class data)
- Parent-student relationship approval workflow prevents unauthorized access

### Migration Files

- `supabase/migrations/20240928000001_init.sql` - Initial schema with all tables, types, constraints, triggers, and RLS policies
- `supabase/migrations/20240928000002_qa_fixes.sql` - Security improvements and query optimizations
- `supabase/migrations/20250106000001_parent_approval.sql` - Parent-student relationship approval system
- `supabase/full_schema.sql` - Complete cumulative schema reference

### Verification Script

Test RLS policies using the verification script:

```bash
node scripts/test_rls.js
```

## Project Structure

```
EduBridge Connect/
├── .cursor/                    # Editor workspace configuration
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── .vercel/                    # Vercel deployment configuration
├── eslint.config.mjs           # ESLint configuration
├── next.config.ts              # Next.js configuration (image domains)
├── package.json                # Dependencies and npm scripts
├── postcss.config.mjs          # PostCSS configuration
├── scripts/                    # Utility scripts
│   ├── seed.ts                 # Demo account seeding
│   └── test_rls.js             # RLS policy verification
├── src/
│   ├── actions/                # Next.js Server Actions
│   │   ├── academic.ts         # Academic operations
│   │   ├── account.ts          # Account management
│   │   └── auth.ts             # Authentication (login, signup, password reset)
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Protected routes by role
│   │   │   ├── admin/          # Administrator portal
│   │   │   ├── parent/         # Parent portal
│   │   │   ├── student/        # Student portal
│   │   │   └── teacher/        # Teacher portal
│   │   ├── auth/callback/      # Supabase auth callback handler
│   │   ├── login/              # Login page
│   │   ├── signup/             # Registration page
│   │   ├── forgot-password/    # Password recovery
│   │   ├── reset-password/     # Password reset form
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   └── globals.css         # Global styles
│   ├── components/             # React components
│   │   ├── charts/             # Recharts visualization components
│   │   ├── forms/              # Form components
│   │   ├── layout/             # App shell, navigation, sidebar
│   │   ├── pages/              # Reusable page components
│   │   ├── shared/             # Shared UI components
│   │   ├── student/            # Student-specific components
│   │   └── ui/                 # Radix UI primitives
│   ├── lib/                    # Library code
│   │   ├── auth/               # Authentication helpers (roles, navigation)
│   │   ├── data/               # Data query abstractions
│   │   ├── supabase/           # Supabase clients (browser, server, admin, middleware)
│   │   ├── utils.ts            # Utility functions
│   │   └── validations/        # Zod schemas
│   ├── middleware.ts           # Next.js middleware (route protection)
│   ├── test/                   # Vitest test files
│   └── types/                  # TypeScript type definitions
├── supabase/
│   ├── full_schema.sql         # Complete schema reference
│   └── migrations/             # SQL migration files
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── vitest.config.ts            # Vitest test configuration
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack (`next dev --turbopack`) |
| `npm run build` | Build production-optimized application (`next build`) |
| `npm run start` | Start production server (`next start`) |
| `npm run lint` | Run ESLint code quality checks (`next lint`) |
| `npm run typecheck` | Run TypeScript compiler without emitting files (`tsc --noEmit`) |
| `npm run test` | Run test suite once (`vitest run`) |
| `npm run test:watch` | Run tests in watch mode (`vitest`) |
| `npm run seed` | Seed database with demo accounts (`tsx scripts/seed.ts`) |

## Authentication & Security

### Authentication Flow

1. **Sign Up**: Users register via `/signup` with email, password, full name, and role (student, parent, or teacher)
2. **Email Confirmation**: Supabase sends confirmation email (if enabled in project settings)
3. **Login**: Users authenticate via `/login` using Supabase Auth
4. **Session Management**: Sessions are maintained via HTTP cookies with Supabase SSR integration
5. **Password Reset**: Users can request password resets via `/forgot-password` and complete via `/reset-password`

### Role-Based Access Control

- **Middleware Protection**: `src/middleware.ts` intercepts all requests and validates:
  - User authentication status
  - Account status (active/inactive)
  - Role authorization for protected routes
- **Route Segmentation**: Each role has dedicated portal routes (`/student`, `/teacher`, `/parent`, `/admin`)
- **Server-Side Validation**: Server Actions verify roles before database operations

### Data Security

- **Row Level Security (RLS)**: All database tables have RLS policies enforced at the PostgreSQL layer
- **Service Role Key**: Administrative operations use the service role key, never exposed to the client
- **Environment Variables**: All sensitive credentials stored in `.env.local` (gitignored)
- **Input Validation**: All form inputs validated via Zod schemas before processing

### Known Limitations

- Admin accounts cannot be created via public signup; they must be created by an existing admin or via the seed script
- Parent-student relationships require approval workflow to prevent unauthorized data access
- The application does not currently implement two-factor authentication (2FA)

## Testing

### Test Suite

The project uses Vitest for unit and integration testing:

- **Auth Validations**: `src/test/auth-validations.test.ts` - Authentication form validation
- **Role Utilities**: `src/test/roles.test.ts` - Role-based access control logic
- **Parent Approval**: `src/test/parent-approval.test.ts` - Parent-student relationship workflow
- **Utilities**: `src/test/utils.test.ts` - General utility functions

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

### Test Configuration

Tests are configured in `vitest.config.ts` with:
- `jsdom` environment for DOM testing
- Global test functions enabled
- Path aliases configured (`@/*` maps to `./src/*`)

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment:

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add the following in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your production domain)
3. **Build Configuration**: Vercel automatically detects Next.js and runs `npm run build`
4. **Database**: Ensure your Supabase project has migrations applied
5. **Deploy**: Vercel will build and deploy on push to the configured branch

### Production Considerations

- Set `NEXT_PUBLIC_APP_URL` to your production domain
- Enable email confirmation in Supabase Auth settings
- Review and customize RLS policies for your security requirements
- Configure Supabase storage buckets if file uploads are needed
- Set up monitoring and error tracking (e.g., Vercel Analytics, Sentry)

## Troubleshooting

### Common Issues

**"config" error on login**
- Ensure all environment variables are set in `.env.local`
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

**Database connection errors**
- Confirm Supabase project is active
- Check that migrations have been applied to your database
- Verify RLS policies are enabled

**Seed script fails**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set and valid
- Check that the Supabase project has auth enabled
- Verify the database schema migrations have been applied

**TypeScript errors**
- Run `npm run typecheck` to identify type issues
- Ensure all dependencies are installed with `npm install`
- Check that `tsconfig.json` paths are correctly configured

**Build fails**
- Run `npm run lint` to check for linting errors
- Ensure all environment variables are available during build
- Verify Node.js version is v20 or higher

### Getting Help

If you encounter issues not covered here:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Supabase documentation](https://supabase.com/docs)
- Open an issue on the GitHub repository

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the existing code style
4. Run tests and linting (`npm run test` and `npm run lint`)
5. Commit your changes with a clear message
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a pull request

### Development Guidelines

- Follow TypeScript strict mode conventions
- Use existing UI components from `src/components/ui/`
- Add Zod validation for new forms in `src/lib/validations/`
- Update RLS policies when modifying database access patterns
- Add tests for new utility functions and validation schemas

## License

No license has been selected yet. A license should be added before public distribution.
