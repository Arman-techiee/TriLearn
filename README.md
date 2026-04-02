# EduNexus

EduNexus is a full-stack school and college management system built for a Nepal campus workflow. It includes role-based dashboards, attendance management, academic modules, admissions intake, student onboarding, and first-login account setup.

The project is currently optimized for local development and demos. Core academic and administrative flows are implemented, while some production-only features like email delivery and cloud file storage are intentionally left for later.

## Highlights

- Role-based system for `ADMIN`, `COORDINATOR`, `INSTRUCTOR`, `GATEKEEPER`, and `STUDENT`
- Public student intake form for collecting admission details before creating a portal account
- Admin and coordinator admissions review flow with account creation from submitted forms
- Personal-email student login with institution-assigned student ID
- Default student password with forced password change on first login
- Student profile completion and profile editing flow
- Department, subject, routine, notice, assignment, study material, and exam result management
- Student QR attendance windows with semester-based gate access, holiday controls, and instructor manual attendance
- Coordinator monthly department attendance reporting by semester and section
- PDF and Excel attendance export
- Pagination, reusable frontend components, validation, logging, audit records, and safer auth handling

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Tailwind CSS
- Backend: Node.js, Express
- Database: PostgreSQL
- ORM: Prisma
- Authentication: JWT access token + refresh token
- Validation: Zod
- Logging: Winston
- File Uploads: Multer
- Export: PDFKit, ExcelJS
- QR Support: `qrcode`

## Roles

### `ADMIN`

- full system control
- creates coordinators, instructors, gatekeepers, and students
- manages departments, subjects, routines, notices, and academic setup
- manages Student QR windows and attendance holidays
- reviews admissions and converts intake forms into student accounts

### `COORDINATOR`

- sub-admin for academic operations
- can review student intake forms
- can create student accounts from approved applications
- can manage attendance, notices, routine-related academic workflows, and student support tasks
- can manage Student QR time slots and holiday attendance settings
- can suspend or manage student-related operations without full admin control

### `INSTRUCTOR`

- manages assigned subject attendance
- uploads assignments and study materials
- enters exam results
- exports subject attendance reports

### `GATEKEEPER`

- manages gate QR attendance flow
- shows the live rotating Student QR for the currently active semester time slot

### `STUDENT`

- logs in with personal email
- changes password on first login
- completes profile details
- views subjects, notices, routine, study materials, assignments, attendance, and exam results
- scans gate QR when the gate attendance flow is active

## Core Modules

### 1. Admissions and Student Onboarding

- Public form at `/student-intake`
- Intake form collects:
  - full name
  - personal email
  - phone
  - father and mother details
  - blood group
  - local guardian details
  - permanent and temporary address
  - date of birth
  - preferred department
- Review pages:
  - `/admin/applications`
  - `/coordinator/applications`
- Admin or coordinator can create a student account from the submitted form
- Institution student ID is entered manually during account creation

### 2. Authentication and Account Rules

- login with personal email
- refresh-token based auth flow
- forgot-password API prepared for future email integration
- first login forces password change for newly created students
- student profile completion is required for first-time onboarding flows

### 3. Attendance

EduNexus currently supports multiple attendance workflows:

1. Gate attendance
   - admin or coordinator defines Student QR windows by day, time, allowed semesters, and optional holidays
   - gatekeeper opens a simple Student QR page that rotates every 60 seconds
   - students can scan only when their semester is allowed in the active time window
   - attendance is marked only for the student’s scheduled routine subjects that overlap that active time slot
   - if a day is marked as a holiday, no Student QR scan is accepted and attendance percentages are not deducted
   - if a valid scan or instructor manual attendance is missing after the allowed time window closes, absence is created automatically

2. Instructor attendance
   - instructors manually mark subject attendance by date
   - instructors can export PDF and Excel reports

3. Coordinator attendance reporting
   - coordinators can view department-wide monthly attendance
   - filter by semester, optional section, and month
   - export semester-wise attendance summaries and student records as PDF and Excel

### 4. Academic Management

- departments
- subjects
- subject enrollments
- class routines with explicit department, semester, and section targeting
- notices
- assignments
- study materials
- exam results

### 5. Student Profile Management

Students, instructors, coordinators, and admins can edit their own profile from the profile page.

Locked fields remain read-only for authenticity:

- name
- email
- student ID for students
- department for instructor and coordinator

Students can manage additional profile fields such as:

- father and mother details
- local guardian details
- blood group
- permanent and temporary address
- section
- date of birth

## Security and Quality Features

- route-level validation with Zod
- role-based access protection
- strong password rules
- auth route rate limiting and global API limiting
- refresh tokens with server-side storage and rotation
- safe backend error handling
- frontend error boundary
- friendly frontend error messages
- reusable `useApi` and shared UI components
- audit logging for important actions
- pagination for larger lists
- indexed Prisma schema for common filters

## Project Structure

```text
EduNexus/
├─ backend/
│  ├─ prisma/
│  │  ├─ migrations/
│  │  └─ schema.prisma
│  ├─ src/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  ├─ utils/
│  │  └─ validators/
│  └─ uploads/
├─ frontend/
│  ├─ public/
│  └─ src/
│     ├─ components/
│     ├─ context/
│     ├─ hooks/
│     ├─ layouts/
│     ├─ pages/
│     └─ utils/
├─ .env.example
├─ DEPLOYMENT.md
└─ README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm

### 1. Clone and install

```bash
git clone <your-repo-url>
cd EduNexus
```

Backend:

```bash
cd backend
npm install
```

Frontend:

```bash
cd ../frontend
npm install
```

### 2. Configure environment variables

Create a root `.env` or backend `.env` based on [`.env.example`](/C:/Users/arman/EduNexus/.env.example).

Current example values:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/edunexus?connection_limit=10&pool_timeout=20
JWT_SECRET=change_this_to_a_long_random_string
JWT_REFRESH_SECRET=change_this_to_a_different_long_random_string
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DEFAULT_STUDENT_PASSWORD=password
PGPOOL_MAX=10
PGPOOL_MIN=0
PGPOOL_IDLE_TIMEOUT_MS=10000
PGPOOL_CONNECTION_TIMEOUT_MS=10000
PGPOOL_MAX_USES=0
UPLOAD_DIR=backend/uploads
UPLOAD_PUBLIC_PATH=/uploads
UPLOAD_BASE_URL=
```

Frontend local API configuration:

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run database migrations

From [backend](/C:/Users/arman/EduNexus/backend):

```bash
npx prisma migrate deploy
npx prisma generate
```

For active development, you can also use:

```bash
npm run prisma:migrate:dev
```

### 4. Start the app

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`

## Suggested Demo Flow

If you want to show the project to others, this is a clean demo sequence:

1. Create departments
2. Create coordinator and instructor accounts
3. Open `/student-intake` and submit a sample student application
4. Log in as admin or coordinator and open `/admin/applications`
5. Review the application and create the student account
6. Share the student's email and default password
7. Log in as that student
8. Force password change on first login
9. Complete or update the profile
10. Show attendance, notices, assignments, routine, and exam results

## Important Routes

### Frontend

- `/login`
- `/forgot-password`
- `/reset-password`
- `/student-intake`
- `/admin`
- `/coordinator`
- `/instructor`
- `/gate`
- `/student`
- `/admin/applications`
- `/coordinator/applications`

### Backend API Groups

- `/api/auth`
- `/api/admin`
- `/api/departments`
- `/api/subjects`
- `/api/routines`
- `/api/attendance`
- `/api/assignments`
- `/api/materials`
- `/api/marks`
- `/api/notices`
- `/health`
- `/ping`

## Useful Development Notes

### Default student password

The default password comes from `DEFAULT_STUDENT_PASSWORD`.

Current fallback:

```env
DEFAULT_STUDENT_PASSWORD=password
```

Students are forced to change this after first login.

### Departments must exist first

Before creating instructors, coordinators, students, or converting intake applications, create departments first. Several flows validate department names against the actual department list in the database.

### Forgot password

Forgot-password is intentionally safe but not fully finished for production mail delivery yet.

Current state:

- reset tokens are generated and stored securely
- no reset link is exposed to the user
- real email delivery still needs to be integrated later

### Upload storage

Uploads currently use local disk storage under `backend/uploads`.

This is good for:

- local development
- demos

This is not ideal yet for:

- stateless production deployment
- cloud scaling

## Scripts

### Backend

From [backend/package.json](/C:/Users/arman/EduNexus/backend/package.json):

- `npm run dev`
- `npm run start`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`

### Frontend

From [frontend/package.json](/C:/Users/arman/EduNexus/frontend/package.json):

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Current Limitations

- forgot-password email delivery is not integrated yet
- uploads are still stored on local disk
- there is no parent portal yet
- QR scanning depends on browser camera support
- the project is still optimized more for development and demo usage than full production infrastructure

## Deployment

Deployment preparation has started, but this project is not focused on production deployment yet.

See [DEPLOYMENT.md](/C:/Users/arman/EduNexus/DEPLOYMENT.md) for:

- production environment variables
- migration strategy
- Docker baseline
- health check usage
- file storage notes

## Why This Project Fits a Nepal College Workflow

This project is shaped around a realistic local campus use case:

- first-semester admissions intake
- institution-assigned student IDs
- personal email login for students
- coordinator as sub-admin
- department, semester, and section-based routines plus semester-window Student QR attendance
- phone-first student experience
- printable/exportable attendance records

## Next Good Improvements

- email integration for password reset
- safer production storage such as S3-compatible object storage
- marksheet and transcript style exports
- coordinator-specific dashboards
- better analytics for low attendance and academic alerts
