const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    appointmentId: {
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
        required: true,
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    type: {
        type: String,
        enum: ['new-visit', 'follow-up', 'emergency', 'consultation', 'checkup'],
        default: 'new-visit',
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'pending',
    },
    scheduledDate: {
        type: Date,
        required: true,
    },
    scheduledTime: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        default: 30, // minutes
    },
    reason: {
        type: String,
    },
    notes: {
        type: String,
    },
    consultationNotes: {
        type: String,
    },
    prescriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prescription',
    },
    invoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
    },
    telemedicineRoomId: {
        type: String,
    },
    videoCallUrl: {
        type: String,
    },
    videoRoomId: {
        type: String,
    },
    isTelemedicine: {
        type: Boolean,
        default: false,
    },
    // BBB Meeting Management Fields
    meetingStatus: {
        type: String,
        enum: ['not_started', 'in_progress', 'ended'],
        default: 'not_started',
    },
    bbbMeetingId: {
        type: String,
    },
    bbbAttendeePassword: {
        type: String,
    },
    bbbModeratorPassword: {
        type: String,
    },
    meetingStartedAt: {
        type: Date,
    },
    meetingEndedAt: {
        type: Date,
    },
    cancelReason: {
        type: String,
    },
    rescheduledFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    reminders: [{
        type: {
            type: String,
            enum: ['email', 'sms'],
        },
        sentAt: Date,
        status: String,
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Generate unique appointment ID
appointmentSchema.pre('save', async function () {
    if (this.isNew && !this.appointmentId) {
        const count = await mongoose.model('Appointment').countDocuments();
        this.appointmentId = `A${String(count + 1).padStart(6, '0')}`;
    }
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
