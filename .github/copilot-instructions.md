# Splitsy-Demo Development Guide

## Project Architecture

**Monorepo Structure**: Full-stack expense splitting app with separate `backend/` (Express + MongoDB) and `frontend/` (React + Vite) directories. Both use TypeScript with distinct configurations.

**Core Domain**: Group expense tracking with automatic balance calculations and settlement suggestions. Groups → Expenses → Balance calculations → Settlement recommendations.

## Critical File Extensions

- **Backend**: Use `.mts` extension for all TypeScript files (ES modules with `"module": "nodenext"`)
- **Frontend**: Use `.ts`/`.tsx` extensions (standard Vite setup)
- **Imports**: Backend imports must include `.mjs` extension: `import { foo } from "./bar.mjs"`

## Authentication Flow

**Cookie-based JWT authentication** with middleware pattern:

1. `/register` and `/login` routes are **public** (before `app.use(auth)` in `backend/src/index.mts`)
2. All other routes require authentication via `auth` middleware
3. JWT stored in httpOnly cookie named `"login"`, 7-day expiry
4. Middleware attaches `req.userId` to authenticated requests
5. Frontend sends `credentials: "include"` on all fetch calls to include cookies

**Key files**: `backend/src/middlewares/auth.mts`, `frontend/src/components/ProtectedRoute.tsx`

## Data Model & Relationships

**Mongoose schemas** with populated references:

- `User` (basic auth + profile)
- `Group` (members array with embedded role/joinedAt, references User)
- `Expense` (references Group, paidBy User, participants array of Users)

**Population pattern**: Controllers use `.populate()` to resolve references:

```typescript
await Group.findById(groupId)
  .populate("createdBy", "name email")
  .populate("members.userId", "name email");
```

## Balance Calculation Service

`backend/src/services/balanceService.mts` implements split-wise balance tracking:

- Aggregates all expenses for a group
- Calculates per-person balances (what they paid vs their share)
- Generates simplified settlement suggestions (minimize # of transactions)
- Uses greedy algorithm: match largest creditor with largest debtor

**Algorithm**: Balance = totalPaid - totalShare; settlements pair creditors with debtors until balanced.

## Development Workflow

**Backend**:

```bash
cd backend
npm run dev  # tsx watch mode on src/index.mts
```

**Frontend**:

```bash
cd frontend
npm run dev  # Vite dev server (default port 5173)
```

**Environment variables**:

- Backend requires: `URL` (MongoDB), `JWT_SECRET`, `FRONTEND_URL`, `PORT`, `NODE_ENV`
- Frontend uses: `VITE_API_URL` (defaults to `http://localhost:3001`)
- Frontend has `.env.example` template; backend does not

## API Patterns

**Route structure**: Modular routers mounted in `backend/src/index.mts`

- Controllers in `src/controllers/` (business logic)
- Routes in `src/routes/` (route definitions)
- Services in `src/services/` (complex calculations/utilities)

**Error handling**: Controllers use try-catch, return JSON with `{ error: string }` or `{ message: string }`

**Request typing**: Controllers use global namespace augmentation to add `userId` to Express Request:

```typescript
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
```

## Frontend Conventions

**Routing**: React Router v7 with `createBrowserRouter`, nested routes under `Layout`

**Protected routes**: Wrap in `<ProtectedRoute>` component which checks auth on mount and redirects to `/login`

**Service layer pattern**: Frontend services (`authService`, `groupService`) encapsulate all API calls with typed interfaces, handle `credentials: "include"`

**Styling**: Tailwind CSS v4 with PostCSS setup

## Common Gotchas

- Backend TypeScript uses strict mode with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- Auth middleware must be mounted AFTER public routes but BEFORE protected routes
- Group membership verification: Controllers check `group.members.some(member => member.userId._id.toString() === userId)`
- Mongoose `_id` is ObjectId type, convert to string for comparisons: `.toString()`
- Frontend API calls default to `http://localhost:3001` if `VITE_API_URL` not set
