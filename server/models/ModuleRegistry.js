const mongoose = require('mongoose');

const moduleRegistrySchema = new mongoose.Schema({
    moduleKey: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    enabled: {
        type: Boolean,
        default: false,
    },
    visibleToRoles: [{
        type: String,
        enum: ['patient', 'doctor', 'hospital_admin', 'hospital_staff', 'pharmacy', 'super_admin']
    }],
    routePrefix: String,
    icon: String, // Icon name or URL
    description: String
}, { timestamps: true });

module.exports = mongoose.model('ModuleRegistry', moduleRegistrySchema);
