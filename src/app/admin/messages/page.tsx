"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Phone, Clock, User } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface Conversation {
  id: string;
  customer_phone: string;
  customer_name: string;
  last_message_at: string;
  unread_count: number;
  last_message_content: string;
  last_message_direction: 'incoming' | 'outgoing';
  last_message_type: string;
}

interface Message {
  id: string;
  whatsapp_message_id: string;
  direction: 'incoming' | 'outgoing';
  message_type: string;
  content: string;
  media_url?: string;
  filename?: string;
  status: string;
  timestamp: string;
}

export default function MessagesPage() {
  const { isAuthenticated, loading } = useAdminAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/admin/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        
        // Mark conversation as read
        await fetch(`/api/admin/conversations/${conversationId}/mark-read`, {
          method: 'POST'
        });
        
        // Update conversation unread count in UI
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
        ));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: selectedConversation.customer_phone,
          message: newMessage.trim()
        })
      });

      if (response.ok) {
        setNewMessage("");
        // Refresh messages
        await fetchMessages(selectedConversation.id);
        // Refresh conversations to update last message
        await fetchConversations();
      } else {
        const error = await response.json();
        alert(`Error sending message: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-MX', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('es-MX', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
      
      // Refresh conversations every 30 seconds
      const interval = setInterval(fetchConversations, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Refresh messages every 10 seconds when conversation is selected
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500 mb-4"></div>
          <p className="text-white text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-slate-800/30 p-8">
          <p className="text-white text-xl">Acceso no autorizado</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mensajes WhatsApp</h1>
          <p className="text-slate-400">Gestiona las conversaciones con tus clientes</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="bg-slate-800/30 rounded-xl lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Conversaciones
                {conversations.length > 0 && (
                  <span className="bg-slate-600 text-xs px-2 py-1 rounded-full">
                    {conversations.length}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {loadingConversations ? (
                  <div className="p-4 text-center text-slate-400">
                    Cargando conversaciones...
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    No hay conversaciones
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={`p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-700/30 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-slate-700/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{conversation.customer_name}</span>
                            {conversation.unread_count > 0 && (
                              <span className="bg-red-500 text-xs px-2 py-1 rounded-full">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Phone className="h-3 w-3 text-slate-500" />
                            <span className="text-sm text-slate-400">{conversation.customer_phone}</span>
                          </div>
                          <p className="text-sm text-slate-300 truncate">
                            {conversation.last_message_direction === 'outgoing' ? '→ ' : '← '}
                            {conversation.last_message_content || 'Archivo multimedia'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(conversation.last_message_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="bg-slate-800/30 rounded-xl lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="flex items-center gap-3">
                    <User className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{selectedConversation.customer_name}</div>
                      <div className="text-sm text-slate-400 font-normal">
                        {selectedConversation.customer_phone}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {/* Messages */}
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-400px)]">
                    {loadingMessages ? (
                      <div className="text-center text-slate-400">
                        Cargando mensajes...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-slate-400">
                        No hay mensajes en esta conversación
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.direction === 'outgoing'
                                ? 'bg-red-600 text-white'
                                : 'bg-slate-700 text-white'
                            }`}
                          >
                            {message.message_type === 'text' ? (
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm">📎 {message.filename || 'Archivo'}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs opacity-70">
                                {formatTimestamp(message.timestamp)}
                              </span>
                              {message.direction === 'outgoing' && (
                                <span className="text-xs opacity-70">
                                  {message.status === 'sent' && '✓'}
                                  {message.status === 'delivered' && '✓✓'}
                                  {message.status === 'read' && '✓✓'}
                                  {message.status === 'failed' && '✗'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-slate-700 p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none"
                        disabled={sending}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        variant="primary"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center text-slate-400">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Selecciona una conversación para ver los mensajes</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
