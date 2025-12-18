const express = require('express');
const router = express.Router();
const {
    getMessages,
    sendMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:userId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;
