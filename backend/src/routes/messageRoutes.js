const router = require('express').Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// Send new message
router.post('/', auth, messageController.sendMessage);

// Get all messages for logged in user
router.get('/', auth, messageController.getMessages);

// Get unread messages count
router.get('/unread', auth, messageController.getUnreadCount);

// Get conversation with specific user
router.get('/conversation/:userId', auth, messageController.getConversation);

// Mark message as read
router.patch('/:id/read', auth, messageController.markAsRead);

// Delete message
router.delete('/:id', auth, messageController.deleteMessage);

module.exports = router;