const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const adminMiddleware = require('../middlewares/admin.middleware');
const adminController = require('../controllers/admin.controller');

// GET /api/admin/audit-logs
router.get('/audit-logs', authMiddleware, adminMiddleware, adminController.getAuditLogs);
// GET /api/admin/contact (public)
router.get('/contact', adminController.getContact);

module.exports = router;
