const express = require('express');
const router = express.Router();
const {
    getLabReports,
    getLabReportById,
    createLabReport,
} = require('../controllers/labReportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getLabReports);
router.post('/', protect, createLabReport);
router.get('/:id', protect, getLabReportById);

module.exports = router;
