const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
    medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true,
    },
    batchNo: {
        type: String,
    },
    pharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['sale', 'purchase', 'return', 'adjustment', 'expiry'],
        required: true,
    },
    quantityChange: {
        type: Number,
        required: true,
    },
    balanceAfter: {
        type: Number,
        required: true,
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    notes: {
        type: String,
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('StockMovement', stockMovementSchema);
