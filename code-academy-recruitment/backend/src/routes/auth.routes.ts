import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validation';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Email domain validation
const emailDomainValidator = body('email')
  .isEmail()
  .withMessage('Invalid email format')
  .custom((value) => {
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || '@stu.example.edu.cn';
    if (!value.endsWith(allowedDomain)) {
      throw new Error(`Email must be from ${allowedDomain} domain`);
    }
    return true;
  });

// Register
router.post(
  '/register',
  [
    emailDomainValidator,
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  validateRequest,
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  authController.login
);

// Verify email
router.get('/verify-email', authController.verifyEmail);

// Forgot password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Invalid email')],
  validateRequest,
  authController.forgotPassword
);

// Reset password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  authController.resetPassword
);

export default router;