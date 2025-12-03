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
});

// Generate unique patient ID
patientSchema.pre('save', async function (next) {
    if (this.isNew && !this.patientId) {
        const count = await mongoose.model('Patient').countDocuments();
        this.patientId = `P${String(count + 1).padStart(6, '0')}`;
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Patient', patientSchema);
