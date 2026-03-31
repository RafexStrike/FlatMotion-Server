# FlatMotion Server

A production-grade Express.js backend for AI-powered 2D animation generation with comprehensive project and user management.

## Overview

FlatMotion Server is a robust Node.js and Express.js application that powers the AI animation generation platform. It provides RESTful APIs for authentication, project management, animation generation, and admin operations. The server integrates with multiple AI providers and uses Prisma ORM for database management.

## Live Links

- Live Demo  : https://flat-motion.vercel.app
- Frontend   : https://flat-motion.vercel.app
- Backend    : https://flatmotion-server.onrender.com

## Features

- Multi-provider AI support (Anthropic, Groq, Gemini, OpenRouter, HuggingFace)
- Real-time animation generation and job tracking
- Secure user authentication with Better Auth
- Role-based access control (User, Admin)
- Complete project and animation CRUD operations
- Admin dashboard with user and project management
- Comprehensive error handling and logging
- PostgreSQL database with Prisma ORM
- Docker support for containerized deployment
- Environment-based configuration

## Tech Stack

- Node.js 18+
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Better Auth
- Cloudinary (media storage)
- Docker

## Prerequisites

- Node.js 18.0 or higher
- PostgreSQL 12 or higher
- PostgreSQL client tools
- npm or yarn package manager

## Getting Started

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/flatmotion

# Authentication
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=your-secret-key-here

# CORS and Origins
TRUSTED_CLIENT_ORIGIN=http://localhost:3000,https://your-frontend-url.vercel.app

# AI Providers (choose at least one)
GEMINI_API_KEY=your-gemini-key
ANTHROPIC_API_KEY=your-anthropic-key
GROQ_API_KEY=your-groq-key
OPENROUTER_API_KEY=your-openrouter-key
HF_API_KEY=your-huggingface-key

# Media Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional
PORT=5000
NODE_ENV=development
```

4. Set up the database:
```bash
npx prisma migrate dev --name init
```

5. Generate Prisma client:
```bash
npx prisma generate
```

6. Start the development server:
```bash
npm run dev
```

The server runs on http://localhost:5000 by default.

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@localhost:5432/db` |
| `BETTER_AUTH_URL` | Authentication service URL | Yes | `http://localhost:5000` |
| `BETTER_AUTH_SECRET` | Secret key for auth | Yes | Random string (min 32 chars) |
| `TRUSTED_CLIENT_ORIGIN` | CORS allowed origins | Yes | `http://localhost:3000,https://app.com` |
| `GEMINI_API_KEY` | Google Gemini API key | No | From Google Cloud |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key | No | From Anthropic |
| `GROQ_API_KEY` | Groq API key | No | From Groq |
| `OPENROUTER_API_KEY` | OpenRouter API key | No | From OpenRouter |
| `HF_API_KEY` | HuggingFace API key | No | From HuggingFace |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes | Your cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes | From Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary secret | Yes | From Cloudinary |
| `PORT` | Server port | No | `5000` |
| `NODE_ENV` | Environment | No | `development` or `production` |

## Project Structure

```
server/
├── src/
│   ├── module/              # Feature modules (MVC pattern)
│   │   ├── admin/          # Admin operations
│   │   ├── ai/             # AI generation
│   │   ├── animation/      # Animation handling
│   │   ├── auth/           # Authentication
│   │   ├── payment/        # Payment processing
│   │   ├── project/        # Project management
│   │   └── user/           # User operations
│   ├── routes/             # Route definitions
│   ├── lib/                # Business logic and utilities
│   │   ├── auth.ts         # Better Auth setup
│   │   ├── prisma.ts       # Prisma client
│   │   └── ...
│   ├── config/             # Configuration files
│   └── app.ts              # Express app setup
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── tsconfig.json           # TypeScript configuration
├── Dockerfile              # Docker configuration
└── package.json            # Dependencies
```

## API Endpoints

### Authentication

- `POST /api/auth/sign-up/email` - Register new user
- `POST /api/auth/sign-in/email` - Login user
- `GET /api/auth/get-session` - Get current session
- `POST /api/auth/sign-out` - Logout user

### AI Providers

- `GET /api/ai/providers` - List available providers
- `GET /api/ai/models?provider={name}` - Get provider models
- `POST /api/ai/chat` - Generate animation

### Projects

- `POST /api/projects` - Create project
- `GET /api/projects/user/{userId}` - Get user's projects
- `GET /api/projects/{id}` - Get project details
- `PATCH /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Animations

- `POST /api/animations/generate` - Generate animation
- `GET /api/animations/{jobId}` - Get animation status
- `GET /api/animations/project/{projectId}` - Get project animations
- `GET /api/animations/user/{userId}` - Get user's animations
- `DELETE /api/animations/{jobId}` - Delete animation job
- `PATCH /api/animations/{jobId}/regenerate` - Regenerate animation

### Admin (Requires ADMIN role)

- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/projects` - List all projects
- `DELETE /api/admin/users/{id}` - Delete user
- `DELETE /api/admin/projects/{id}` - Delete project

## Database Schema

### Core Tables

- `User` - User accounts and authentication
- `Project` - Animation projects
- `AnimationJob` - Generation requests and tracking
- `Session` - User sessions for auth

### Key Relationships

- User -> Projects (one-to-many)
- User -> AnimationJobs (one-to-many)
- Project -> AnimationJobs (one-to-many)

## Module Architecture

Each module follows MVC pattern:

- `{module}.controller.ts` - HTTP request handlers
- `{module}.service.ts` - Business logic
- `{module}.route.ts` - Route definitions
- `{module}.interface.ts` - TypeScript interfaces
- `{module}.validation.ts` - Input validation

## AI Provider Implementation

The application supports pluggable AI providers with a unified interface:

```typescript
interface AIProvider {
  generate(prompt: string): Promise<string>;
}
```

Supported providers:
- Anthropic Claude
- Google Gemini
- Groq
- OpenRouter
- HuggingFace

## Database Setup

### Local Development

1. Install PostgreSQL
2. Create a database:
```bash
createdb flatmotion
```

3. Update DATABASE_URL in .env
4. Run migrations:
```bash
npx prisma migrate dev
```

### Production (Render)

When deploying to Render:

1. Create PostgreSQL instance in Render
2. Copy connection string to DATABASE_URL
3. Render automatically runs migrations on deploy

## Development

### Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production build:
```bash
npm run build
```

Production mode:
```bash
npm run start
```

### Database Migrations

Create new migration:
```bash
npx prisma migrate dev --name migration_name
```

Apply migrations:
```bash
npx prisma migrate deploy
```

View schema:
```bash
npx prisma studio
```

## Docker Deployment

### Build Image

```bash
docker build -t flatmotion-server .
```

### Run Container

```bash
docker run \
  -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e BETTER_AUTH_SECRET="..." \
  flatmotion-server
```

### Deployment to Render

1. Push repository to GitHub
2. Create Web Service in Render
3. Set Root Directory to `server`
4. Configure environment variables
5. Set build command to: `npm install && npx prisma migrate deploy`
6. Set start command to: `npm run start`
7. Deploy

First build takes several minutes for Manim dependencies.

## Authentication Flow

1. User registers/logs in
2. Better Auth creates session and returns token
3. Token stored in `Authorization` header
4. Server validates token for protected routes
5. User role checked for admin routes

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

## Logging

Server logs requests and errors to console. In production, logs should be persisted.

## Security Measures

- CORS configuration with trusted origins
- Input validation on all endpoints
- Role-based access control (RBAC)
- Secure password hashing
- Bearer token authentication
- Environment-based secrets

## Performance Optimization

- Database query optimization with Prisma
- Connection pooling
- Caching strategies for AI providers
- Efficient pagination
- Index optimization on database

## Monitoring and Admin

Admin dashboard (at `/admin` on frontend) provides:

- System statistics
- User management
- Project management
- System health status
- Server uptime tracking

## Troubleshooting

### Database Connection Issues

Check:
1. PostgreSQL is running
2. DATABASE_URL is correct
3. Credentials are valid
4. Database exists

### Port Already in Use

Change PORT in .env or use:
```bash
PORT=5001 npm run dev
```

### Prisma Issues

Clear cache and regenerate:
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

### Environment Variables

Restart server after changing `.env`:
```bash
npm run dev
```

## Contributing

1. Create feature branch
2. Follow TypeScript conventions
3. Add validation for inputs
4. Test endpoints with Postman/Thunder Client
5. Submit pull request

## License

Proprietary software. All rights reserved.

## Support

For issues or questions, contact: support@flatmotion.com

## API Response Examples

### Success Response

```json
{
  "success": true,
  "data": {
    "id": "123",
    "title": "My Animation"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Validation failed"
}
```
