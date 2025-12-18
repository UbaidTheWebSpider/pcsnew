const mongoose = require('mongoose');

const erTriageSchema = new mongoose.Schema({
    checkInId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CheckIn',
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    triageLevel: {
        type: String,
        enum: ['GREEN', 'YELLOW', 'ORANGE', 'RED'],
        required: true,
        default: 'YELLOW',
    },
    vitalSigns: {
        bloodPressure: {
            type: String, // e.g., "120/80"
        },
        heartRate: {
            type: Number,
        },
        temperature: {
            type: Number, // in Celsius
        },
        oxygenSaturation: {
            type: Number, // percentage
        },
        respiratoryRate: {
            type: Number,
        },
    },
    chiefComplaint: {
        type: String,
        required: true,
    },
    painLevel: {
        type: Number, // 1-10 scale
        min: 0,
        max: 10,
    },
    assessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assessmentTime: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
    },
    reassessmentNeeded: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('ERTriage', erTriageSchema);
