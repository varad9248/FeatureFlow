readme = """# FeatureFlow 🚀

A powerful **Feature Flag Management System** that lets you control feature releases in real-time without redeploying your application.

## What is FeatureFlow?

FeatureFlow allows developers and product teams to:
- Turn features ON/OFF without redeploying
- Target specific users based on city, plan, or any attribute
- Rollout features to a percentage of users
- Schedule features to turn on/off at a specific time
- Rollback to previous state instantly
- Track all changes with a full Audit Log
- Get real-time updates via SDK

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, ESM |
| Database | Supabase (PostgreSQL) |
| Cache | Upstash Redis |
| Queue | pg-boss (Job Scheduling) |
| Email | Resend |
| DevOps | Docker, GitHub Actions |
| Deployment | Render (Backend), Vercel (Frontend) |

## Project Structure

- backend/ - Express.js API
  - src/api/ - App configuration
  - src/config/ - Supabase, Redis, Queue setup
  - src/modules/auth/ - Signup, Login
  - src/modules/flags/ - Feature flag CRUD
  - src/modules/projects/ - Project management
  - src/modules/sdk/ - SDK evaluation engine
  - src/shared/middlewares/ - Auth, API Key validation
  - src/workers/ - Background job workers
- frontend/ - Next.js application
  - app/ - App router pages
  - features/ - Feature modules
  - store/ - Zustand state management
  - cypress/ - E2E tests
- .github/workflows/ci-cd.yml - GitHub Actions pipeline
- docker-compose.yml

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (optional)
- Supabase account
- Upstash Redis account

### 1. Clone the repository

git clone https://github.com/varad9248/devops-release-flux.git
cd devops-release-flux

### 2. Setup Backend

cd backend
npm install

Create backend/.env file:

SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
DATABASE_URL=your_postgres_url
PORT=8000
FRONTEND_URL=http://localhost:3000

Start backend:

npm run dev

### 3. Setup Frontend

cd frontend
npm install

Create frontend/.env.local file:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000

Start frontend:

npm run dev

### 4. Run with Docker

docker-compose up --build

## API Endpoints

### Auth
- POST /api/v1/auth/signup - Register new user
- POST /api/v1/auth/login - Login and get token

### Projects
- POST /api/v1/projects - Create new project
- GET /api/v1/projects - Get all projects

### Feature Flags
- POST /api/v1/flags - Create a flag
- GET /api/v1/flags/project/:id - Get flags by project
- GET /api/v1/flags/:id - Get single flag
- PATCH /api/v1/flags/:id/toggle - Toggle flag ON/OFF
- POST /api/v1/flags/:id/rules - Add targeting rule
- DELETE /api/v1/flags/:id/rules/:ruleId - Remove targeting rule
- POST /api/v1/flags/:id/rollback - Rollback to previous state
- POST /api/v1/flags/:id/schedule - Schedule flag toggle
- GET /api/v1/flags/:id/logs - Get audit logs

### SDK
- POST /api/v1/sdk/evaluate - Evaluate flags for user context

### Health Check
- GET /health - Check if server is running

## Testing

### Run Backend Tests
cd backend
npm test

### Run Frontend E2E Tests
cd frontend
npx cypress run

### Test Results
- Unit Tests: 10 passing
- Integration Tests: 19 passing
- Cypress E2E Tests: 21 passing
- Total: 50 tests all passing

## CI/CD Pipeline

The GitHub Actions pipeline runs automatically on every PR and push:
- Step 1: Run all 50 tests
- Step 2: Build frontend
- Step 3: Deploy backend to Render
- Step 4: Deploy frontend to Vercel

## Authentication

- User Auth: JWT tokens via Supabase Auth
- SDK Auth: API Key with ff_live_ prefix
- All protected routes require Authorization: Bearer token

## Contributors

- varad9248 - Project Lead
- Shounak-Chavan - DevOps
- Parthshinde2005 - Developer
- Shravani-kurkute - QA Engineer

## License

This project is for educational purposes.
"""

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme)
print('README.md created successfully!')
