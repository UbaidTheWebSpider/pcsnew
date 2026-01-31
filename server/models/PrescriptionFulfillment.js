const mongoose = require('mongoose');

const prescriptionFulfillmentSchema = new mongoose.Schema({
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
        required: true,
        unique: true
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
        index: true
    },
    pharmacistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'partially_fulfilled', 'fulfilled', 'cancelled'],
        default: 'pending',
        index: true
    },
    items: [{
        prescribedMedicine: {
            type: String,
            required: true
        },
        prescribedDosage: String,
        prescribedFrequency: String,
        prescribedDuration: String,
        dispensedMedicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MasterMedicine'
        },
        dispensedMedicineName: String,
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MasterMedicineBatch'
        },
        batchNumber: String,
        quantityPrescribed: Number,
        quantityDispensed: {
            type: Number,
            default: 0
        },
        isSubstitute: {
            type: Boolean,
            default: false
        },
        substitutionReason: String,
        substitutionApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        substitutionApprovedAt: Date,
        isFulfilled: {
            type: Boolean,
            default: false
        },
        notFulfilledReason: String
    }],
    posTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'POSTransaction'
    },
    validatedAt: Date,
    validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dispensedAt: Date,
    notes: String,
    patientInstructions: String,
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
prescriptionFulfillmentSchema.index({ pharmacyId: 1, status: 1 });
prescriptionFulfillmentSchema.index({ createdAt: -1 });

// Virtual: Check if fully fulfilled
prescriptionFulfillmentSchema.virtual('isFullyFulfilled').get(function () {
    return this.items.every(item => item.isFulfilled);
});

// Virtual: Check if partially fulfilled
prescriptionFulfillmentSchema.virtual('isPartiallyFulfilled').get(function () {
    const fulfilledCount = this.items.filter(item => item.isFulfilled).length;
    return fulfilledCount > 0 && fulfilledCount < this.items.length;
});

// Virtual: Fulfillment percentage
prescriptionFulfillmentSchema.virtual('fulfillmentPercentage').get(function () {
    if (this.items.length === 0) return 0;
    const fulfilledCount = this.items.filter(item => item.isFulfilled).length;
    return Math.round((fulfilledCount / this.items.length) * 100);
});

// Method to validate prescription
// Renamed from 'validate' to avoid conflict with Mongoose internal validate method
prescriptionFulfillmentSchema.methods.validateFulfillment = function (userId) {
    this.status = 'in_progress';
    this.validatedAt = new Date();
    this.validatedBy = userId;
    return this.save();
};

// Method to mark as dispensed
prescriptionFulfillmentSchema.methods.markAsDispensed = function () {
    this.dispensedAt = new Date();

    // Update status based on fulfillment
    if (this.isFullyFulfilled) {
        this.status = 'fulfilled';
    } else if (this.isPartiallyFulfilled) {
        this.status = 'partially_fulfilled';
    }

    return this.save();
};

// Method to add substitution
prescriptionFulfillmentSchema.methods.addSubstitution = function (itemIndex, medicineId, medicineName, batchId, reason, approvedBy) {
    if (itemIndex < 0 || itemIndex >= this.items.length) {
        throw new Error('Invalid item index');
    }

    this.items[itemIndex].isSubstitute = true;
    this.items[itemIndex].dispensedMedicineId = medicineId;
    this.items[itemIndex].dispensedMedicineName = medicineName;
    this.items[itemIndex].batchId = batchId;
    this.items[itemIndex].substitutionReason = reason;
    this.items[itemIndex].substitutionApprovedBy = approvedBy;
    this.items[itemIndex].substitutionApprovedAt = new Date();

    return this.save();
};

// Method to cancel fulfillment
prescriptionFulfillmentSchema.methods.cancel = function (reason) {
    this.status = 'cancelled';
    this.notes = reason;
    return this.save();
};

// Ensure virtuals are included in JSON
prescriptionFulfillmentSchema.set('toJSON', { virtuals: true });
prescriptionFulfillmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('PrescriptionFulfillment', prescriptionFulfillmentSchema);
