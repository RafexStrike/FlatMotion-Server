// File: server/src/routes/index.ts
import { Router } from 'express';
import userRouter from '../module/user/user.route';
import authRouter from '../module/auth/auth.route';
import projectRouter from '../module/project/project.route';
import animationRouter from '../module/animation/animation.route';
import adminRouter from '../module/admin/admin.route';
import aiRouter from '../module/ai/ai.route';
import paymentRouter from '../module/payment/payment.route';

const routes = Router();

// Module Routes
routes.use('/users', userRouter);
routes.use('/auth', authRouter);
routes.use('/projects', projectRouter);
routes.use('/animations', animationRouter);
routes.use('/admin', adminRouter);
routes.use('/ai', aiRouter);
routes.use('/payment', paymentRouter);

// Health check endpoint
routes.get('/health', (_req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

export default routes;
