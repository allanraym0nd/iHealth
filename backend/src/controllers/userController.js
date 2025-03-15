const User = require('../models/User');

const userController = {
  // Get all users except current user
  getUsers: async (req, res, next) => {
    try {
      const users = await User.find({ 
        _id: { $ne: req.user.id } // Exclude current user
      })
      .select('username role createdAt') // Added username and createdAt
      .sort('username');

      res.json({
        status: 'success',
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Delete the user
      const result = await User.findByIdAndDelete(id);
      
      if (!result) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      res.json({
        status: 'success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }


};

module.exports = userController;