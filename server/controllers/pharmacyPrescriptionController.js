const PrescriptionFulfillment = require('../models/PrescriptionFulfillment');
const Prescription = require('../models/Prescription');
const MedicineBatch = require('../models/MasterMedicineBatch');
const Medicine = require('../models/MasterMedicine');
const PharmacyAuditLog = require('../models/PharmacyAuditLog');

// @desc    Get pending prescriptions
// @route   GET /api/pharmacy/prescriptions/pending
// @access  Private (Pharmacist, Pharmacy Admin)
exports.getPendingPrescriptions = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        // Get prescriptions that are forwarded to pharmacy but not yet fulfilled
        const prescriptions = await Prescription.find({
            isPharmacyForwarded: true
        })
            .populate('doctorId', 'name specialization')
            .populate('patientId', 'name contact')
            .sort({ createdAt: -1 });

        // Get fulfillment records
        const fulfillments = await PrescriptionFulfillment.find({
            pharmacyId: req.pharmacyId,
            status
        }).select('prescriptionId status');

        const fulfillmentMap = new Map(
            fulfillments.map(f => [f.prescriptionId.toString(), f])
        );

        // Filter prescriptions based on fulfillment status
        const filteredPrescriptions = prescriptions.filter(p => {
            const fulfillment = fulfillmentMap.get(p._id.toString());
            if (status === 'pending') {
                return !fulfillment || fulfillment.status === 'pending';
            }
            return fulfillment && fulfillment.status === status;
        });

        res.json({
            success: true,
            count: filteredPrescriptions.length,
            data: filteredPrescriptions
        });
    } catch (error) {
        console.error('Get pending prescriptions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching prescriptions'
        });
    }
};

// @desc    Create prescription fulfillment
// @route   POST /api/pharmacy/prescriptions/:id/fulfill
// @access  Private (Pharmacist, Pharmacy Admin)
exports.createFulfillment = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if prescription exists
        const prescription = await Prescription.findById(id);
        if (!prescription) {
            return res.status(404).json({
                success: false,
                message: 'Prescription not found'
            });
        }

        // Check if already has fulfillment
        const existing = await PrescriptionFulfillment.findOne({ prescriptionId: id });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Fulfillment record already exists'
            });
        }

        // Create fulfillment items from prescription medicines
        const items = prescription.medicines.map(med => ({
            prescribedMedicine: med.name,
            prescribedDosage: med.dosage,
            prescribedFrequency: med.frequency,
            prescribedDuration: med.duration,
            quantityPrescribed: 1, // Default, can be adjusted
            quantityDispensed: 0,
            isFulfilled: false
        }));

        const fulfillment = await PrescriptionFulfillment.create({
            prescriptionId: id,
            pharmacyId: req.pharmacyId,
            pharmacistId: req.user._id,
            items,
            status: 'pending'
        });

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'create',
            entity: 'fulfillment',
            entityId: fulfillment._id,
            description: `Created fulfillment for prescription ${prescription.prescriptionId}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.status(201).json({
            success: true,
            message: 'Fulfillment record created',
            data: fulfillment
        });
    } catch (error) {
        console.error('Create fulfillment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating fulfillment',
            error: error.message
        });
    }
};

// @desc    Update fulfillment (dispense medicines)
// @route   PUT /api/pharmacy/prescriptions/:id/fulfill
// @access  Private (Pharmacist, Pharmacy Admin)
exports.updateFulfillment = async (req, res) => {
    try {
        const { id } = req.params;
        const { items, notes, patientInstructions } = req.body;

        const fulfillment = await PrescriptionFulfillment.findOne({ prescriptionId: id });
        if (!fulfillment) {
            return res.status(404).json({
                success: false,
                message: 'Fulfillment record not found'
            });
        }

        // Update items
        if (items && Array.isArray(items)) {
            fulfillment.items = items.map(item => ({
                ...item,
                isFulfilled: item.quantityDispensed > 0
            }));
        }

        if (notes) fulfillment.notes = notes;
        if (patientInstructions) fulfillment.patientInstructions = patientInstructions;

        // Mark as dispensed if all items fulfilled
        if (fulfillment.isFullyFulfilled) {
            await fulfillment.markAsDispensed();
        } else if (fulfillment.isPartiallyFulfilled) {
            fulfillment.status = 'partially_fulfilled';
        }

        await fulfillment.save();

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'dispense',
            entity: 'fulfillment',
            entityId: fulfillment._id,
            description: `Updated fulfillment - ${fulfillment.fulfillmentPercentage}% complete`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            success: true,
            message: 'Fulfillment updated successfully',
            data: fulfillment
        });
    } catch (error) {
        console.error('Update fulfillment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating fulfillment',
            error: error.message
        });
    }
};

// @desc    Validate prescription
// @route   POST /api/pharmacy/prescriptions/:id/validate
// @access  Private (Pharmacist, Pharmacy Admin)
exports.validatePrescription = async (req, res) => {
    try {
        const { id } = req.params;

        const fulfillment = await PrescriptionFulfillment.findOne({ prescriptionId: id });
        if (!fulfillment) {
            return res.status(404).json({
                success: false,
                message: 'Fulfillment record not found'
            });
        }

        await fulfillment.validateFulfillment(req.user._id);

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'validate',
            entity: 'prescription',
            entityId: id,
            description: 'Prescription validated',
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            success: true,
            message: 'Prescription validated successfully',
            data: fulfillment
        });
    } catch (error) {
        console.error('Validate prescription error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating prescription',
            error: error.message
        });
    }
};

// @desc    Add medicine substitution
// @route   POST /api/pharmacy/prescriptions/:id/substitute
// @access  Private (Pharmacist, Pharmacy Admin)
exports.addSubstitution = async (req, res) => {
    try {
        const { id } = req.params;
        const { itemIndex, medicineId, batchId, reason } = req.body;

        const fulfillment = await PrescriptionFulfillment.findOne({ prescriptionId: id });
        if (!fulfillment) {
            return res.status(404).json({
                success: false,
                message: 'Fulfillment record not found'
            });
        }

        const medicine = await Medicine.findById(medicineId);
        if (!medicine) {
            return res.status(404).json({
                success: false,
                message: 'Substitute medicine not found'
            });
        }

        await fulfillment.addSubstitution(
            itemIndex,
            medicineId,
            medicine.name,
            batchId,
            reason,
            req.user._id
        );

        // Create audit log
        await PharmacyAuditLog.createLog({
            pharmacyId: req.pharmacyId,
            userId: req.user._id,
            userName: req.user.name,
            action: 'update',
            entity: 'fulfillment',
            entityId: fulfillment._id,
            description: `Medicine substituted: ${medicine.name}. Reason: ${reason}`,
            metadata: {
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }
        });

        res.json({
            success: true,
            message: 'Substitution added successfully',
            data: fulfillment
        });
    } catch (error) {
        console.error('Add substitution error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error adding substitution'
        });
    }
};
