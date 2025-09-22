import React, { useState, useEffect, useRef } from 'react';
import { Database } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { messagingService } from '../lib/messaging';
import { MessageCircle, Send, Users, Clock, Check, CheckCheck } from 'lucide-react';

type Connection = Database['public']['Tables']['connections']['Row'] & {
  requester: { first_name: string; last_name: string; photo_url?: string };
  addressee: { first_name: string; last_name: string; photo_url?: string };
};

type Message = Database['public']['Tables']['messages']['Row'];

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [selectedConnection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const result = await messagingService.fetchConnections();

      if (!result.success) {
        setError(result.error || 'Failed to fetch connections');
        return;
      }

      setConnections(result.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConnection) return;

    try {
      const result = await messagingService.fetchMessages(selectedConnection.id);

      if (!result.success) {
        setError(result.error || 'Failed to fetch messages');
        return;
      }

      setMessages(result.data || []);
      setError('');
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('An unexpected error occurred');
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedConnection || !user) return;

    try {
      const result = await messagingService.markMessagesAsRead(selectedConnection.id);
      
      if (!result.success) {
        console.error('Failed to mark messages as read:', result.error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConnection || !user || sending) return;

    setSending(true);
    setError('');
    
    try {
      const result = await messagingService.sendMessage(selectedConnection.id, newMessage.trim());

      if (!result.success) {
        setError(result.error || 'Failed to send message');
        return;
      }

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('An unexpected error occurred while sending message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConnectionPartner = (connection: Connection) => {
    return connection.requester_id === user?.id ? connection.addressee : connection.requester;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Connections Sidebar */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-gray-600">{connections.length} connections</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {connections.length > 0 ? (
            <div className="space-y-1 p-2">
              {connections.map((connection) => {
                const partner = getConnectionPartner(connection);
                return (
                  <button
                    key={connection.id}
                    onClick={() => setSelectedConnection(connection)}
                    className={`w-full flex items-center space-x-3 p-4 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                      selectedConnection?.id === connection.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                      {partner.first_name.charAt(0)}{partner.last_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {partner.first_name} {partner.last_name}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Connected since {new Date(connection.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connections</h3>
              <p className="text-gray-600">
                Connect with alumni to start messaging
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConnection ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {getConnectionPartner(selectedConnection).first_name.charAt(0)}
                  {getConnectionPartner(selectedConnection).last_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getConnectionPartner(selectedConnection).first_name} {getConnectionPartner(selectedConnection).last_name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Connected since {new Date(selectedConnection.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className={`flex items-center justify-end space-x-1 mt-1 ${
                      message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">{formatTime(message.created_at)}</span>
                      {message.sender_id === user?.id && (
                        message.is_read ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-6 border-t border-gray-200">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{sending ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Connection</h3>
              <p className="text-gray-600">
                Choose a connection from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;