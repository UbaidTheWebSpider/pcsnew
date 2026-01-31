const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    prescriptionId: {
        type: String,
        unique: true,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false,
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
        instructionTime: { type: String, enum: ['Before Meal', 'After Meal', 'With Meal', 'Empty Stomach', 'None'], default: 'None' }
    }],
    diagnosis: String,
    notes: String,
    labTests: [String],
    followUpDate: Date,
    fileUrl: String, // Path to generated PDF
    isPharmacyForwarded: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Cancelled'],
        default: 'Active'
    },
    assignedPharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deliveryType: {
        type: String,
        enum: ['pickup', 'delivery'],
        default: 'pickup',
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    processedAt: Date,
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Generate unique prescription ID
prescriptionSchema.pre('save', async function () {
    if (this.isNew && !this.prescriptionId) {
        const count = await mongoose.model('Prescription').countDocuments();
        this.prescriptionId = `RX${String(count + 1).padStart(6, '0')}`;
    }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
