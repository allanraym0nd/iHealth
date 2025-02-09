const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.get('/', auth, notificationController.getUserNotifications);
router.put('/read', auth, notificationController.markAsRead);

module.exports = router;