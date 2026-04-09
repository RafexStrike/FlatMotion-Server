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

app.use((req, res, next) => {
  if (req.url.includes('/api/auth')) {
    console.log(`[Auth Debug] ${req.method} ${req.url}`);
    console.log(`[Auth Debug] Origin: ${req.headers.origin}`);
    console.log(`[Auth Debug] Referer: ${req.headers.referer}`);
    console.log(`[Auth Debug] Cookies in request:`, req.headers.cookie || 'NONE');
    console.log(`[Auth Debug] NODE_ENV:`, process.env.NODE_ENV);

    const originalSend = res.send;
    res.send = function (body) {
      const setCookieHeaders = res.getHeader('Set-Cookie');
      console.log(`[Auth Debug] Response status: ${res.statusCode}`);
      console.log(`[Auth Debug] Set-Cookie header:`, setCookieHeaders || 'NONE');
      if (body) {
        try {
          const parsed = typeof body === 'string' ? JSON.parse(body) : body;
          console.log(`[Auth Debug] Response body:`, JSON.stringify(parsed).substring(0, 200));
        } catch (e) {
          console.log(`[Auth Debug] Response body (raw):`, body.toString().substring(0, 200));
        }
      }
      console.log(`[Auth Debug] CORS Allow-Origin:`, res.getHeader('Access-Control-Allow-Origin'));
      console.log(`[Auth Debug] CORS Allow-Credentials:`, res.getHeader('Access-Control-Allow-Credentials'));
      return originalSend.apply(res, arguments as any);
    };
  }
  next();
});

// Better Auth Handler - Mount BEFORE other routes
app.use("/api/auth", toNodeHandler(auth));

// Routes
app.use('/api', routes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

export default app;
