import { Router } from 'express';
import * as interviewController from '../controllers/interview.controller';

const router = Router();

// Get user's interviews
router.get('/my', interviewController.getMyInterviews);

// Get interview details
router.get('/:id', interviewController.getInterview);

export default router;