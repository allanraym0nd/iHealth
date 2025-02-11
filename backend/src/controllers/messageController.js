const Message = require('../models/Message');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

const messageController = {
  // Send a new message
  sendMessage: async (req, res, next) => {
    try {
      const { receiverId, subject, content } = req.body;

      const message = new Message({
        sender: req.user.id,
        receiver: receiverId,
        subject,
        content
      });

      await message.save();

      res.status(201).json({
        status: 'success',
        data: message
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all messages for the logged-in user
  getMessages: async (req, res, next) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: req.user.id },
          { receiver: req.user.id }
        ]
      })
      .populate('sender', 'name role')
      .populate('receiver', 'name role')
      .sort('-createdAt');

      res.json({
        status: 'success',
        data: messages
      });
    } catch (error) {
      next(error);
    }
  },

  // Get unread messages count
  getUnreadCount: async (req, res, next) => {
    try {
      const count = await Message.countDocuments({
        receiver: req.user.id,
        read: false
      });

      res.json({
        status: 'success',
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark message as read
  markAsRead: async (req, res, next) => {
    try {
      const message = await Message.findById(req.params.id);
      
      if (!message) {
        throw new AppError('Message not found', 404);
      }

      if (message.receiver.toString() !== req.user.id) {
        throw new AppError('Not authorized to access this message', 403);
      }

      message.read = true;
      await message.save();

      res.json({
        status: 'success',
        data: message
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a message
  deleteMessage: async (req, res, next) => {
    try {
      const message = await Message.findById(req.params.id);
      
      if (!message) {
        throw new AppError('Message not found', 404);
      }

      if (message.sender.toString() !== req.user.id && 
          message.receiver.toString() !== req.user.id) {
        throw new AppError('Not authorized to delete this message', 403);
      }

      await message.remove();

      res.json({
        status: 'success',
        message: 'Message deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get conversation with specific user
  getConversation: async (req, res, next) => {
    try {
      const otherUserId = req.params.userId;
      
      const messages = await Message.find({
        $or: [
          { sender: req.user.id, receiver: otherUserId },
          { sender: otherUserId, receiver: req.user.id }
        ]
      })
      .populate('sender', 'name role')
      .populate('receiver', 'name role')
      .sort('createdAt');

      res.json({
        status: 'success',
        data: messages
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = messageController;