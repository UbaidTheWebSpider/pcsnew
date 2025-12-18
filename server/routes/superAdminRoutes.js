const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { superAdminOnly } = require('../middleware/superAdminMiddleware');
const {
    getSettings, updateSetting,
    getModules, toggleModule,
    getLayouts, saveLayout,
    getAuditLogs
} = require('../controllers/superAdminController');

// All routes here are protected and require super_admin role
router.use(protect);
router.use(superAdminOnly);

// Settings
router.get('/settings', getSettings);
router.post('/settings', updateSetting);

// Modules
router.get('/modules', getModules);
router.post('/modules/toggle', toggleModule);

// Layouts
router.get('/layouts', getLayouts);
router.post('/layouts', saveLayout);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
