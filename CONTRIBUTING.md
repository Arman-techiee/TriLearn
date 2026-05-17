# Contributing

Thanks for helping improve TriLearn. This project is open source, so the goal is
to make contributions easy to review, easy to run locally, and safe for schools
that may depend on the app.

## Before You Start

- Read [README.md](README.md) for the product overview and architecture.
- Read [SECURITY.md](SECURITY.md) before reporting or fixing security issues.
- Open an issue first for large features, behavior changes, schema changes, or
  anything that changes deployment requirements.
- Keep pull requests focused. Small, reviewable changes are much easier to merge.

## Local Setup

TriLearn has three application layers:

- `backend`: Express, Socket.IO, Prisma, PostgreSQL, and Redis.
- `frontend`: Vite and React web client.
- `mobile`: Expo and React Native client.

Install Node.js 20 or newer. For full local development, also install Docker
Compose, or run PostgreSQL 16 and Redis 7 yourself.

### 1. Clone and Install Root Tooling

```bash
git clone <repo-url>
cd TriLearn
npm install
```

The root install sets up Husky and `lint-staged` for pre-commit checks.

### 2. Configure Environment Files

Copy the example environment files before starting services:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp mobile/.env.example mobile/.env
```

Use local-only secrets in these files. Do not commit real credentials, production
secrets, API keys, database dumps, or `.env` files.

### 3. Start the Backend

The fastest path for backend dependencies is Docker Compose:

```bash
npm run dev:docker
```

That starts PostgreSQL, Redis, and the backend API. The API runs on
`http://localhost:5000`.

If you run PostgreSQL and Redis outside Docker, install backend dependencies and
run migrations directly:

```bash
cd backend
npm install
npm run prisma:migrate:dev
npm run dev
```

### 4. Start the Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite app expects `VITE_API_URL` in `frontend/.env`, usually
`http://localhost:5000/api/v1` for local development.

### 5. Start the Mobile App

In a separate terminal:

```bash
cd mobile
npm install
npm run start
```

For Android emulators, API URLs may need `http://10.0.2.2:5000`. For physical
devices, use the LAN IP address of the machine running the backend.

## Running Tests and Checks

Run the checks that match the files you changed. If a change crosses layers, run
the relevant commands in each affected package.

### Backend

```bash
cd backend
npm run lint
npm run typecheck
npm test
```

Use `npm run test:db` only when you have a test-safe PostgreSQL database
configured.

### Frontend

```bash
cd frontend
npm run lint
npm test
npm run build
```

### Mobile

```bash
cd mobile
npm run lint
npm test
```

Before opening a pull request, mention which checks you ran. If you could not run
a relevant check, say why.

## Branch Naming

Create branches from `main` and use short, descriptive names:

- `feature/<area>-<summary>` for new behavior.
- `fix/<area>-<summary>` for bug fixes.
- `docs/<area>-<summary>` for documentation-only changes.
- `test/<area>-<summary>` for test-only changes.
- `chore/<area>-<summary>` for maintenance work.

Examples:

```text
feature/mobile-attendance-sync
fix/backend-refresh-token-rotation
docs/contributing-guide
```

## Commit Guidelines

- Keep commits focused on one logical change.
- Use clear imperative commit subjects, such as `Fix attendance QR expiry`.
- Include migrations with the backend code that depends on them.
- Do not commit generated build output, local logs, upload files, or secrets.

## Pull Request Expectations

Every pull request should include:

- A clear summary of what changed and why.
- Linked issues when applicable.
- Screenshots or screen recordings for UI changes.
- Notes for schema, environment, deployment, or migration changes.
- The exact tests and checks you ran.
- Any known limitations or follow-up work.

Reviewers should be able to pull the branch, follow the setup steps above, and
verify the change without guessing about hidden state.

## Code Expectations

- Follow the existing style and project structure in the package you touch.
- Prefer small changes over broad rewrites.
- Add or update tests for bug fixes, authorization changes, data handling,
  security behavior, and user-facing workflows.
- Keep API authorization and validation explicit and easy to audit.
- Update docs when behavior, setup, environment variables, or deployment steps
  change.

## Repository Security Settings

GitHub secret scanning must be enabled for this repository. This is a repository
setting, not a code change: in GitHub, open Settings > Code security and
analysis, then enable Secret scanning.

## Frontend Scripts

All frontend dependencies should be bundled through the Vite build. If a future
change adds a third-party `<script src="...">` tag to `frontend/index.html`, the
tag must include `integrity` and `crossorigin="anonymous"` attributes.
