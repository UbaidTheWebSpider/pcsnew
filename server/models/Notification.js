const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['appointment', 'prescription', 'lab', 'system', 'chat'],
        default: 'system',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    relatedId: mongoose.Schema.Types.ObjectId, // ID of related entity (appointment, etc.)
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Notification', notificationSchema);
