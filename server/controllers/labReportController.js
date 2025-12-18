const LabReport = require('../models/LabReport');

// @desc    Get all lab reports for a patient
// @route   GET /api/lab-reports
// @access  Private
const getLabReports = async (req, res) => {
    try {
        const query = {};
        if (req.user.role === 'patient') {
            query.patientId = req.user._id;
        } else if (req.user.role === 'doctor') {
            // Doctors might want to see reports they ordered or for their patients
            // For simplicity, let's say they can see reports where they are the 'doctorId' or 'uploadedBy'
            query.$or = [{ doctorId: req.user._id }, { uploadedBy: req.user._id }];
        }

        const reports = await LabReport.find(query)
            .populate('patientId', 'name')
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reports,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single lab report
// @route   GET /api/lab-reports/:id
// @access  Private
const getLabReportById = async (req, res) => {
    try {
        const report = await LabReport.findById(req.params.id)
            .populate('patientId', 'name contact')
            .populate('doctorId', 'name');

        if (!report) {
            return res.status(404).json({ message: 'Lab report not found' });
        }

        // Access control
        if (req.user.role === 'patient' && report.patientId._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json({
            success: true,
            data: report,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Upload/Create lab report
// @route   POST /api/lab-reports
// @access  Private (Doctor/Admin/Staff, maybe Patient for old records)
const createLabReport = async (req, res) => {
    try {
        const { patientId, doctorId, testName, status, resultSummary, fileUrl } = req.body;

        const report = await LabReport.create({
            patientId,
            doctorId: doctorId || (req.user.role === 'doctor' ? req.user._id : undefined),
            testName,
            status,
            resultSummary,
            fileUrl,
            uploadedBy: req.user._id,
        });

        res.status(201).json({
            success: true,
            data: report,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getLabReports,
    getLabReportById,
    createLabReport,
};
