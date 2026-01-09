const PatientService = require('../services/patientService');

// @desc    Register a new patient
// @route   POST /api/staff/patients/register
// @access  Private (Hospital Staff)
exports.registerPatient = async (req, res) => {
    try {
        const { personalInfo, contactInfo, admissionDetails } = req.body;

        // Basic Validation
        if (!personalInfo?.fullName || !contactInfo?.mobileNumber || !admissionDetails?.department) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const patient = await PatientService.registerPatient(
            req.body,
            req.user._id,
            req.user.hospitalId || req.user._id
        );

        res.status(201).json({
            success: true,
            data: PatientService.toStaffFormat(patient),
            message: 'Patient registered successfully'
        });

    } catch (error) {
        // Handle Validation/Duplicate Errors
        if (error.message.includes('Duplicate Entry')) {
            return res.status(400).json({ success: false, message: error.message });
        }

        console.error('Register Patient Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error during registration',
            error: error.message
        });
    }
};

// @desc    Get all patients (Active)
// @route   GET /api/staff/patients
// @access  Private
exports.getAllPatients = async (req, res) => {
    try {
        const hospitalId = req.user.hospitalId || req.user._id;
        const result = await PatientService.getHospitalPatients(hospitalId, req.query);

        res.status(200).json({
            success: true,
            count: result.data.length,
            data: result.data,
            pagination: {
                page: result.page,
                limit: req.query.limit || 10,
                total: result.total,
                totalPages: result.totalPages
            }
        });

    } catch (error) {
        console.error('Fetch Patients Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching patients' });
    }
};

// @desc    Get single patient
// @route   GET /api/staff/patients/:id
// @access  Private
exports.getPatientById = async (req, res) => {
    try {
        const patient = await PatientService.getPatientById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.status(200).json({ success: true, data: patient });

    } catch (error) {
        console.error('Fetch Patient Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update patient
// @route   PUT /api/staff/patients/:id
// @access  Private
exports.updatePatient = async (req, res) => {
    try {
        const patient = await PatientService.updatePatient(req.params.id, req.body);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.status(200).json({ success: true, data: patient, message: 'Patient updated successfully' });

    } catch (error) {
        console.error('Update Patient Error:', error);
        res.status(500).json({ success: false, message: 'Server Error updating patient' });
    }
};

// @desc    Soft delete patient
// @route   DELETE /api/staff/patients/:id
// @access  Private
exports.deletePatient = async (req, res) => {
    try {
        const patient = await PatientService.deletePatient(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        res.status(200).json({ success: true, message: 'Patient deleted successfully' });

    } catch (error) {
        console.error('Delete Patient Error:', error);
        res.status(500).json({ success: false, message: 'Server Error deleting patient' });
    }
};

// @desc    Generate Health ID for patient
// @route   POST /api/staff/patients/:id/generate-health-id
// @access  Private
exports.generateHealthId = async (req, res) => {
    try {
        const result = await PatientService.generateHealthId(req.params.id);

        res.status(200).json({
            success: true,
            healthId: result.healthId,
            qrCode: result.qrCode,
            message: 'Health ID generated successfully'
        });

    } catch (error) {
        console.error('Generate Health ID Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server Error generating Health ID'
        });
    }
};
