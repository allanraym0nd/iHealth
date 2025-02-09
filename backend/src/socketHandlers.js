const Chat = require('./models/Chat');
const Notification = require('./models/Notification');

const socketHandlers = (io) => {
  io.on('connection', (socket) => {
    socket.on('join_room', (userId) => {
      socket.join(userId);
    });

    socket.on('send_message', async ({ senderId, receiverId, message }) => {
      try {
        const chat = await Chat.create({
          sender: senderId,
          receiver: receiverId,
          message
        });
        
        // Create notification for message
        await Notification.create({
          recipient: receiverId,
          type: 'message',
          content: 'You have a new message',
          link: `/messages/${chat._id}`
        });
        
        io.to(receiverId).emit('receive_message', chat);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on('create_notification', async (notificationData) => {
      try {
        const notification = await Notification.create(notificationData);
        io.to(notification.recipient.toString()).emit('new_notification', notification);
      } catch (error) {
        console.error(error);
      }
    });
  });
};

module.exports = socketHandlers;