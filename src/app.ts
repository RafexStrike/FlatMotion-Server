// File: src/app.ts
import express, { Express } from 'express';
import cors from 'cors';
import { toNodeHandler } from "better-auth/node";
import { auth } from './lib/auth';
import routes from './routes';
import globalErrorHandler from './errorHelpers/globalErrorHandler';
import notFoundHandler from './errorHelpers/notFound';
import { startCleanupScheduler } from './module/animation/animation.scheduler';

const app: Express = express();

// Trust proxy (important for Render/Vercel deployments)
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: (process.env.TRUSTED_CLIENT_ORIGIN?.split(",") || ["http://localhost:3000"]).map(o => o.trim()),
  credentials: true,
}));

app.use((req, _res, next) => {
  if (req.url.includes('/api/auth')) {
    console.log(`[OAuth] ${req.method} ${req.url}`);
    console.log(`[OAuth] Origin: ${req.headers.origin}, Cookies: ${req.headers.cookie || 'NONE'}`);
  }
  next();
});

// Better Auth Handler - Mount BEFORE other routes
app.use("/api/auth", toNodeHandler(auth));

// Routes
app.use('/api', routes);

// Start animation cleanup scheduler
startCleanupScheduler();

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
