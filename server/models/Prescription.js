const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    medicines: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
        },
        name: String,
        dosage: String,
        frequency: String,
        duration: String,
        quantity: Number,
    }],
    notes: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'ready', 'completed', 'cancelled'],
        default: 'pending',
    },
    assignedPharmacyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    deliveryType: {
        type: String,
        enum: ['pickup', 'delivery'],
        default: 'pickup',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    processedAt: {
        type: Date,
    },
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
