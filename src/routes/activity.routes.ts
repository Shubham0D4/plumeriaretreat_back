import express from 'express';
import { adminAuth, checkPermission } from '../middleware/adminAuth';
import {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
} from '../controllers/activityController';

const router = express.Router();

// Public routes
router.get('/', getActivities);
router.get('/:id', getActivityById);

// Protected routes
router.use(adminAuth);
router.post('/', checkPermission('manage_activities'), createActivity);
router.put('/:id', checkPermission('manage_activities'), updateActivity);
router.delete('/:id', checkPermission('manage_activities'), deleteActivity);

export default router; 