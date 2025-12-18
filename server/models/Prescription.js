const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    prescriptionId: {
        type: String,
        unique: true,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    medicines: [{
        name: { type: String, required: true },
        dosage: { type: String, required: true }, // e.g., "500mg"
        frequency: { type: String, required: true }, // e.g., "1-0-1"
        duration: { type: String, required: true }, // e.g., "5 days"
        instructions: String,
    }],
    notes: String,
    fileUrl: String, // Path to generated PDF
    isPharmacyForwarded: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Generate unique prescription ID
prescriptionSchema.pre('save', async function (next) {
    if (this.isNew && !this.prescriptionId) {
        const count = await mongoose.model('Prescription').countDocuments();
        this.prescriptionId = `RX${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
