const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
    },
    fileUrl: String, // For images/reports sharing
    messageType: {
        type: String,
        enum: ['text', 'file', 'image'],
        default: 'text',
    },
    read: {
        type: Boolean,
        default: false,
    },
    appointmentId: { // Optional: Link chat to specific session
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Chat', chatSchema);
