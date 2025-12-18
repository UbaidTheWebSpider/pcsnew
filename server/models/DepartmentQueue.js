const mongoose = require('mongoose');

const departmentQueueSchema = new mongoose.Schema({
    department: {
        type: String,
        enum: ['OPD', 'ER', 'IPD', 'LAB', 'RADIOLOGY', 'TELEMEDICINE', 'FOLLOWUP'],
        required: true,
    },
    date: {
        type: Date,
        default: () => new Date().setHours(0, 0, 0, 0), // Start of day
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    queueItems: [{
        checkInId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CheckIn',
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
        },
        queueNumber: Number,
        priority: String,
        status: String,
        estimatedTime: Date,
        addedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    stats: {
        total: {
            type: Number,
            default: 0,
        },
        waiting: {
            type: Number,
            default: 0,
        },
        inProgress: {
            type: Number,
            default: 0,
        },
        completed: {
            type: Number,
            default: 0,
        },
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

// Compound index for efficient querying
departmentQueueSchema.index({ department: 1, date: 1, doctorId: 1 });

module.exports = mongoose.model('DepartmentQueue', departmentQueueSchema);
