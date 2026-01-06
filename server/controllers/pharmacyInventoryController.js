const MedicineBatch = require('../models/MasterMedicineBatch');
const Medicine = require('../models/MasterMedicine');
const Supplier = require('../models/Supplier');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');

// @desc    Get all medicine batches
// @route   GET /api/pharmacy/inventory/batches
// @access  Private
exports.getAllBatches = async (req, res) => {
    try {
        const { status, expiring, lowStock, search } = req.query;

        const query = {
            pharmacyId: req.pharmacyId,
            isDeleted: false
        };

        if (status) query.status = status;

        // If searching, find medicines first
        if (search) {
            const medicines = await Medicine.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { genericName: { $regex: search, $options: 'i' } }
                ],
                // Master medicine is global, no pharmacyId on the model itself
                isActive: true
            }).select('_id');

            const medIds = medicines.map(m => m._id);

            query.$or = [
                { masterMedicineId: { $in: medIds } },
                { batchNumber: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter expiring batches (within 30 days)
        if (expiring === 'true') {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            query.expiryDate = {
                $lte: thirtyDaysFromNow,
                $gt: new Date()
            };
        }

        const batches = await MedicineBatch.find(query)
            .populate('masterMedicineId', 'name genericName category form strength price taxRate manufacturer')
            .populate('supplierId', 'supplierName contactPerson')
            .sort({ expiryDate: 1 });

        // Transform results to maintain medicineId field for frontend compatibility
        const transformedBatches = batches.map(batch => {
            const b = batch.toObject({ virtuals: true });
            b.medicineId = b.masterMedicineId;
            delete b.masterMedicineId;
            return b;
        });

        // Filter low stock if requested
        let filteredBatches = transformedBatches;
        if (lowStock === 'true') {
            filteredBatches = transformedBatches.filter(batch => batch.isLowStock);
        }

        res.json({
            success: true,
            count: filteredBatches.length,
            data: filteredBatches
        });
    } catch (error) {
        console.error('Get batches error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching batches',
            error: error.message
        });
    }
};

// @desc    Add new medicine batch
// @route   POST /api/pharmacy/inventory/batches
// @access  Private (Inventory Manager, Pharmacy Admin)
exports.addBatch = async (req, res) => {
    try {
        const {
            medicineId,
            batchNumber,
            quantity,
            purchasePrice,
            mrp,
            supplierId,
            manufacturingDate,
            expiryDate,
            barcode,
            isControlledDrug,
            reorderLevel
        } = req.body;

        // Validate medicine exists
        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found'
            });
        }

        // Create batch
        const batch = await MedicineBatch.create({
            masterMedicineId: medicineId,
            pharmacyId: req.pharmacyId,
            batchNumber,
            quantity,
            purchasePrice,
            mrp,
            supplierId,
            manufacturingDate,
            expiryDate,
            barcode,
            isControlledDrug,
            reorderLevel,
            createdBy: req.user._id
        });

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'create',
            entity: 'batch',
            entityId: batch._id,
            description: `Added new batch ${batchNumber} for ${medicine.name}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json({
            success: true,
            message: 'Batch added successfully',
            data: batch
        });
    } catch (error) {
        console.error('Add batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding batch',
            error: error.message
        });
    }
};

// @desc    Adjust stock
// @route   PUT /api/pharmacy/inventory/batches/:id/adjust
// @access  Private (Inventory Manager, Pharmacy Admin)
exports.adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { adjustment, reason } = req.body; // adjustment can be positive or negative

        const batch = await MedicineBatch.findById(id);
        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Batch not found'
            });
        }

        const oldQuantity = batch.quantity;

        if (adjustment > 0) {
            await batch.addStock(adjustment);
        } else {
            await batch.deductStock(Math.abs(adjustment));
        }

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'adjust_stock',
            entity: 'batch',
            entityId: batch._id,
            changes: {
                before: { quantity: oldQuantity },
                after: { quantity: batch.quantity }
            },
            description: `Stock adjusted: ${oldQuantity} → ${batch.quantity}. Reason: ${reason}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            success: true,
            message: 'Stock adjusted successfully',
            data: batch
        });
    } catch (error) {
        console.error('Adjust stock error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error adjusting stock'
        });
    }
};

// @desc    Get expiring medicines
// @route   GET /api/pharmacy/inventory/expiring
// @access  Private
exports.getExpiringMedicines = async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + parseInt(days));

        const expiringBatches = await MedicineBatch.find({
            pharmacyId: req.pharmacyId,
            expiryDate: {
                $lte: targetDate,
                $gt: new Date()
            },
            isDeleted: false,
            status: { $ne: 'expired' }
        })
            .populate('masterMedicineId', 'name genericName category taxRate')
            .sort({ expiryDate: 1 });

        const transformedBatches = expiringBatches.map(batch => {
            const b = batch.toObject({ virtuals: true });
            b.medicineId = b.masterMedicineId;
            delete b.masterMedicineId;
            return b;
        });

        res.json({
            success: true,
            count: transformedBatches.length,
            data: transformedBatches
        });
    } catch (error) {
        console.error('Get expiring medicines error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expiring medicines'
        });
    }
};

// @desc    Get low stock items
// @route   GET /api/pharmacy/inventory/low-stock
// @access  Private
exports.getLowStockItems = async (req, res) => {
    try {
        const batches = await MedicineBatch.find({
            pharmacyId: req.pharmacyId,
            isDeleted: false,
            status: { $in: ['available', 'low_stock'] }
        })
            .populate('masterMedicineId', 'name genericName category taxRate');

        const transformedBatches = batches.map(batch => {
            const b = batch.toObject({ virtuals: true });
            b.medicineId = b.masterMedicineId;
            delete b.masterMedicineId;
            return b;
        });

        const lowStockBatches = transformedBatches.filter(batch => batch.isLowStock);

        res.json({
            success: true,
            count: lowStockBatches.length,
            data: lowStockBatches
        });
    } catch (error) {
        console.error('Get low stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock items'
        });
    }
};

// @desc    Search medicine by barcode
// @route   GET /api/pharmacy/inventory/barcode/:barcode
// @access  Private
exports.searchByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;

        const batch = await MedicineBatch.findOne({
            barcode,
            pharmacyId: req.pharmacyId,
            isDeleted: false
        }).populate('masterMedicineId', 'name genericName category form strength price taxRate manufacturer');

        if (!batch) {
            return res.status(404).json({
                success: false,
                message: 'Medicine not found with this barcode'
            });
        }

        const transformedBatch = batch.toObject({ virtuals: true });
        transformedBatch.medicineId = transformedBatch.masterMedicineId;
        delete transformedBatch.masterMedicineId;

        res.json({
            success: true,
            data: transformedBatch
        });
    } catch (error) {
        console.error('Barcode search error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching by barcode'
        });
    }
};
