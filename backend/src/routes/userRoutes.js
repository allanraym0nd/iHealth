const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/users', auth, userController.getUsers);

module.exports = router;
