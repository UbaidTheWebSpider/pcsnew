const Chat = require('../models/Chat');

// @desc    Get messages between current user and another user (or for an appointment)
// @route   GET /api/chat/:userId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Chat.find({
            $or: [
                { senderId: currentUserId, receiverId: userId },
                { senderId: userId, receiverId: currentUserId },
            ],
        })
            .sort({ timestamp: 1 });

        res.json({
            success: true,
            data: messages,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Send message
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { receiverId, message, type, fileUrl, appointmentId } = req.body;

        const chat = await Chat.create({
            senderId: req.user._id,
            receiverId,
            message,
            type,
            fileUrl,
            appointmentId,
        });

        // Initialize Socket.io (Assuming it's available globally or we can import it)
        // const io = req.app.get('io');
        // if (io) {
        //     io.to(receiverId).emit('newMessage', chat);
        // }

        res.status(201).json({
            success: true,
            data: chat,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMessages,
    sendMessage,
};
