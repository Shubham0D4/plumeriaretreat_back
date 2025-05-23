import express from 'express';
import {
  adminLogin,
  getAdminProfile,
  updateAdminProfile,
  getAdminSettings,
  updateAdminSetting,
  getActivityLogs,
} from '../controllers/adminController';
import { adminAuth, checkPermission } from '../middleware/adminAuth';

const router = express.Router();

// Public routes
router.post('/login', adminLogin);

// Protected routes
router.use(adminAuth);

// Profile routes
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

// Settings routes
router.get('/settings', checkPermission('manage_settings'), getAdminSettings);
router.put('/settings', checkPermission('manage_settings'), updateAdminSetting);

// Activity logs
router.get('/activity-logs', checkPermission('view_reports'), getActivityLogs);

export default router; 