import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Send, User, X } from 'lucide-react';
import doctorService from '../../api/doctorService';

const MessageModal = ({ isOpen, onClose, onMessageSent }) => {
  const [formData, setFormData] = useState({
    receiverId: '',
    subject: '',
    content: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await doctorService.getUsers();
        setUsers(response.data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await doctorService.sendMessage(formData);
      onMessageSent();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">New Message</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <select
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.receiverId}
              onChange={(e) => setFormData({ ...formData, receiverId: e.target.value })}
              required
            >
              <option value="">Select Recipient</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              className="mt-1 w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows="4"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 rounded-lg transition-colors ${
                loading 
                  ? 'bg-blue-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Communication = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await doctorService.getMessages();
      setMessages(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    setSelectedMessage(message);
    if (!message.read && message.receiver._id === message.receiver._id) {
      try {
        await doctorService.markMessageAsRead(message._id);
        fetchMessages(); // Refresh messages to update read status
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  if (loading) return <div className="p-4">Loading messages...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Communication</h2>
        <button 
          onClick={() => setShowNewMessage(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <MessageSquare size={20} className="mr-2" />
          New Message
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Messages List */}
        <div className="col-span-4 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="divide-y">
            {messages.map((message) => (
              <div 
                key={message._id}
                onClick={() => handleMessageClick(message)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedMessage?._id === message._id ? 'bg-blue-50' : ''
                } ${!message.read ? 'font-semibold' : ''}`}
              >
                <div className="flex items-center mb-2">
                  <User size={20} className="text-gray-400 mr-2" />
                  <span>{message.sender.name}</span>
                </div>
                <div className="text-sm font-medium">{message.subject}</div>
                <div className="text-sm text-gray-500 truncate">{message.content}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Content */}
        <div className="col-span-8 bg-white rounded-lg shadow">
          {selectedMessage ? (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-2">{selectedMessage.subject}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-4">From: {selectedMessage.sender.name}</span>
                  <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="prose max-w-none">
                {selectedMessage.content}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Select a message to read
            </div>
          )}
        </div>
      </div>

      <MessageModal 
        isOpen={showNewMessage}
        onClose={() => setShowNewMessage(false)}
        onMessageSent={fetchMessages}
      />
    </div>
  );
};

export default Communication;