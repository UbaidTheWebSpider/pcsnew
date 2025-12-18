const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    admissionId: {
        type: String,
        unique: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    admissionDateTime: {
        type: Date,
        default: Date.now,
    },
    type: {
        type: String,
        enum: ['Emergency', 'OPD', 'Referral'],
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    ward: {
        type: String,
        required: true,
    },
    bedNumber: {
        type: String, // Stores the bed number (e.g., "ICU-01")
    },
    assignedDoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // "assignedDoctor"
    },
    // Emergency Contact snapshot (essential for legal/admin reasons)
    emergencyContact: {
        name: { type: String, required: true },
        relation: { type: String, required: true },
        phone: { type: String, required: true },
    },
    // Medical Essentials snapshot
    medicalEssentials: {
        primaryDiagnosis: String,
        allergies: [String],
        bloodGroup: String,
    },
    status: {
        type: String,
        enum: ['Admitted', 'Pending', 'Discharged'],
        default: 'Admitted',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Staff ID
    },
    dischargeDate: Date,
}, { timestamps: true });

// Generate unique ID
admissionSchema.pre('save', async function () {
    if (this.isNew && !this.admissionId) {
        const count = await mongoose.model('Admission').countDocuments();
        this.admissionId = `ADM${String(count + 1).padStart(6, '0')}`;
    }
});

module.exports = mongoose.model('Admission', admissionSchema);
