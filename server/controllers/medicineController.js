const MasterMedicine = require('../models/MasterMedicine');
const MasterMedicineBatch = require('../models/MasterMedicineBatch');
const StockMovement = require('../models/StockMovement');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');

// @desc    Add new medicine entry (Legacy wrapper)
// @route   POST /api/medicines
// @access  Private/Pharmacy
const addMedicine = async (req, res) => {
    try {
        const { name, genericName, manufacturer, category, strength, form, price, reorderLevel, barcode } = req.body;
        const pharmacyId = req.pharmacyId || req.user._id;

        // In the new system, we add to MasterMedicine if it doesn't exist
        // or just link to it. For this legacy wrapper, we'll create a MasterMedicine entry.
        let medicine = await MasterMedicine.findOne({ name, manufacturer, strength, form });

        if (!medicine) {
            medicine = await MasterMedicine.create({
                name,
                genericName,
                manufacturer,
                category,
                strength,
                dosageForm: form,
                unitPrice: price,
                reorderLevel,
                barcode,
                createdBy: req.user._id
            });
        }

        res.status(201).json({ success: true, data: medicine });
    } catch (error) {
        console.error('Add medicine legacy error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all medicines (Legacy wrapper)
// @route   GET /api/medicines
// @access  Private/Pharmacy
const getMedicines = async (req, res) => {
    try {
        const { search } = req.query;
        const pharmacyId = req.pharmacyId || req.user._id;

        // This is tricky because the legacy system showed "Your Medicines"
        // The new system shows "Master Medicines" + "Your Batches".
        // For compatibility, we'll search Master Medicines and join them with Pharmacy Batches.

        let query = { isActive: true };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { genericName: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        const masterMedicines = await MasterMedicine.find(query).sort({ name: 1 });
        const medicineIds = masterMedicines.map(m => m._id);

        const batches = await MasterMedicineBatch.find({
            masterMedicineId: { $in: medicineIds },
            pharmacyId,
            isDeleted: false
        });

        const transformed = masterMedicines.map(med => {
            const medObj = med.toObject();
            medObj.batches = batches
                .filter(b => b.masterMedicineId.toString() === med._id.toString())
                .map(b => ({
                    batchNo: b.batchNumber,
                    quantity: b.quantity,
                    mfgDate: b.manufacturingDate,
                    expDate: b.expiryDate,
                    supplierCost: b.purchasePrice,
                    status: b.status,
                    _id: b._id
                }));
            return medObj;
        });

        res.json({ success: true, data: transformed });
    } catch (error) {
        console.error('Get medicines legacy error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get medicine by ID (Legacy wrapper)
const getMedicineById = async (req, res) => {
    try {
        const medicine = await MasterMedicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        const pharmacyId = req.pharmacyId || req.user._id;
        const batches = await MasterMedicineBatch.find({
            masterMedicineId: medicine._id,
            pharmacyId,
            isDeleted: false
        });

        const medObj = medicine.toObject();
        medObj.batches = batches.map(b => ({
            batchNo: b.batchNumber,
            quantity: b.quantity,
            mfgDate: b.manufacturingDate,
            expDate: b.expiryDate,
            supplierCost: b.purchasePrice,
            status: b.status,
            _id: b._id
        }));

        res.json(medObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update medicine (Legacy wrapper)
const updateMedicine = async (req, res) => {
    try {
        const updated = await MasterMedicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete medicine (Legacy wrapper)
const deleteMedicine = async (req, res) => {
    try {
        const medicine = await MasterMedicine.findById(req.params.id);
        if (!medicine) return res.status(404).json({ success: false, message: 'Not found' });

        medicine.isActive = false;
        await medicine.save();
        res.json({ success: true, message: 'Medicine deactivated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get low stock (Legacy wrapper)
const getLowStock = async (req, res) => {
    try {
        const pharmacyId = req.pharmacyId || req.user._id;

        const lowStockBatches = await MasterMedicineBatch.find({
            pharmacyId,
            isDeleted: false,
            status: 'low_stock'
        }).populate('masterMedicineId');

        // Group by medicine
        const medicinesMap = new Map();
        lowStockBatches.forEach(batch => {
            if (!batch.masterMedicineId) return;
            const medId = batch.masterMedicineId._id.toString();
            if (!medicinesMap.has(medId)) {
                medicinesMap.set(medId, {
                    ...batch.masterMedicineId.toObject(),
                    batches: []
                });
            }
            medicinesMap.get(medId).batches.push({
                batchNo: batch.batchNumber,
                quantity: batch.quantity,
                expDate: batch.expiryDate,
                status: batch.status
            });
        });

        res.json(Array.from(medicinesMap.values()));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get expiring (Legacy wrapper)
const getExpiring = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + parseInt(days));

        const pharmacyId = req.pharmacyId || req.user._id;

        const expiringBatches = await MasterMedicineBatch.find({
            pharmacyId,
            expiryDate: { $lte: targetDate, $gt: new Date() },
            isDeleted: false
        }).populate('masterMedicineId');

        const medicinesMap = new Map();
        expiringBatches.forEach(batch => {
            if (!batch.masterMedicineId) return;
            const medId = batch.masterMedicineId._id.toString();
            if (!medicinesMap.has(medId)) {
                medicinesMap.set(medId, {
                    ...batch.masterMedicineId.toObject(),
                    batches: []
                });
            }
            medicinesMap.get(medId).batches.push({
                batchNo: batch.batchNumber,
                quantity: batch.quantity,
                expDate: batch.expiryDate,
                status: batch.status
            });
        });

        res.json(Array.from(medicinesMap.values()));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add batch (Legacy wrapper)
const addBatch = async (req, res) => {
    try {
        const { batchNo, quantity, mfgDate, expDate, supplierCost, status } = req.body;
        const pharmacyId = req.pharmacyId || req.user._id;

        const batch = await MasterMedicineBatch.create({
            masterMedicineId: req.params.id,
            pharmacyId,
            batchNumber: batchNo,
            quantity: parseInt(quantity),
            manufacturingDate: mfgDate,
            expiryDate: expDate,
            purchasePrice: parseFloat(supplierCost) || 0,
            mrp: 0, // Should be fetched from medicine or passed
            status: status?.toLowerCase() || 'available',
            supplierId: "60d0fe4f5311236168a109ca", // Dummy
            createdBy: req.user._id
        });

        res.status(201).json({ success: true, data: batch });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addMedicine,
    getMedicines,
    getMedicineById,
    updateMedicine,
    deleteMedicine,
    getLowStock,
    getExpiring,
    addBatch,
};
