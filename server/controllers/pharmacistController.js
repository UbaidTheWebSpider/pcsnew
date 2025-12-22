const Pharmacist = require('../models/Pharmacist');
const User = require('../models/User');

// @desc    Create a new Pharmacist
// @route   POST /api/pharmacists
// @access  Admin
const createPharmacist = async (req, res) => {
    try {
        const { contact, professionalDetails } = req.body;

        // Check for existing email or registration number
        const existingEmail = await Pharmacist.findOne({ 'contact.email': contact.email, isDeleted: false });
        if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const existingReg = await Pharmacist.findOne({ 'professionalDetails.registrationNumber': professionalDetails.registrationNumber, isDeleted: false });
        if (existingReg) {
            return res.status(400).json({ message: 'Registration number already exists' });
        }

        const pharmacist = await Pharmacist.create({
            ...req.body,
            createdBy: req.user._id
        });

        res.status(201).json(pharmacist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all Pharmacists
// @route   GET /api/pharmacists
// @access  Admin/Pharmacy Admin
const getPharmacists = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, employmentType } = req.query;
        const query = { isDeleted: false };

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { pharmacistId: { $regex: search, $options: 'i' } },
                { 'professionalDetails.registrationNumber': { $regex: search, $options: 'i' } }
            ];
        }

        if (status) query['assignment.status'] = status;
        if (employmentType) query['assignment.employmentType'] = employmentType;

        const count = await Pharmacist.countDocuments(query);
        const pharmacists = await Pharmacist.find(query)
            .populate('assignment.assignedPharmacy', 'basicProfile.pharmacyName')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        res.json({
            pharmacists,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalRecords: count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Pharmacist by ID
// @route   GET /api/pharmacists/:id
// @access  Admin/Pharmacy Admin/Pharmacist
const getPharmacistById = async (req, res) => {
    try {
        const pharmacist = await Pharmacist.findOne({ _id: req.params.id, isDeleted: false })
            .populate('assignment.assignedPharmacy');

        if (!pharmacist) {
            return res.status(404).json({ message: 'Pharmacist not found' });
        }

        res.json(pharmacist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Pharmacist
// @route   PUT /api/pharmacists/:id
// @access  Admin
const updatePharmacist = async (req, res) => {
    try {
        const pharmacist = await Pharmacist.findOne({ _id: req.params.id, isDeleted: false });

        if (!pharmacist) {
            return res.status(404).json({ message: 'Pharmacist not found' });
        }

        const updatedPharmacist = await Pharmacist.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedPharmacist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Soft Delete Pharmacist
// @route   DELETE /api/pharmacists/:id
// @access  Admin
const deletePharmacist = async (req, res) => {
    try {
        const pharmacist = await Pharmacist.findById(req.params.id);

        if (!pharmacist) {
            return res.status(404).json({ message: 'Pharmacist not found' });
        }

        pharmacist.isDeleted = true;
        pharmacist.assignment.status = 'Inactive';
        await pharmacist.save();

        res.json({ message: 'Pharmacist removed successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPharmacist,
    getPharmacists,
    getPharmacistById,
    updatePharmacist,
    deletePharmacist
};
