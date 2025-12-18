const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
    ward: {
        type: String, // e.g., "ICU", "General Ward A", "Emergency"
        required: true,
    },
    bedNumber: {
        type: String,
        required: true,
    },
    department: {
        type: String, // e.g., "Cardiology", "Orthopedics"
        required: true,
    },
    isOccupied: {
        type: Boolean,
        default: false,
    },
    currentPatientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        default: null,
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

// Compound index to ensure unique bed numbers per ward
bedSchema.index({ ward: 1, bedNumber: 1 }, { unique: true });

module.exports = mongoose.model('Bed', bedSchema);
