const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    supplierCode: {
        type: String,
        unique: true,
        required: true,
        uppercase: true,
        trim: true
    },
    supplierName: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        trim: true
    },
    alternatePhone: String,
    address: {
        street: String,
        city: String,
        state: String,
        country: {
            type: String,
            default: 'Pakistan'
        },
        postalCode: String
    },
    licenseNumber: {
        type: String,
        trim: true
    },
    licenseExpiry: Date,
    taxId: {
        type: String,
        trim: true
    },
    paymentTerms: {
        type: String,
        enum: ['Cash on Delivery', 'Net 15', 'Net 30', 'Net 60', 'Net 90'],
        default: 'Net 30'
    },
    creditLimit: {
        type: Number,
        default: 0,
        min: 0
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    notes: String,
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
supplierSchema.index({ supplierCode: 1 }, { unique: true });
supplierSchema.index({ supplierName: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ 'address.city': 1 });

// Auto-generate supplier code
supplierSchema.pre('save', async function (next) {
    if (this.isNew && !this.supplierCode) {
        const count = await mongoose.model('Supplier').countDocuments();
        this.supplierCode = `SUP-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Virtual: Check if license is expired
supplierSchema.virtual('isLicenseExpired').get(function () {
    if (!this.licenseExpiry) return false;
    return this.licenseExpiry < new Date();
});

// Virtual: Check if license expiring soon (within 90 days)
supplierSchema.virtual('isLicenseExpiringSoon').get(function () {
    if (!this.licenseExpiry) return false;
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    return this.licenseExpiry <= ninetyDaysFromNow && this.licenseExpiry > new Date();
});

// Virtual: Check if credit limit exceeded
supplierSchema.virtual('isCreditLimitExceeded').get(function () {
    return this.currentBalance > this.creditLimit;
});

// Method to update balance
supplierSchema.methods.updateBalance = function (amount) {
    this.currentBalance += amount;
    return this.save();
};

// Method to deactivate supplier
supplierSchema.methods.deactivate = function () {
    this.isActive = false;
    return this.save();
};

// Method to activate supplier
supplierSchema.methods.activate = function () {
    this.isActive = true;
    return this.save();
};

// Ensure virtuals are included in JSON
supplierSchema.set('toJSON', { virtuals: true });
supplierSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Supplier', supplierSchema);
