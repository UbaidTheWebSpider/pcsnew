const MasterMedicine = require('../models/MasterMedicine');
const MasterMedicineBatch = require('../models/MasterMedicineBatch');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');

// @desc    Get all master medicines with pagination and filtering
// @route   GET /api/master-medicines
// @access  Private
exports.getAllMedicines = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 5,
            search = '',
            manufacturer = '',
            genericName = '',
            category = '',
            dosageForm = '',
            isControlledSubstance,
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            search,
            manufacturer,
            genericName,
            category,
            dosageForm,
            isControlledSubstance: isControlledSubstance === 'true' ? true : isControlledSubstance === 'false' ? false : undefined,
            sortBy,
            sortOrder
        };

        const result = await MasterMedicine.searchWithPagination(null, options);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Get all medicines error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medicines',
            error: error.message
        });
    }
};

// @desc    Get single master medicine by ID
// @route   GET /api/master-medicines/:id
// @access  Private
exports.getMedicineById = async (req, res) => {
    try {
        const { id } = req.params;

        const medicine = await MasterMedicine.findById(id).select('-drapDataHash -__v');

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        res.json({
            success: true,
            data: medicine
        });
    } catch (error) {
        console.error('Get medicine by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching medicine',
            error: error.message
        });
    }
};

// @desc    Search medicines with full-text search
// @route   GET /api/master-medicines/search
// @access  Private
exports.searchMedicines = async (req, res) => {
    try {
        const {
            q = '',
            page = 1,
            limit = 5,
            category = '',
            manufacturer = '',
            sortBy = 'name',
            sortOrder = 'asc'
        } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            search: q,
            category,
            manufacturer,
            sortBy,
            sortOrder
        };

        const result = await MasterMedicine.searchWithPagination(null, options);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Search medicines error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching medicines',
            error: error.message
        });
    }
};

// @desc    Get filter options
// @route   GET /api/master-medicines/filters
// @access  Private
exports.getFilters = async (req, res) => {
    try {
        const filters = await MasterMedicine.getFilterOptions();

        res.json({
            success: true,
            data: filters
        });
    } catch (error) {
        console.error('Get filters error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching filter options',
            error: error.message
        });
    }
};

// @desc    Get batches for a specific master medicine
// @route   GET /api/master-medicines/:id/batches
// @access  Private
exports.getBatchesByMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const { pharmacyId, status, expiring } = req.query;

        // Verify medicine exists
        const medicine = await MasterMedicine.findById(id);
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        const query = {
            masterMedicineId: id,
            isDeleted: false
        };

        // Add pharmacy filter if provided
        if (pharmacyId) {
            query.pharmacyId = pharmacyId;
        }

        // Add status filter
        if (status) {
            query.status = status;
        }

        // Add expiring filter (within 30 days)
        if (expiring === 'true') {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            query.expiryDate = {
                $lte: thirtyDaysFromNow,
                $gt: new Date()
            };
        }

        const batches = await MasterMedicineBatch.find(query)
            .populate('pharmacyId', 'basicProfile.pharmacyName basicProfile.pharmacyCode')
            .populate('supplierId', 'supplierName contactPerson')
            .sort({ expiryDate: 1 });

        res.json({
            success: true,
            count: batches.length,
            data: batches
        });
    } catch (error) {
        console.error('Get batches by medicine error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching batches',
            error: error.message
        });
    }
};

// @desc    Create new master medicine (Admin only)
// @route   POST /api/master-medicines
// @access  Private (Admin, Super Admin)
exports.createMedicine = async (req, res) => {
    try {
        const {
            name,
            genericName,
            brandName,
            category,
            therapeuticClass,
            pharmacologicalClass,
            manufacturer,
            manufacturerCountry,
            strength,
            dosageForm,
            packSize,
            route,
            barcode,
            drapRegistrationNumber,
            ndc,
            unitPrice,
            currency,
            isControlledSubstance,
            controlledSubstanceSchedule,
            prescriptionRequired,
            drapApproved,
            approvalDate,
            description,
            activeIngredients,
            contraindications,
            sideEffects,
            storageConditions
        } = req.body;

        // Check for duplicate
        const existingMedicine = await MasterMedicine.findOne({
            name,
            manufacturer,
            strength,
            dosageForm
        });

        if (existingMedicine) {
            return res.status(400).json({
                success: false,
                message: 'Medicine with same name, manufacturer, strength, and form already exists'
            });
        }

        // Create medicine
        const medicine = await MasterMedicine.create({
            name,
            genericName,
            brandName,
            category,
            therapeuticClass,
            pharmacologicalClass,
            manufacturer,
            manufacturerCountry,
            strength,
            dosageForm,
            packSize,
            route,
            barcode,
            drapRegistrationNumber,
            ndc,
            unitPrice,
            currency,
            isControlledSubstance,
            controlledSubstanceSchedule,
            prescriptionRequired,
            drapApproved,
            approvalDate,
            description,
            activeIngredients,
            contraindications,
            sideEffects,
            storageConditions,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Master medicine created successfully',
            data: medicine
        });
    } catch (error) {
        console.error('Create medicine error:', error);

        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Medicine with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating medicine',
            error: error.message
        });
    }
};

// @desc    Update master medicine (Admin only)
// @route   PUT /api/master-medicines/:id
// @access  Private (Admin, Super Admin)
exports.updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Find existing medicine
        const medicine = await MasterMedicine.findById(id);
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        // Store old data for audit
        const oldData = medicine.toObject();

        // Update fields
        updateData.updatedBy = req.user._id;

        // Update medicine
        const updatedMedicine = await MasterMedicine.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // Create audit log
        if (req.pharmacyId) {
            await PharmacyAuditLog.createLog({
                pharmacyId: req.pharmacyId,
                userId: req.user._id,
                userName: req.user.name,
                action: 'update',
                entity: 'master_medicine',
                entityId: id,
                changes: {
                    before: oldData,
                    after: updatedMedicine.toObject()
                },
                description: `Updated master medicine: ${medicine.name}`,
                metadata: {
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent')
                }
            });
        }

        res.json({
            success: true,
            message: 'Master medicine updated successfully',
            data: updatedMedicine
        });
    } catch (error) {
        console.error('Update medicine error:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Medicine with this ${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating medicine',
            error: error.message
        });
    }
};

// @desc    Discontinue master medicine (Admin only)
// @route   PUT /api/master-medicines/:id/discontinue
// @access  Private (Admin, Super Admin)
exports.discontinueMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const medicine = await MasterMedicine.findById(id);
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        medicine.isDiscontinued = true;
        medicine.discontinuedDate = new Date();
        medicine.discontinuedReason = reason;
        medicine.isActive = false;
        medicine.updatedBy = req.user._id;

        await medicine.save();

        res.json({
            success: true,
            message: 'Medicine discontinued successfully',
            data: medicine
        });
    } catch (error) {
        console.error('Discontinue medicine error:', error);
        res.status(500).json({
            success: false,
            message: 'Error discontinuing medicine',
            error: error.message
        });
    }
};

// @desc    Get medicine statistics
// @route   GET /api/master-medicines/stats
// @access  Private
exports.getMedicineStats = async (req, res) => {
    try {
        const [
            totalMedicines,
            activeMedicines,
            discontinuedMedicines,
            controlledSubstances,
            drapApprovedCount,
            categoryCounts
        ] = await Promise.all([
            MasterMedicine.countDocuments(),
            MasterMedicine.countDocuments({ isActive: true, isDiscontinued: false }),
            MasterMedicine.countDocuments({ isDiscontinued: true }),
            MasterMedicine.countDocuments({ isControlledSubstance: true }),
            MasterMedicine.countDocuments({ drapApproved: true }),
            MasterMedicine.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalMedicines,
                activeMedicines,
                discontinuedMedicines,
                controlledSubstances,
                drapApprovedCount,
                categoryCounts
            }
        });
    } catch (error) {
        console.error('Get medicine stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
