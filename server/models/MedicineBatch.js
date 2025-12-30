const mongoose = require('mongoose');

const medicineBatchSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true,
        index: true
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
        index: true
    },
    batchNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    purchasePrice: {
        type: Number,
        required: true,
        min: 0
    },
    mrp: {
        type: Number,
        required: true,
        min: 0
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    manufacturingDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true,
        index: true
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    qrCode: String,
    isControlledDrug: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['available', 'low_stock', 'expired', 'recalled', 'sold_out'],
        default: 'available'
    },
    reorderLevel: {
        type: Number,
        default: 10
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
medicineBatchSchema.index({ batchNumber: 1 }, { unique: true });
medicineBatchSchema.index({ medicineId: 1, pharmacyId: 1 });
medicineBatchSchema.index({ expiryDate: 1 }); // For expiry alerts
medicineBatchSchema.index({ barcode: 1 }, { sparse: true, unique: true });
medicineBatchSchema.index({ status: 1 });

// Virtual: Check if batch is expired
medicineBatchSchema.virtual('isExpired').get(function () {
    return this.expiryDate < new Date();
});

// Virtual: Check if expiring soon (within 30 days)
medicineBatchSchema.virtual('isExpiringSoon').get(function () {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.expiryDate <= thirtyDaysFromNow && this.expiryDate > new Date();
});

// Virtual: Check if low stock
medicineBatchSchema.virtual('isLowStock').get(function () {
    return this.quantity <= this.reorderLevel && this.quantity > 0;
});

// Virtual: Days until expiry
medicineBatchSchema.virtual('daysUntilExpiry').get(function () {
    const now = new Date();
    const diffTime = this.expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Method to deduct stock
medicineBatchSchema.methods.deductStock = function (quantity) {
    if (this.quantity < quantity) {
        throw new Error('Insufficient stock');
    }
    this.quantity -= quantity;
    if (this.quantity === 0) {
        this.status = 'sold_out';
    } else if (this.quantity <= this.reorderLevel) {
        this.status = 'low_stock';
    }
    return this.save();
};

// Method to add stock
medicineBatchSchema.methods.addStock = function (quantity) {
    this.quantity += quantity;
    if (this.quantity > this.reorderLevel) {
        this.status = 'available';
    }
    return this.save();
};

// Pre-save hook to update status based on expiry and quantity
medicineBatchSchema.pre('save', async function () {
    if (this.expiryDate < new Date()) {
        this.status = 'expired';
    } else if (this.quantity === 0) {
        this.status = 'sold_out';
    } else if (this.quantity <= this.reorderLevel) {
        this.status = 'low_stock';
    } else if (this.status !== 'recalled') {
        this.status = 'available';
    }
});

// Ensure virtuals are included in JSON
medicineBatchSchema.set('toJSON', { virtuals: true });
medicineBatchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('MedicineBatch', medicineBatchSchema);
