import { Router } from 'express';
import { adminController } from './admin.controller';
import { auth } from '../../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

const adminRouter = Router();

adminRouter.use(async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers)
    });
    
    if (!session || !session.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    
    if ((session.user as any).role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Forbidden: Admin access only' });
      return;
    }
    
    (req as any).user = session.user;
    next();
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/stats', adminController.getStats);
adminRouter.get('/users', adminController.getUsers);
adminRouter.get('/projects', adminController.getProjects);
adminRouter.delete('/users/:id', adminController.deleteUser);
adminRouter.delete('/projects/:id', adminController.deleteProject);

export default adminRouter;
