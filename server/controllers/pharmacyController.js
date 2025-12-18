const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');

// Generate unique pharmacy code
const generatePharmacyCode = async (req, res) => {
    try {
        const prefix = 'PH';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const code = `${prefix}${timestamp}${random}`;

        // Check if code already exists
        const existing = await Pharmacy.findOne({ 'basicProfile.pharmacyCode': code });
        if (existing) {
            return generatePharmacyCode(req, res); // Regenerate if duplicate
        }

        res.json({ code });
    } catch (error) {
        res.status(500).json({ message: 'Error generating pharmacy code', error: error.message });
    }
};

// Create new pharmacy
const createPharmacy = async (req, res) => {
    try {
        const userId = req.user.id;

        // Validate chief pharmacist exists
        if (req.body.assignedPharmacist?.chiefPharmacist) {
            const pharmacist = await User.findById(req.body.assignedPharmacist.chiefPharmacist);
            if (!pharmacist) {
                return res.status(400).json({ message: 'Chief pharmacist not found' });
            }
        }

        // Create pharmacy with registered by user
        const pharmacyData = {
            ...req.body,
            approvalWorkflow: {
                ...req.body.approvalWorkflow,
                registeredBy: userId,
                registrationDate: new Date()
            }
        };

        const pharmacy = new Pharmacy(pharmacyData);

        // Add audit log entry
        pharmacy.addAuditLog('CREATED', userId, 'Pharmacy registration initiated');

        await pharmacy.save();

        res.status(201).json({
            message: 'Pharmacy created successfully',
            pharmacy
        });
    } catch (error) {
        console.error('Error creating pharmacy:', error);

        // Handle Duplicate Key Error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                message: `Pharmacy with this ${field} already exists`
            });
        }

        // Handle Mongoose Validation Error
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: 'Validation Error',
                errors: messages
            });
        }

        res.status(500).json({
            message: 'Error creating pharmacy',
            error: error.message
        });
    }
};

// Get all pharmacies with filtering
const getAllPharmacies = async (req, res) => {
    try {
        const {
            status,
            type,
            branch,
            approvalStatus,
            search
        } = req.query;

        let query = {};

        if (status) {
            query['basicProfile.operationalStatus'] = status;
        }
        if (type) {
            query['basicProfile.pharmacyType'] = type;
        }
        if (branch) {
            query['basicProfile.hospitalBranch'] = branch;
        }
        if (approvalStatus) {
            query['approvalWorkflow.approvalStatus'] = approvalStatus;
        }
        if (search) {
            query.$or = [
                { 'basicProfile.pharmacyName': { $regex: search, $options: 'i' } },
                { 'basicProfile.pharmacyCode': { $regex: search, $options: 'i' } },
                { 'licensing.licenseNumber': { $regex: search, $options: 'i' } }
            ];
        }

        const pharmacies = await Pharmacy.find(query)
            .populate('assignedPharmacist.chiefPharmacist', 'name email')
            .populate('assignedPharmacist.backupPharmacist', 'name email')
            .populate('approvalWorkflow.registeredBy', 'name email')
            .populate('approvalWorkflow.approvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(pharmacies);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching pharmacies',
            error: error.message
        });
    }
};

// Get pharmacy by ID
const getPharmacyById = async (req, res) => {
    try {
        const pharmacy = await Pharmacy.findById(req.params.id)
            .populate('assignedPharmacist.chiefPharmacist', 'name email contact profile')
            .populate('assignedPharmacist.backupPharmacist', 'name email contact')
            .populate('approvalWorkflow.registeredBy', 'name email')
            .populate('approvalWorkflow.approvedBy', 'name email')
            .populate('auditLog.performedBy', 'name email');

        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        res.json(pharmacy);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching pharmacy',
            error: error.message
        });
    }
};

// Update pharmacy
const updatePharmacy = async (req, res) => {
    try {
        const userId = req.user.id;
        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        // Update pharmacy data
        Object.keys(req.body).forEach(key => {
            if (key !== 'approvalWorkflow' && key !== 'auditLog') {
                pharmacy[key] = req.body[key];
            }
        });

        // Add audit log entry
        pharmacy.addAuditLog('UPDATED', userId, 'Pharmacy information updated');

        await pharmacy.save();

        res.json({
            message: 'Pharmacy updated successfully',
            pharmacy
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating pharmacy',
            error: error.message
        });
    }
};

// Update approval status
const updateApprovalStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { approvalStatus, remarks, rejectionReason } = req.body;

        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        pharmacy.approvalWorkflow.approvalStatus = approvalStatus;
        pharmacy.approvalWorkflow.remarks = remarks;

        if (approvalStatus === 'Approved') {
            pharmacy.approvalWorkflow.approvedBy = userId;
            pharmacy.approvalWorkflow.approvalDate = new Date();
            pharmacy.approvalWorkflow.activationDate = new Date();
            pharmacy.basicProfile.operationalStatus = 'Active';
            pharmacy.addAuditLog('APPROVED', userId, 'Pharmacy approved and activated');
        } else if (approvalStatus === 'Rejected') {
            pharmacy.approvalWorkflow.rejectionReason = rejectionReason;
            pharmacy.addAuditLog('REJECTED', userId, `Pharmacy rejected: ${rejectionReason}`);
        } else if (approvalStatus === 'Submitted') {
            pharmacy.addAuditLog('SUBMITTED', userId, 'Pharmacy submitted for approval');
        }

        await pharmacy.save();

        res.json({
            message: `Pharmacy ${approvalStatus.toLowerCase()} successfully`,
            pharmacy
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error updating approval status',
            error: error.message
        });
    }
};

// Delete pharmacy (soft delete)
const deletePharmacy = async (req, res) => {
    try {
        const userId = req.user.id;
        const pharmacy = await Pharmacy.findById(req.params.id);

        if (!pharmacy) {
            return res.status(404).json({ message: 'Pharmacy not found' });
        }

        // Add audit log before deletion
        pharmacy.addAuditLog('DELETED', userId, 'Pharmacy deleted');
        await pharmacy.save();

        // Perform actual deletion
        await Pharmacy.findByIdAndDelete(req.params.id);

        res.json({ message: 'Pharmacy deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting pharmacy',
            error: error.message
        });
    }
};

// Check pharmacy name uniqueness
const checkPharmacyNameUnique = async (req, res) => {
    try {
        const { name, excludeId } = req.query;

        let query = { 'basicProfile.pharmacyName': name };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existing = await Pharmacy.findOne(query);

        res.json({ isUnique: !existing });
    } catch (error) {
        res.status(500).json({
            message: 'Error checking pharmacy name',
            error: error.message
        });
    }
};

// Get pharmacy statistics
const getPharmacyStats = async (req, res) => {
    try {
        const total = await Pharmacy.countDocuments();
        const active = await Pharmacy.countDocuments({ 'basicProfile.operationalStatus': 'Active' });
        const pending = await Pharmacy.countDocuments({ 'approvalWorkflow.approvalStatus': 'Submitted' });
        const draft = await Pharmacy.countDocuments({ 'approvalWorkflow.approvalStatus': 'Draft' });

        res.json({
            total,
            active,
            inactive: total - active,
            pending,
            draft
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching pharmacy statistics',
            error: error.message
        });
    }
};

module.exports = {
    generatePharmacyCode,
    createPharmacy,
    getAllPharmacies,
    getPharmacyById,
    updatePharmacy,
    updateApprovalStatus,
    deletePharmacy,
    checkPharmacyNameUnique,
    getPharmacyStats
};
