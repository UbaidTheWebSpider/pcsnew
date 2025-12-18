const mongoose = require('mongoose');

const consentLogSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
        index: true
    },
    action: {
        type: String,
        enum: ['GRANT', 'REVOKE', 'UPDATE'],
        required: true
    },
    scope: {
        type: String,
        required: true,
        enum: ['DATA_SHARING', 'TREATMENT', 'TELEMEDICINE', 'RESEARCH', 'THIRD_PARTY']
    },
    details: String,

    // Audit Metadata
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    ipAddress: String,
    userAgent: String,
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Who performed the action (could be patient or staff)
    }
}, {
    immutable: true // Prevent updates to existing logs
});

module.exports = mongoose.model('ConsentLog', consentLogSchema);
