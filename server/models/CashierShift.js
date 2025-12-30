const mongoose = require('mongoose');

const cashierShiftSchema = new mongoose.Schema({
    cashierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pharmacy',
        required: true,
        index: true
    },
    shiftStart: {
        type: Date,
        required: true,
        default: Date.now
    },
    shiftEnd: Date,
    openingBalance: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    closingBalance: {
        type: Number,
        min: 0
    },
    expectedBalance: {
        type: Number,
        min: 0
    },
    variance: {
        type: Number,
        default: 0
    },
    totalTransactions: {
        type: Number,
        default: 0,
        min: 0
    },
    totalSales: {
        type: Number,
        default: 0,
        min: 0
    },
    cashSales: {
        type: Number,
        default: 0,
        min: 0
    },
    cardSales: {
        type: Number,
        default: 0,
        min: 0
    },
    insuranceSales: {
        type: Number,
        default: 0,
        min: 0
    },
    walletSales: {
        type: Number,
        default: 0,
        min: 0
    },
    refundAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'reconciled'],
        default: 'open',
        index: true
    },
    reconciledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reconciledAt: Date,
    notes: String,
    varianceReason: String,
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
cashierShiftSchema.index({ cashierId: 1, shiftStart: -1 });
cashierShiftSchema.index({ pharmacyId: 1, status: 1 });
cashierShiftSchema.index({ status: 1, shiftStart: -1 });

// Virtual: Shift duration in hours
cashierShiftSchema.virtual('shiftDuration').get(function () {
    if (!this.shiftEnd) return null;
    const duration = this.shiftEnd - this.shiftStart;
    return Math.round(duration / (1000 * 60 * 60) * 10) / 10; // Hours with 1 decimal
});

// Virtual: Has variance
cashierShiftSchema.virtual('hasVariance').get(function () {
    return Math.abs(this.variance) > 0.01; // Tolerance of 1 paisa
});

// Virtual: Variance percentage
cashierShiftSchema.virtual('variancePercentage').get(function () {
    if (this.expectedBalance === 0) return 0;
    return Math.round((this.variance / this.expectedBalance) * 100 * 100) / 100;
});

// Method to close shift
cashierShiftSchema.methods.closeShift = function (closingBalance) {
    this.shiftEnd = new Date();
    this.closingBalance = closingBalance;
    this.expectedBalance = this.openingBalance + this.cashSales - this.refundAmount;
    this.variance = this.closingBalance - this.expectedBalance;
    this.status = 'closed';
    return this.save();
};

// Method to reconcile shift
cashierShiftSchema.methods.reconcile = function (userId, notes) {
    if (this.status !== 'closed') {
        throw new Error('Shift must be closed before reconciliation');
    }
    this.status = 'reconciled';
    this.reconciledBy = userId;
    this.reconciledAt = new Date();
    if (notes) {
        this.notes = notes;
    }
    return this.save();
};

// Method to update sales totals
cashierShiftSchema.methods.updateSales = function (transaction) {
    this.totalTransactions += 1;
    this.totalSales += transaction.grandTotal;

    // Update payment method totals
    if (transaction.paymentDetails) {
        this.cashSales += transaction.paymentDetails.cash || 0;
        this.cardSales += transaction.paymentDetails.card || 0;
        this.insuranceSales += transaction.paymentDetails.insurance || 0;
        this.walletSales += transaction.paymentDetails.wallet || 0;
    }

    // Update refund amount if applicable
    if (transaction.refundAmount) {
        this.refundAmount += transaction.refundAmount;
    }

    return this.save();
};

// Static method to check if cashier has open shift
cashierShiftSchema.statics.hasOpenShift = async function (cashierId) {
    const openShift = await this.findOne({
        cashierId,
        status: 'open'
    });
    return !!openShift;
};

// Static method to get current open shift
cashierShiftSchema.statics.getCurrentShift = async function (cashierId) {
    return await this.findOne({
        cashierId,
        status: 'open'
    });
};

// Ensure virtuals are included in JSON
cashierShiftSchema.set('toJSON', { virtuals: true });
cashierShiftSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CashierShift', cashierShiftSchema);
