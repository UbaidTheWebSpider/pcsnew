const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    genericName: {
        type: String,
    },
    manufacturer: {
        type: String,
    },
    category: {
        type: String, // antibiotic, painkiller, vitamin, etc.
    },
    strength: {
        type: String, // 500mg, 10ml, etc.
    },
    form: {
        type: String, // tablet, syrup, injection, capsule
    },
    price: {
        type: Number,
        required: true,
    },
    taxRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100, // Percentage (0-100)
    },
    batches: [{
        batchNo: String,
        quantity: Number,
        mfgDate: Date,
        expDate: Date,
        supplierCost: Number,
        status: {
            type: String,
            enum: ['available', 'not_for_sale', 'expired', 'sold_out', 'low_stock'],
            default: 'available',
        },
    }],
    reorderLevel: {
        type: Number,
        default: 10,
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    barcode: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Calculate total stock across all batches
medicineSchema.virtual('totalStock').get(function () {
    return this.batches.reduce((total, batch) => total + batch.quantity, 0);
});

// Update timestamp on save
// Update timestamp on save
medicineSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    if (typeof next === 'function') {
        next();
    }
});

module.exports = mongoose.model('Medicine', medicineSchema);
