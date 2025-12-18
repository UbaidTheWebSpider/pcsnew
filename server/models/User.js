const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Delete the model from cache if it exists to force recompilation
if (mongoose.models.User) {
    delete mongoose.models.User;
}

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['patient', 'doctor', 'hospital_admin', 'hospital_staff', 'pharmacy', 'super_admin'],
        default: 'patient',
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    specialization: { type: String }, // For doctors
    contact: {
        phone: String,
        address: String,
    },
    // Demographics (for when Patient record isn't fully linked or needed quickly)
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    dateOfBirth: {
        type: Date,
    },
    // Digital Health Card Data
    healthId: {
        type: String,
        sparse: true,
        index: true
    },
    healthCardQr: {
        type: String, // JSON string or URL
    },
    healthCardIssueDate: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    strict: true,
    strictQuery: false
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
