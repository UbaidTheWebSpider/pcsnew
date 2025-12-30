const mongoose = require('mongoose');

const posTransactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
        required: true
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
        index: true
    },
    cashierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
        sparse: true
    },
    items: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true
        },
        batchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MedicineBatch',
            required: true
        },
        medicineName: {
            type: String,
            required: true
        },
        batchNumber: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        discount: {
            type: Number,
            default: 0,
            min: 0
        },
        discountApprovedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        taxRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 1
        },
        taxAmount: Number,
        totalAmount: Number
    }],
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'insurance', 'hospital_wallet', 'mixed'],
        required: true
    },
    paymentDetails: {
        cash: { type: Number, default: 0, min: 0 },
        card: { type: Number, default: 0, min: 0 },
        insurance: { type: Number, default: 0, min: 0 },
        wallet: { type: Number, default: 0, min: 0 },
        cardTransactionId: String,
        insuranceClaimId: String
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    taxTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    discountTotal: {
        type: Number,
        default: 0,
        min: 0
    },
    grandTotal: {
        type: Number,
        required: true,
        min: 0
    },
    amountReceived: Number,
    changeGiven: Number,
    refundStatus: {
        type: String,
        enum: ['none', 'partial', 'full'],
        default: 'none'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundReason: String,
    refundedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    refundedAt: Date,
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CashierShift',
        required: true
    },
    invoiceUrl: String,
    invoiceNumber: String,
    customerName: String,
    customerPhone: String,
    customerCNIC: String,
    notes: String,
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
posTransactionSchema.index({ transactionId: 1 }, { unique: true });
posTransactionSchema.index({ pharmacyId: 1, createdAt: -1 });
posTransactionSchema.index({ cashierId: 1, createdAt: -1 });
posTransactionSchema.index({ shiftId: 1 });
posTransactionSchema.index({ prescriptionId: 1 }, { sparse: true });
posTransactionSchema.index({ invoiceNumber: 1 });

// Auto-generate transaction ID
posTransactionSchema.pre('validate', async function () {
    if (this.isNew && !this.transactionId) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(today.setHours(0, 0, 0, 0)),
                $lt: new Date(today.setHours(23, 59, 59, 999))
            }
        });
        this.transactionId = `TXN-${dateStr}-${String(count + 1).padStart(4, '0')}`;
    }

    // Auto-generate invoice number if not set
    if (this.isNew && !this.invoiceNumber) {
        const today = new Date();
        const yearMonth = today.toISOString().substring(0, 7).replace('-', '');
        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(today.getFullYear(), today.getMonth(), 1),
                $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
            }
        });
        this.invoiceNumber = `INV-${yearMonth}-${String(count + 1).padStart(5, '0')}`;
    }
});

// Method to process refund
posTransactionSchema.methods.processRefund = function (amount, reason, userId) {
    if (amount > this.grandTotal) {
        throw new Error('Refund amount cannot exceed transaction total');
    }

    this.refundAmount = amount;
    this.refundReason = reason;
    this.refundedBy = userId;
    this.refundedAt = new Date();

    if (amount === this.grandTotal) {
        this.refundStatus = 'full';
    } else {
        this.refundStatus = 'partial';
    }

    return this.save();
};

// Ensure virtuals are included in JSON
posTransactionSchema.set('toJSON', { virtuals: true });
posTransactionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('POSTransaction', posTransactionSchema);
