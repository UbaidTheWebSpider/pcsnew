const Medicine = require('../models/Medicine');
const StockMovement = require('../models/StockMovement');

// @desc    Add new medicine
// @route   POST /api/medicines
// @access  Private/Pharmacy
const addMedicine = async (req, res) => {
    try {
        const { name, genericName, manufacturer, category, strength, form, price, batches, reorderLevel, barcode } = req.body;

        const medicine = await Medicine.create({
            name,
            genericName,
            manufacturer,
            category,
            strength,
            form,
            price,
            batches: batches || [],
            reorderLevel,
            barcode,
            pharmacyId: req.user._id,
        });

        // Log stock movement for initial batches
        if (batches && batches.length > 0) {
            for (const batch of batches) {
                await StockMovement.create({
                    medicineId: medicine._id,
                    batchNo: batch.batchNo,
                    pharmacyId: req.user._id,
                    type: 'purchase',
                    quantityChange: batch.quantity,
                    balanceAfter: batch.quantity,
                    performedBy: req.user._id,
                    notes: 'Initial stock',
                });
            }
        }

        res.status(201).json(medicine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all medicines
// @route   GET /api/medicines
// @access  Private/Pharmacy
const getMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find({
            pharmacyId: req.user._id,
            isActive: true,
        }).sort({ name: 1 });

        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get medicine by ID
// @route   GET /api/medicines/:id
// @access  Private/Pharmacy
const getMedicineById = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        if (medicine.pharmacyId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(medicine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update medicine
// @route   PUT /api/medicines/:id
// @access  Private/Pharmacy
const updateMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        if (medicine.pharmacyId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updated = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete medicine (soft delete)
// @route   DELETE /api/medicines/:id
// @access  Private/Pharmacy
const deleteMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        if (medicine.pharmacyId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        medicine.isActive = false;
        await medicine.save();

        res.json({ message: 'Medicine deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get low stock medicines
// @route   GET /api/medicines/alerts/low-stock
// @access  Private/Pharmacy
const getLowStock = async (req, res) => {
    try {
        const medicines = await Medicine.find({
            pharmacyId: req.user._id,
            isActive: true,
        });

        const lowStock = medicines.filter(med => {
            const totalStock = med.batches.reduce((sum, batch) => sum + batch.quantity, 0);
            return totalStock <= med.reorderLevel;
        });

        res.json(lowStock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get expiring medicines
// @route   GET /api/medicines/alerts/expiring
// @access  Private/Pharmacy
const getExpiring = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + parseInt(days));

        const medicines = await Medicine.find({
            pharmacyId: req.user._id,
            isActive: true,
            'batches.expDate': { $lte: expiryDate, $gte: new Date() },
        });

        res.json(medicines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add batch to medicine
// @route   POST /api/medicines/:id/batches
// @access  Private/Pharmacy
const addBatch = async (req, res) => {
    try {
        const { batchNo, quantity, mfgDate, expDate, supplierCost, status } = req.body;
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        if (medicine.pharmacyId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const newBatch = {
            batchNo,
            quantity,
            mfgDate,
            expDate,
            supplierCost,
            status: status || 'Available',
        };

        medicine.batches.push(newBatch);
        await medicine.save();

        // Log stock movement
        await StockMovement.create({
            medicineId: medicine._id,
            batchNo,
            pharmacyId: req.user._id,
            type: 'purchase',
            quantityChange: quantity,
            balanceAfter: medicine.batches.reduce((sum, b) => sum + b.quantity, 0),
            performedBy: req.user._id,
            notes: `Batch added with status: ${newBatch.status}`,
        });

        res.status(201).json(medicine);
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
