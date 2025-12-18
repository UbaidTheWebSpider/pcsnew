const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
    checkInId: {
        type: String,
        unique: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    department: {
        type: String,
        enum: ['OPD', 'ER', 'IPD', 'LAB', 'RADIOLOGY', 'TELEMEDICINE', 'FOLLOWUP'],
        required: true,
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    checkInTime: {
        type: Date,
        default: Date.now,
    },
    checkInReason: {
        type: String,
        required: true,
    },
    priorityLevel: {
        type: String,
        enum: ['Normal', 'Urgent', 'Critical'],
        default: 'Normal',
    },
    status: {
        type: String,
        enum: ['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled'],
        default: 'checked-in',
    },
    queueNumber: {
        type: Number,
    },
    // ER specific
    triageLevel: {
        type: String,
        enum: ['GREEN', 'YELLOW', 'ORANGE', 'RED'],
    },
    // IPD specific
    wardBed: {
        type: String,
    },
    // Lab/Radiology specific
    tokenNumber: {
        type: String,
    },
    testOrders: [{
        type: String,
    }],
    // Telemedicine specific
    meetingLink: {
        type: String,
    },
    meetingId: {
        type: String,
    },
    // Follow-up specific
    previousVisitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CheckIn',
    },
    // Completion
    completedAt: {
        type: Date,
    },
    notes: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

// Generate unique check-in ID
checkInSchema.pre('save', async function () {
    if (this.isNew && !this.checkInId) {
        const count = await mongoose.model('CheckIn').countDocuments();
        this.checkInId = `CHK${String(count + 1).padStart(6, '0')}`;
    }
});

module.exports = mongoose.model('CheckIn', checkInSchema);
