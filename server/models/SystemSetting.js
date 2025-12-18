const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
    },
    value: {
        type: mongoose.Schema.Types.Mixed, // Can be boolean, string, number, or object
        required: true,
    },
    description: String,
    category: {
        type: String,
        enum: ['feature_flag', 'global_config', 'theme_config'],
        default: 'global_config'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
