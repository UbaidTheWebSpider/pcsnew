const StaffPatient = require('../models/StaffPatient');
const User = require('../models/User'); // For Doctor validation if needed

// @desc    Register a new patient
// @route   POST /api/staff/patients/register
// @access  Private (Hospital Staff)
exports.registerPatient = async (req, res) => {
    try {
        const { personalInfo, contactInfo, admissionDetails, medicalBackground } = req.body;

        // Basic Validation
        if (!personalInfo?.fullName || !contactInfo?.mobileNumber || !admissionDetails?.department) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Sanitize CNIC (Avoid duplicate null/empty conflicts)
        if (personalInfo && (personalInfo.cnic === '' || personalInfo.cnic === null)) {
            delete personalInfo.cnic;
        }

        // Check for duplicate CNIC if provided
        if (personalInfo?.cnic) {
            const existingPatient = await StaffPatient.findOne({ 'personalInfo.cnic': personalInfo.cnic });
            if (existingPatient) {
                return res.status(400).json({ success: false, message: 'Patient with this CNIC already exists' });
            }
        }

        const patient = await StaffPatient.create({
            personalInfo,
            contactInfo,
            admissionDetails,
            medicalBackground,
            hospitalId: req.user.hospitalId || req.user._id, // Assuming staff is linked to hospital or user is hospital admin
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            data: patient,
            message: 'Patient registered successfully'
        });

    } catch (error) {
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
        const { search, department, type, page = 1, limit = 10 } = req.query;
        let query = { isActive: true };

        // Scope to hospital
        const hospitalId = req.user.hospitalId || req.user._id;
        query.hospitalId = hospitalId;

        if (search) {
            query.$or = [
                { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
                { 'personalInfo.cnic': { $regex: search, $options: 'i' } },
                { 'contactInfo.mobileNumber': { $regex: search, $options: 'i' } },
                { patientId: { $regex: search, $options: 'i' } }
            ];
        }

        if (department) query['admissionDetails.department'] = department;
        if (type) query['admissionDetails.patientType'] = type;

        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Get total count for pagination
        const total = await StaffPatient.countDocuments(query);
        const totalPages = Math.ceil(total / limitNum);

        const patients = await StaffPatient.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('admissionDetails.assignedDoctorId', 'name specialization');

        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages
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
        const patient = await StaffPatient.findById(req.params.id)
            .populate('admissionDetails.assignedDoctorId', 'name')
            .populate('createdBy', 'name');

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
        let patient = await StaffPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Sanitize incoming update data
        if (req.body.personalInfo && (req.body.personalInfo.cnic === '' || req.body.personalInfo.cnic === null)) {
            delete req.body.personalInfo.cnic;
        }

        patient = await StaffPatient.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

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
        const patient = await StaffPatient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        patient.isActive = false;
        await patient.save();

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
        const crypto = require('crypto');
        const { id } = req.params;

        const patient = await StaffPatient.findById(id);
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Check if health ID already exists
        if (patient.healthId) {
            return res.status(400).json({
                success: false,
                message: 'Health ID already exists for this patient',
                healthId: patient.healthId
            });
        }

        // Generate unique Health ID
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = crypto.randomBytes(3).toString('hex').toUpperCase();
        const healthId = `HID-${timestamp}-${random}`;

        // Create QR code data
        const qrData = JSON.stringify({
            hid: healthId,
            pid: patient.patientId,
            name: patient.personalInfo?.fullName,
            issued: new Date().toISOString()
        });

        // Update patient with health ID
        patient.healthId = healthId;
        patient.healthCardQr = qrData;
        patient.healthCardIssueDate = new Date();
        await patient.save();

        console.log(`Health ID generated for patient ${id}: ${healthId}`);

        res.status(200).json({
            success: true,
            healthId,
            qrCode: qrData,
            message: 'Health ID generated successfully'
        });

    } catch (error) {
        console.error('Generate Health ID Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error generating Health ID',
            error: error.message
        });
    }
};
