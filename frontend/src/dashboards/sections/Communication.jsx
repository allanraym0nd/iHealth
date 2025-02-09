import React, { useState } from 'react';
import { MessageSquare, Send, User, Search } from 'lucide-react';

const Communication = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Nurse Sarah',
      message: 'Patient in Room 302 needs attention',
      time: '10:30 AM',
      unread: true
    },
    {
      id: 2,
      sender: 'Dr. Smith',
      message: 'Can you check the lab results for John Doe?',
      time: '9:45 AM',
      unread: false
    }
  ]);

  const [newMessage, setNewMessage] = useState('');

  // Send message handler
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([
        {
          id: messages.length + 1,
          sender: 'Me',
          message: newMessage,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: false
        },
        ...messages
      ]);
      setNewMessage('');
    }
  };

  return (
    <div className="p-6">
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Contacts List */}
        <div className="w-1/3 bg-white rounded-l-lg shadow-lg mr-1">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-5rem)]"> 
            {messages.map((msg) => (
              <div 
                key={msg.id} // Assigns a unique key for each message to optimize React rendering.
                className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b"
              >
                <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{msg.sender}</p>
                    <span className="text-sm text-gray-500">{msg.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                </div>
                {msg.unread && (
                  <span className="w-3 h-3 bg-blue-500 rounded-full ml-2"></span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-r-lg shadow-lg ml-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center">
              <User className="h-10 w-10 text-gray-400 bg-gray-100 rounded-full p-2" />
              <div className="ml-3">
                <p className="font-medium">Nurse Sarah</p>
                <p className="text-sm text-gray-500">Online</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              // Aligns messages: if sent by "Me", align right; otherwise, align left
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender === 'Me'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'Me' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Communication;