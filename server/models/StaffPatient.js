const mongoose = require('mongoose');

if (mongoose.models.StaffPatient) {
    delete mongoose.models.StaffPatient;
}

const staffPatientSchema = new mongoose.Schema({
    patientId: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    personalInfo: {
        fullName: { type: String, required: true },
        cnic: { type: String, unique: true, sparse: true }, // Sparse allows null/unique
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
        dateOfBirth: { type: Date, required: true },
        bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
        photoUrl: { type: String }
    },
    contactInfo: {
        mobileNumber: { type: String, required: true },
        email: { type: String },
        address: { type: String, required: true },
        city: { type: String },
        province: { type: String },
        emergencyContact: {
            name: String,
            phone: String,
            relation: String
        }
    },
    admissionDetails: {
        patientType: { type: String, enum: ['OPD', 'IPD', 'ER'], required: true },
        department: { type: String, required: true },
        assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assuming Doctor is a User
        visitReason: { type: String },
        admissionDate: { type: Date, default: Date.now }
    },
    medicalBackground: {
        allergies: [String],
        chronicDiseases: [String],
        currentMedications: [String],
        notes: String
    },
    // Meta Fields
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to Hospital
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Staff who registered
    isActive: { type: Boolean, default: true } // For soft delete
}, {
    timestamps: true
});

// Auto-generate Patient ID (P-YYYY-XXXX)
staffPatientSchema.pre('validate', async function () {
    if (this.isNew && !this.patientId) {
        const date = new Date();
        const year = date.getFullYear();
        // Find last patient created this year to increment
        const lastPatient = await mongoose.model('StaffPatient').findOne({
            patientId: new RegExp(`^P-${year}-`)
        }).sort({ createdAt: -1 });

        let sequence = 1;
        if (lastPatient && lastPatient.patientId) {
            const parts = lastPatient.patientId.split('-');
            if (parts.length === 3) {
                sequence = parseInt(parts[2], 10) + 1;
            }
        }
        this.patientId = `P-${year}-${String(sequence).padStart(4, '0')}`;
    }
});

// Middleware to expose model only if not already compiled to avoid HMR errors in dev
module.exports = mongoose.models.StaffPatient || mongoose.model('StaffPatient', staffPatientSchema);
