const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
    reportId: {
        type: String,
        unique: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    testName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Sample Collected', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Sample Collected',
    },
    resultSummary: String,
    fileUrl: String, // PDF or Image
    sampleCollectedAt: Date,
    completedAt: Date,
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Can be Admin or Patient (if manual upload)
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Generate unique report ID
labReportSchema.pre('save', async function (next) {
    if (this.isNew && !this.reportId) {
        const count = await mongoose.model('LabReport').countDocuments();
        this.reportId = `LAB${String(count + 1).padStart(6, '0')}`;
    }
    next();
});

module.exports = mongoose.model('LabReport', labReportSchema);
