const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
    // Tab 1: Basic Pharmacy Profile
    basicProfile: {
        pharmacyName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        pharmacyType: {
            type: String,
            required: true,
            enum: ['OPD Pharmacy', 'Inpatient Pharmacy', 'Emergency Pharmacy']
        },
        hospitalBranch: {
            type: String,
            required: true
        },
        pharmacyCode: {
            type: String,
            unique: true,
            required: true
        },
        operationalStatus: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Inactive'
        }
    },

    // Tab 2: Licensing & Compliance
    licensing: {
        licenseNumber: {
            type: String,
            required: true,
            unique: true
        },
        licenseType: {
            type: String,
            default: 'Hospital Pharmacy'
        },
        licenseExpiry: {
            type: Date,
            required: true
        },
        inspectionStatus: {
            type: String,
            enum: ['Pending', 'Verified'],
            default: 'Pending'
        }
    },

    // Tab 3: Assigned Pharmacist
    assignedPharmacist: {
        chiefPharmacist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        registrationNumber: {
            type: String,
            required: true
        },
        qualification: {
            type: String,
            enum: ['Pharm-D', 'B.Pharm', 'M.Pharm', 'Other']
        },
        dutySchedule: {
            shift: String,
            startTime: String,
            endTime: String
        },
        backupPharmacist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    // Tab 4: Physical Location
    physicalLocation: {
        floor: {
            type: String,
            required: true
        },
        wing: {
            type: String,
            required: true
        },
        counterNumbers: [{
            type: String
        }],
        storageRoomId: String,
        controlledDrugsCabinet: {
            type: Boolean,
            default: false
        },
        coldStorageAvailable: {
            type: Boolean,
            default: false
        }
    },

    // Tab 5: System Configuration
    systemConfiguration: {
        inventoryModuleAccess: {
            type: Boolean,
            default: true
        },
        prescriptionIntegration: [{
            type: String,
            enum: ['OPD', 'IPD', 'ER']
        }],
        billingPOSIntegration: {
            type: Boolean,
            default: true
        },
        insurancePanelAccess: {
            type: Boolean,
            default: false
        },
        barcodeScanningEnabled: {
            type: Boolean,
            default: false
        }
    },

    // Tab 6: Inventory Initialization (Optional)
    inventorySettings: {
        defaultDrugCategories: [{
            type: String
        }],
        reorderThreshold: {
            type: Number,
            default: 10
        },
        controlledDrugTracking: {
            type: Boolean,
            default: false
        },
        expiryAlertDays: {
            type: Number,
            default: 30
        }
    },

    // Tab 7: Compliance & Audit Controls
    complianceControls: {
        auditLoggingEnabled: {
            type: Boolean,
            default: true,
            required: true
        },
        pharmacistApprovalRequired: {
            type: Boolean,
            default: true
        },
        prescriptionMandatory: {
            type: Boolean,
            default: true
        },
        expiredDrugLock: {
            type: Boolean,
            default: true
        }
    },

    // Tab 8: Approval & Activation
    approvalWorkflow: {
        registeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        registrationDate: {
            type: Date,
            default: Date.now
        },
        approvalStatus: {
            type: String,
            enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
            default: 'Draft'
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        approvalDate: Date,
        activationDate: Date,
        remarks: String,
        rejectionReason: String
    },

    // Hospital reference
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital'
    },

    // Audit trail
    auditLog: [{
        action: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        details: String
    }]
}, {
    timestamps: true
});

// Indexes for better query performance
pharmacySchema.index({ 'basicProfile.pharmacyCode': 1 });
pharmacySchema.index({ 'basicProfile.pharmacyName': 1 });
pharmacySchema.index({ 'licensing.licenseNumber': 1 });
pharmacySchema.index({ 'approvalWorkflow.approvalStatus': 1 });

// Virtual for checking license expiry warning
pharmacySchema.virtual('isLicenseExpiringSoon').get(function () {
    if (!this.licensing.licenseExpiry) return false;
    const daysUntilExpiry = Math.ceil((this.licensing.licenseExpiry - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
});

// Virtual for checking if license is expired
pharmacySchema.virtual('isLicenseExpired').get(function () {
    if (!this.licensing.licenseExpiry) return false;
    return this.licensing.licenseExpiry < new Date();
});

// Method to add audit log entry
pharmacySchema.methods.addAuditLog = function (action, userId, details) {
    this.auditLog.push({
        action,
        performedBy: userId,
        details,
        timestamp: new Date()
    });
};

// Ensure virtuals are included in JSON
pharmacySchema.set('toJSON', { virtuals: true });
pharmacySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
