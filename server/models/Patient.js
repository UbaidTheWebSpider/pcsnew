const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        unique: true,
        required: true,
    },
    cnic: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    patientType: {
        type: String,
        enum: ['OPD', 'IPD', 'ER'],
        default: 'OPD'
    },
    status: {
        type: String,
        enum: ['Active', 'Discharged', 'Deceased'],
        default: 'Active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    fatherName: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
    },
    age: {
        type: Number,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    contact: {
        phone: String,
        email: String,
        address: String,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedDoctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    medicalHistory: [{
        condition: String,
        diagnosedDate: Date,
        status: {
            type: String,
            enum: ['active', 'resolved', 'chronic'],
            default: 'active',
        },
        notes: String,
    }],
    allergies: [String],
    chronicDiseases: [String],
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    emergencyContact: {
        name: String,
        relation: String,
        phone: String,
    },
    insurance: {
        provider: String,
        policyNumber: String,
        groupNumber: String,
        expiryDate: Date,
        coverageDetails: String,
        status: { type: String, default: 'Pending Verification' }
    },
    auditLogs: [{
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        details: String
    }],
    notes: [{
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        note: String,
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },

    // PMI & MPI Extensions
    healthId: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined for existing records
        index: true
    },
    photoUrl: {
        type: String, // URL to stored image
    },
    healthCardQr: {
        type: String, // Base64 or URL
    },
    healthCardIssueDate: {
        type: Date,
    },
    mpiScore: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },

    // Entitlements Engine
    entitlements: {
        status: {
            type: String, // 'active', 'expired', 'suspended'
            default: 'active'
        },
        planType: {
            type: String, // 'employee', 'dependent', 'pensioner'
            default: 'general'
        },
        maxDependents: {
            type: Number,
            default: 0
        },
        linkedDependents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient'
        }]
    },

    // Consent & Privacy
    consentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ConsentLog'
    },
    privacySettings: {
        shareDataWithNet: { type: Boolean, default: false },
        allowTelemedicine: { type: Boolean, default: false },
        allowResearchUse: { type: Boolean, default: false }
    },

    // Soft Delete
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },

    // Encrypted Sensitive Data (Optional migration target)
    encryptedData: {
        cnic: String,
        contact: String
    }
});

// Generate unique patient ID
patientSchema.pre('validate', async function () {
    if (this.isNew && !this.patientId) {
        const count = await mongoose.model('Patient').countDocuments();
        this.patientId = `P${String(count + 1).padStart(6, '0')}`;
    }
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Patient', patientSchema);
