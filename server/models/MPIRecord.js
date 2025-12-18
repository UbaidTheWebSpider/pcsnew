const mongoose = require('mongoose');

const mpiRecordSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    // Normalized fields for fuzzy matching
    normalizedName: {
        type: String,
        required: true,
        index: true // Text index for faster search
    },
    normalizedAddress: String,

    // Critical Identifiers
    cnic: {
        type: String,
        index: true
    },
    dob: Date,
    phone: String,

    // Metadata
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for fuzzy matching optimization if needed
mpiRecordSchema.index({ normalizedName: 'text', cnic: 1 });

module.exports = mongoose.model('MPIRecord', mpiRecordSchema);
