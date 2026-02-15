# Sigma Monorepo

A modern full-stack monorepo with **Next.js** frontend and **Express** backend.

## 📁 Project Structure

```
sigma/
├── frontend/              # @sigma/frontend - Next.js web app
│   └── app/
│       ├── (auth)/        # Auth pages (login, register)
│       ├── (main)/        # Protected pages
│       │   ├── (admin)/   # Admin pages
│       │   └── (learner)/ # Learner pages
│       └── (public)/      # Public pages
├── backend/               # @sigma/backend - Express REST API
│   ├── prisma/            # Database schema
│   └── src/
│       ├── lib/           # Prisma client
│       ├── middleware/    # Express middlewares
│       ├── routes/        # API routes
│       ├── schemas/       # Zod validation schemas
│       ├── services/      # Business logic
│       └── index.ts       # Entry point
├── packages/
│   └── shared/            # @sigma/shared - Shared types & utils
│       └── src/
│           ├── types/     # Common TypeScript interfaces
│           └── utils/     # Common utility functions
├── docker-compose.yml     # Docker orchestration
├── package.json           # Root workspace config
└── pnpm-workspace.yaml
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker (for database)

### Installation

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install all dependencies
pnpm install

# Generate Prisma client
pnpm --filter @sigma/db db:generate
```

### Environment Setup

Copy the example environment file and configure:

```bash
cp backend/.env.example backend/.env
```

Required environment variables:

| Variable                 | Description           | Default                 |
| ------------------------ | --------------------- | ----------------------- |
| `PORT`                   | Backend server port   | `4000`                  |
| `DATABASE_URL`           | PostgreSQL connection | See `.env.example`      |
| `JWT_SECRET`             | JWT signing secret    | (generate a secure key) |
| `JWT_REFRESH_SECRET`     | Refresh token secret  | (generate a secure key) |
| `JWT_EXPIRES_IN`         | Access token expiry   | `15m`                   |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry  | `7d`                    |
| `CORS_ORIGIN`            | Allowed CORS origin   | `http://localhost:3000` |

### Development

```bash
# Start database with Docker
docker-compose up postgres -d

# Push database schema
pnpm --filter @sigma/db db:push

# Run both frontend and backend
pnpm dev

# Or run separately
pnpm dev:frontend   # http://localhost:3000
pnpm dev:backend    # http://localhost:4000
```

### With Docker (Full Stack)

```bash
# Start all services (postgres, backend, frontend)
pnpm docker:up

# Stop all services
pnpm docker:down

# Rebuild containers
pnpm docker:build
```

## 📦 Packages

| Package           | Description                | Port |
| ----------------- | -------------------------- | ---- |
| `@sigma/frontend` | Next.js 16 web application | 3000 |
| `@sigma/backend`  | Express 5 REST API         | 4000 |
| `@sigma/shared`   | Shared types & utilities   | -    |

## 🌐 Frontend Routes

| Route        | Description       | Access  |
| ------------ | ----------------- | ------- |
| `/`          | Landing page      | Public  |
| `/login`     | Login page        | Guest   |
| `/register`  | Registration page | Guest   |
| `/dashboard` | Learner dashboard | Learner |
| `/admin`     | Admin dashboard   | Admin   |

## 🔐 API Endpoints

### Auth

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | `/api/auth/register` | Register new user    |
| POST   | `/api/auth/login`    | Login and get tokens |
| POST   | `/api/auth/refresh`  | Refresh access token |
| POST   | `/api/auth/logout`   | Logout               |
| GET    | `/api/auth/me`       | Get current user     |

### Users

| Method | Endpoint         | Description            |
| ------ | ---------------- | ---------------------- |
| GET    | `/api/users`     | List all users (admin) |
| GET    | `/api/users/:id` | Get user by ID         |
| PATCH  | `/api/users/:id` | Update user            |
| DELETE | `/api/users/:id` | Delete user (admin)    |

## 🛠️ Tech Stack

### Frontend

- Next.js 16 (Turbopack)
- React 19
- TypeScript
- TailwindCSS 4

### Backend

- Express 5
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod Validation
- TypeScript

### Shared

- TypeScript
- Common types & utilities

## 📝 Scripts

### Root Scripts

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `pnpm dev`          | Start all apps in development |
| `pnpm build`        | Build all apps for production |
| `pnpm lint`         | Lint all apps                 |
| `pnpm format`       | Format code with Prettier     |
| `pnpm format:check` | Check code formatting         |
| `pnpm clean`        | Clean all build artifacts     |
| `pnpm docker:up`    | Start Docker containers       |
| `pnpm docker:down`  | Stop Docker containers        |
| `pnpm docker:build` | Build Docker images           |

### Backend Database Scripts

| Command                                    | Description             |
| ------------------------------------------ | ----------------------- |
| `pnpm --filter @sigma/db db:generate` | Generate Prisma client  |
| `pnpm --filter @sigma/db db:push`     | Push schema to database |
| `pnpm --filter @sigma/db db:migrate`  | Run migrations          |
| `pnpm --filter @sigma/db db:studio`   | Open Prisma Studio      |

## 🔧 Using Shared Package

Import types and utilities from the shared package:

```typescript
// Import everything
import { ApiResponse, User, formatDate, isEmpty } from '@sigma/shared';

// Or import from specific subpaths
import { User, AuthTokens } from '@sigma/shared/types';
import { formatDate, isEmpty } from '@sigma/shared/utils';
```

### Available Types

- `ApiResponse<T>` - Standard API response wrapper
- `PaginationParams` - Pagination request parameters
- `PaginatedResponse<T>` - Paginated response wrapper
- `User` - User interface
- `AuthTokens` - JWT token pair

### Available Utils

- `formatDate()` - Format Date to ISO string
- `parseDate()` - Parse string to Date
- `sleep()` - Async delay function
- `generateId()` - Generate random ID
- `isEmpty()` - Check if value is empty
- `clamp()` - Clamp number between min/max

## 📄 License

Private project.
