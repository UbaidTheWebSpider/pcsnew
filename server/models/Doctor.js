const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    personalDetails: {
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true
        },
        dob: { type: Date, required: true },
        photoUrl: { type: String },
        bio: { type: String },
        languages: [{ type: String }]
    },
    professionalDetails: {
        qualification: { type: String, required: true },
        experience: { type: Number, required: true }, // in years
        licenseNumber: { type: String, required: true, unique: true },
        department: { type: String, required: true },
        employmentType: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Visiting', 'Contract'],
            default: 'Full-time'
        }
    },
    scheduleSettings: {
        slotDuration: { type: Number, default: 30 }, // in minutes
        weeklyAvailability: [{
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                required: true
            },
            startTime: { type: String, required: true }, // HH:mm format
            endTime: { type: String, required: true },   // HH:mm format
            isAvailable: { type: Boolean, default: true }
        }]
    },
    consultationFees: {
        physical: { type: Number, default: 0 },
        online: { type: Number, default: 0 }
    },
    telemedicine: {
        isEnabled: { type: Boolean, default: false },
        platform: {
            type: String,
            enum: ['BigBlueButton', 'Zoom'],
            default: 'BigBlueButton'
        },
        meetingUrl: { type: String } // Static meeting room URL if applicable
    },
    signatureUrl: { type: String },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'On Leave'],
        default: 'Active'
    }
}, {
    timestamps: true
});

// Index for faster searching
doctorSchema.index({ 'professionalDetails.department': 1 });
doctorSchema.index({ 'professionalDetails.licenseNumber': 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
