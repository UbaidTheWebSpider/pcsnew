const Admission = require('../models/Admission');
const Patient = require('../models/Patient');
const Bed = require('../models/Bed');
const User = require('../models/User');

// Helper: Auto-assign Bed
const autoAssignBed = async (department, ward) => {
    let bed = await Bed.findOne({ department, ward, isOccupied: false });
    if (!bed) {
        // Fallback: Create dynamic bed if not found (Prototyping logic)
        const count = await Bed.countDocuments({ ward });
        bed = await Bed.create({
            ward,
            department,
            bedNumber: `${ward}-${count + 1}`,
            isOccupied: false
        });
    }
    return bed;
};

// @desc    Admit a patient (Create/Admit)
// @route   POST /api/staff/admissions
const admitPatient = async (req, res) => {
    try {
        const {
            firstName, lastName, fatherName, gender, dateOfBirth, cnic, phone, address,
            admissionType, admissionReason, department, assignedDoctorId, ward,
            emergencyContactName, emergencyContactRelation, emergencyContactPhone,
            primaryDiagnosis, allergies, bloodGroup
        } = req.body;

        // Comprehensive validation
        const errors = [];

        if (!firstName) errors.push('First name is required');
        if (!lastName) errors.push('Last name is required');
        if (!cnic) errors.push('CNIC is required');
        if (cnic && !/^\d{13}$/.test(cnic)) errors.push('CNIC must be 13 digits');
        if (!phone) errors.push('Phone is required');
        if (!admissionType) errors.push('Admission type is required');
        if (!admissionReason) errors.push('Admission reason is required');
        if (!department) errors.push('Department is required');
        if (!ward) errors.push('Ward is required');
        if (!assignedDoctorId) errors.push('Assigned doctor is required');
        if (!emergencyContactName) errors.push('Emergency contact name is required');
        if (!emergencyContactPhone) errors.push('Emergency contact phone is required');

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'Validation failed',
                errors
            });
        }

        // Find or Create Patient
        let patient = await Patient.findOne({ cnic });
        const name = `${firstName} ${lastName}`;

        if (patient) {
            // Update existing patient
            patient.name = name;
            patient.fatherName = fatherName;
            patient.gender = gender.toLowerCase();
            patient.dateOfBirth = dateOfBirth;
            patient.contact = { ...patient.contact, phone, address };
            patient.emergencyContact = {
                name: emergencyContactName,
                relation: emergencyContactRelation,
                phone: emergencyContactPhone
            };
            patient.bloodGroup = bloodGroup || patient.bloodGroup;
            patient.assignedDoctorId = assignedDoctorId;
            await patient.save();
        } else {
            // Generate patientId before creation
            const patientCount = await Patient.countDocuments();
            const patientId = `P${String(patientCount + 1).padStart(6, '0')}`;

            // Create new patient
            patient = await Patient.create({
                patientId,
                name,
                fatherName,
                cnic,
                gender: gender.toLowerCase(),
                dateOfBirth,
                contact: { phone, address },
                emergencyContact: {
                    name: emergencyContactName,
                    relation: emergencyContactRelation,
                    phone: emergencyContactPhone
                },
                bloodGroup,
                assignedDoctorId
            });
        }

        // Bed Assignment
        const bed = await autoAssignBed(department, ward);
        if (bed.isOccupied) return res.status(400).json({ message: `No available beds in ${ward}` });

        const admission = await Admission.create({
            patientId: patient._id,
            type: admissionType,
            reason: admissionReason,
            department,
            ward,
            bedNumber: bed.bedNumber,
            assignedDoctorId,
            emergencyContact: {
                name: emergencyContactName,
                relation: emergencyContactRelation,
                phone: emergencyContactPhone
            },
            medicalEssentials: {
                primaryDiagnosis,
                allergies: allergies ? allergies.split(',').map(s => s.trim()) : [],
                bloodGroup
            },
            createdBy: req.user._id
        });

        // Update Bed
        bed.isOccupied = true;
        bed.currentPatientId = patient._id;
        await bed.save();

        res.status(201).json({
            success: true,
            message: 'Patient admitted successfully',
            data: {
                admission,
                patient: {
                    id: patient._id,
                    name: patient.name,
                    patientId: patient.patientId
                },
                assignedBed: bed.bedNumber
            }
        });
    } catch (error) {
        console.error('Admission error:', error);

        // Handle specific mongoose errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                message: 'Duplicate entry detected',
                field: Object.keys(error.keyPattern)[0]
            });
        }

        res.status(500).json({
            message: 'Server error during admission',
            error: error.message
        });
    }
};

// @desc    Update Admission Details
// @route   PUT /api/staff/admissions/:id
const updateAdmission = async (req, res) => {
    try {
        const {
            admissionType, admissionReason, department, assignedDoctorId, ward,
            primaryDiagnosis, allergies, bloodGroup, status
        } = req.body;

        const admission = await Admission.findById(req.params.id);
        if (!admission) return res.status(404).json({ message: 'Admission not found' });

        // Update fields
        if (admissionType) admission.type = admissionType;
        if (admissionReason) admission.reason = admissionReason;
        if (assignedDoctorId) admission.assignedDoctorId = assignedDoctorId;
        if (primaryDiagnosis || allergies || bloodGroup) {
            admission.medicalEssentials = {
                primaryDiagnosis: primaryDiagnosis || admission.medicalEssentials.primaryDiagnosis,
                bloodGroup: bloodGroup || admission.medicalEssentials.bloodGroup,
                allergies: allergies ? allergies.split(',').map(s => s.trim()) : admission.medicalEssentials.allergies
            };
        }
        if (status) admission.status = status;

        // Ward/Bed Re-assignment logic is complex (requires freeing old bed, booking new).
        // For simplicity, if ward changes, we should ideally trigger transfer logic. 
        // Skipping complex transfer for this update snippet unless explicitly asked.

        await admission.save();
        res.json({ success: true, data: admission });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Admissions
// @route   GET /api/staff/admissions
const getAdmissions = async (req, res) => {
    try {
        const admissions = await Admission.find()
            .populate('patientId', 'name cnic type')
            .populate('assignedDoctorId', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: admissions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Discharge Patient
// @route   PUT /api/staff/admissions/:id/discharge
const dischargePatient = async (req, res) => {
    try {
        const admission = await Admission.findById(req.params.id);
        if (!admission) return res.status(404).json({ message: 'Admission not found' });

        if (admission.status === 'Discharged') return res.status(400).json({ message: 'Already discharged' });

        const bed = await Bed.findOne({ bedNumber: admission.bedNumber, isOccupied: true });
        if (bed) {
            bed.isOccupied = false;
            bed.currentPatientId = null;
            await bed.save();
        }

        admission.status = 'Discharged';
        admission.dischargeDate = Date.now();
        await admission.save();

        res.json({ success: true, data: admission });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    admitPatient,
    updateAdmission,
    getAdmissions,
    dischargePatient
};
