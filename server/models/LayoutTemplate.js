const mongoose = require('mongoose');

const layoutTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['dashboard', 'landing', 'auth', 'custom'],
        default: 'custom'
    },
    structure: {
        type: Object, // JSON structure defining the layout (grid, components, etc.)
        required: true,
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: { // Can be used to soft-delete or draft
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Ensure only one default per type
layoutTemplateSchema.index({ type: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

module.exports = mongoose.model('LayoutTemplate', layoutTemplateSchema);
