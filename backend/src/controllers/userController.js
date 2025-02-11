const User = require('../models/User');

const userController = {
  // Get all users except current user
  getUsers: async (req, res, next) => {
    try {
      const users = await User.find({ 
        _id: { $ne: req.user.id } // Exclude current user
      })
      .select('name role') // Only send necessary fields
      .sort('name');

      res.json({
        status: 'success',
        data: users
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;