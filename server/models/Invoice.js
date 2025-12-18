const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceId: {
        type: String,
        unique: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    items: [{
        description: { type: String, required: true }, // e.g., "Consultation Fee"
        amount: { type: Number, required: true },
    }],
    totalAmount: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        default: 0,
    },
    finalAmount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Unpaid', 'Paid', 'Refunded', 'Cancelled'],
        default: 'Unpaid',
    },
    paymentGateway: {
        type: String,
        enum: ['Stripe', 'JazzCash', 'Easypaisa', 'Cash', 'None'],
        default: 'None',
    },
    paymentTransactionId: String,
    paidAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Generate unique invoice ID
invoiceSchema.pre('save', async function (next) {
    if (this.isNew && !this.invoiceId) {
        const count = await mongoose.model('Invoice').countDocuments();
        this.invoiceId = `INV${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
