const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetModel: String,
    targetId: mongoose.Schema.Types.ObjectId,
    details: {
        type: mongoose.Schema.Types.Mixed, // Store previous/new values or diffs
    },
    ipAddress: String,
    userAgent: String
}, { timestamps: { createdAt: true, updatedAt: false } }); // Only createdAt needed

module.exports = mongoose.model('AuditLog', auditLogSchema);
