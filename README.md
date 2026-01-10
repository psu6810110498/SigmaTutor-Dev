# Sigma Monorepo

A modern full-stack monorepo with **Next.js** frontend and **Express** backend.

## 📁 Project Structure

```
sigma/
├── frontend/              # @sigma/frontend - Next.js web app
├── backend/               # @sigma/backend - Express REST API
│   ├── prisma/            # Database schema
│   ├── src/
│   │   ├── lib/           # Prisma client
│   │   ├── middleware/    # Express middlewares
│   │   ├── routes/        # API routes
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── services/      # Business logic
│   │   └── index.ts       # Entry point
│   └── Dockerfile
├── packages/
│   └── shared/            # @sigma/shared - Shared types & utils
├── docker-compose.yml     # Docker orchestration
├── package.json           # Root workspace config
└── pnpm-workspace.yaml
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Docker (optional, for database)

### Installation

```bash
# Install pnpm if not installed
npm install -g pnpm

# Install all dependencies
pnpm install

# Generate Prisma client
pnpm --filter @sigma/backend db:generate
```

### Development

```bash
# Start database with Docker
docker-compose up postgres -d

# Push database schema
pnpm --filter @sigma/backend db:push

# Run both frontend and backend
pnpm dev

# Or run separately
pnpm dev:frontend   # http://localhost:3000
pnpm dev:backend    # http://localhost:4000
```

### With Docker

```bash
# Start all services
pnpm docker:up

# Stop all services
pnpm docker:down
```

## 📦 Packages

| Package           | Description                | Port |
| ----------------- | -------------------------- | ---- |
| `@sigma/frontend` | Next.js 16 web application | 3000 |
| `@sigma/backend`  | Express 5 REST API         | 4000 |
| `@sigma/shared`   | Shared types & utilities   | -    |

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

| Command            | Description                   |
| ------------------ | ----------------------------- |
| `pnpm dev`         | Start all apps in development |
| `pnpm build`       | Build all apps for production |
| `pnpm lint`        | Lint all apps                 |
| `pnpm format`      | Format code with Prettier     |
| `pnpm clean`       | Clean all build artifacts     |
| `pnpm docker:up`   | Start Docker containers       |
| `pnpm docker:down` | Stop Docker containers        |

### Backend Scripts

| Command                                    | Description             |
| ------------------------------------------ | ----------------------- |
| `pnpm --filter @sigma/backend db:generate` | Generate Prisma client  |
| `pnpm --filter @sigma/backend db:push`     | Push schema to database |
| `pnpm --filter @sigma/backend db:migrate`  | Run migrations          |
| `pnpm --filter @sigma/backend db:studio`   | Open Prisma Studio      |

## 🔧 Using Shared Package

Import types and utilities from the shared package:

```typescript
import { ApiResponse, User, formatDate, isEmpty } from '@sigma/shared';
```

## 📄 License

Private project.
