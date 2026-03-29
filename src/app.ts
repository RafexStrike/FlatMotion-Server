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
    console.log(`[Backend Debug] ${req.method} ${req.url}`);
    console.log(`[Backend Debug] Origin: ${req.headers.origin}`);
    console.log(`[Backend Debug] Cookies Received:`, req.headers.cookie);
    
    const originalSend = res.send;
    res.send = function (_body) {
      console.log(`[Backend Debug] Response for ${req.url}:`, {
        status: res.statusCode,
        setCookie: res.get('Set-Cookie'),
        allowOrigin: res.get('Access-Control-Allow-Origin'),
        allowCredentials: res.get('Access-Control-Allow-Credentials')
      });
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
