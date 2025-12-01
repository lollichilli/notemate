import { Router } from 'express';
import { 
  register,
  login,
  me,
  updateProfile,
  updatePassword
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', register);
router.post('/login', login);
router.get('/me', me);

// Protected routes
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);

export default router;