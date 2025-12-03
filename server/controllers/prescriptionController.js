const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');

// @desc    Create prescription (by doctor)
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
    try {
        const { patientId, appointmentId, medicines, notes, assignedPharmacyId, deliveryType } = req.body;

        const prescription = await Prescription.create({
            patientId,
            doctorId: req.user._id,
            hospitalId: req.user.hospitalId,
            appointmentId,
            medicines,
            notes,
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

// @desc    Get prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private
const getPrescriptionById = async (req, res) => {
    try {
        const prescription = await Prescription.findById(req.params.id)
            .populate('patientId', 'name email contact')
            .populate('doctorId', 'name specialization')
            .populate('processedBy', 'name');

        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        res.json(prescription);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

module.exports = {
    createPrescription,
    getPrescriptionQueue,
    getPrescriptionById,
    processPrescription,
    updatePrescriptionStatus,
};
