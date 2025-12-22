const mongoose = require('mongoose');

const pharmacistSchema = new mongoose.Schema({
    pharmacistId: {
        type: String,
        unique: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: true
    },
    dateOfBirth: {
        type: Date
    },
    profilePhoto: {
        type: String
    },
    professionalDetails: {
        registrationNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        qualification: {
            type: String,
            enum: ['Pharm-D', 'B.Pharm', 'M.Pharm', 'Other'],
            required: true
        },
        yearsOfExperience: {
            type: Number,
            default: 0
        },
        licenseExpiryDate: {
            type: Date,
            required: true
        },
        specialization: {
            type: String
        }
    },
    assignment: {
        assignedPharmacy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pharmacy'
        },
        employmentType: {
            type: String,
            enum: ['Full-Time', 'Part-Time', 'Contract'],
            required: true
        },
        shift: {
            type: String,
            enum: ['Morning', 'Evening', 'Night', 'Rotating']
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'Suspended'],
            default: 'Active'
        }
    },
    contact: {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        address: {
            type: String
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Auto-generate Pharmacist ID
pharmacistSchema.pre('save', async function () {
    if (!this.pharmacistId) {
        const count = await this.constructor.countDocuments();
        this.pharmacistId = `PH-${1000 + count + 1}`;
    }
});

// Indexing for performance
pharmacistSchema.index({ 'professionalDetails.registrationNumber': 1 });
pharmacistSchema.index({ 'contact.email': 1 });
pharmacistSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Pharmacist', pharmacistSchema);
