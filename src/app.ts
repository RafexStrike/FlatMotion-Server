// File: src/app.ts
import express, { Express } from 'express';
import cors from 'cors';
import { toNodeHandler } from "better-auth/node";
import { auth } from './lib/auth';
import routes from './routes';
import globalErrorHandler from './errorHelpers/globalErrorHandler';
import notFoundHandler from './errorHelpers/notFound';

const app: Express = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: (process.env.TRUSTED_CLIENT_ORIGIN?.split(",") || ["http://localhost:3000"]).map(o => o.trim()),
  credentials: true,
}));

// Better Auth Handler - Mount BEFORE other routes
app.use("/api/auth", toNodeHandler(auth));

// Routes
app.use('/api', routes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
