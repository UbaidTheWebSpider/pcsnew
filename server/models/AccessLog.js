const mongoose = require('mongoose');

const accessLogSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resourceAccessed: {
        type: String, // e.g., 'Patient Profile', 'Lab Report', 'Prescription'
        required: true
    },
    action: {
        type: String, // 'VIEW', 'EDIT', 'PRINT', 'EXPORT'
        default: 'VIEW'
    },
    module: String, // 'OPD', 'IPD', 'Pharmacy'

    timestamp: {
        type: Date,
        default: Date.now
    },
    reason: String // Optional reason for access (break-glass scenarios)
});

module.exports = mongoose.model('AccessLog', accessLogSchema);
