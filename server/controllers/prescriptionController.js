const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const Patient = require('../models/Patient');
const StaffPatient = require('../models/StaffPatient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

// @desc    Create prescription (by doctor)
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
    try {
        const { patientId, appointmentId, medicines, diagnosis, notes, labTests, followUpDate, assignedPharmacyId, deliveryType } = req.body;

        const prescription = await Prescription.create({
            patientId,
            doctorId: req.user._id,
            hospitalId: req.user.hospitalId,
            appointmentId,
            medicines,
            diagnosis,
            notes,
            labTests,
            followUpDate,
            assignedPharmacyId,
            deliveryType,
        });

        const populated = await Prescription.findById(prescription._id)
            .populate('patientId', 'name email contact')
            .populate('doctorId', 'name specialization');

        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescription queue for pharmacy
// @route   GET /api/prescriptions/queue
// @access  Private/Pharmacy
const getPrescriptionQueue = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        const prescriptions = await Prescription.find({
            assignedPharmacyId: req.user._id,
            status,
        })
            .populate('patientId', 'name email contact')
            .populate('doctorId', 'name specialization')
            .sort({ createdAt: -1 });

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper to resolve patient details from multiple collections
const resolvePatient = async (id) => {
    if (!id) return null;

    // 1. Try Patient Collection
    let patient = await Patient.findById(id);
    if (patient) return {
        _id: patient._id,
        name: patient.name,
        email: patient.contact?.email,
        contact: patient.contact?.phone,
        gender: patient.gender,
        healthId: patient.patientId || patient.healthId,
        age: patient.age
    };

    // 2. Try StaffPatient Collection
    let staffPatient = await StaffPatient.findById(id);
    if (staffPatient) return {
        _id: staffPatient._id,
        name: staffPatient.personalInfo.fullName,
        email: staffPatient.contactInfo.email,
        contact: staffPatient.contactInfo.mobileNumber,
        gender: staffPatient.personalInfo.gender,
        healthId: staffPatient.patientId || staffPatient.healthId,
        age: staffPatient.personalInfo.dateOfBirth ? Math.floor((new Date() - new Date(staffPatient.personalInfo.dateOfBirth)) / 31557600000) : 'N/A'
    };

    // 3. Try User Collection (Fallback)
    let user = await User.findById(id);
    if (user) return {
        _id: user._id,
        name: user.name,
        email: user.email,
        contact: user.contact?.phone,
        gender: user.gender,
        healthId: user.healthId,
        age: user.dateOfBirth ? Math.floor((new Date() - new Date(user.dateOfBirth)) / 31557600000) : 'N/A'
    };

    return null;
};

// @desc    Get prescriptions by doctor
// @route   GET /api/prescriptions/doctor
// @access  Private/Doctor
const getDoctorPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({ doctorId: req.user._id })
            .sort({ createdAt: -1 });

        // Manually populate patients since they can be from different collections
        const populatedPrescriptions = await Promise.all(prescriptions.map(async (p) => {
            const patient = await resolvePatient(p.patientId);
            const doc = p.toObject();
            doc.patientId = patient || { name: 'Unknown Patient', healthId: 'N/A' };
            return doc;
        }));

        res.json({
            success: true,
            count: populatedPrescriptions.length,
            data: populatedPrescriptions
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
    try {
        let id = req.params.id;
        if (!id) return res.status(400).json({ message: 'No ID provided' });

        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // 1. Resolve Patient
        const patient = await resolvePatient(prescription.patientId);

        // 2. Resolve Doctor (User + Doctor Profile)
        const doctorUser = await User.findById(prescription.doctorId);
        const doctorProfile = await Doctor.findOne({ userId: prescription.doctorId });

        const doctorDetails = {
            _id: prescription.doctorId,
            name: doctorUser ? doctorUser.name : 'Unknown Doctor',
            specialization: doctorProfile ? doctorProfile.professionalDetails.qualification : (doctorUser.specialization || 'General Physician'),
            licenseNumber: doctorProfile ? doctorProfile.professionalDetails.licenseNumber : 'N/A',
            signatureUrl: doctorProfile ? doctorProfile.signatureUrl : null
        };

        const responseData = {
            ...prescription.toObject(),
            patientId: patient || { name: 'Unknown Patient', healthId: 'N/A' },
            doctorId: doctorDetails
        };

        res.json(responseData);
    } catch (error) {
        console.error(`[ERROR] getPrescriptionById:`, error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
};

// @desc    Process prescription
// @route   PUT /api/prescriptions/:id/process
// @access  Private/Pharmacy
const processPrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        if (prescription.assignedPharmacyId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        prescription.status = 'processing';
        prescription.processedBy = req.user._id;
        prescription.processedAt = Date.now();

        await prescription.save();

        const populated = await Prescription.findById(prescription._id)
            .populate('patientId', 'name email contact')
            .populate('doctorId', 'name specialization')
            .populate('processedBy', 'name');

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update prescription status
// @route   PUT /api/prescriptions/:id/status
// @access  Private/Pharmacy
const updatePrescriptionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        prescription.status = status;
        await prescription.save();

        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update prescription
// @route   PUT /api/prescriptions/:id
// @access  Private/Doctor
const updatePrescription = async (req, res) => {
    try {
        const { medicines, diagnosis, notes, labTests, followUpDate } = req.body;
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Verify ownership
        if (prescription.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to edit this prescription' });
        }

        prescription.medicines = medicines || prescription.medicines;
        prescription.diagnosis = diagnosis || prescription.diagnosis;
        prescription.notes = notes || prescription.notes;
        prescription.labTests = labTests || prescription.labTests;
        prescription.followUpDate = followUpDate || prescription.followUpDate;

        const updatedPrescription = await prescription.save();

        const populated = await Prescription.findById(updatedPrescription._id)
            .populate('patientId', 'name email contact')
            .populate('doctorId', 'name specialization');

        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete prescription
// @route   DELETE /api/prescriptions/:id
// @access  Private/Doctor
const deletePrescription = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id);

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        // Verify ownership
        if (prescription.doctorId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to delete this prescription' });
        }

        await prescription.deleteOne();

        res.json({ message: 'Prescription removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPrescription,
    getPrescriptionQueue,
    getPrescriptionById,
    processPrescription,
    updatePrescriptionStatus,
    getDoctorPrescriptions,
    updatePrescription,
    deletePrescription,
};
