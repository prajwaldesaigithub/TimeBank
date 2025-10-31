"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  Phone,
  Video,
  Info,
  X
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string;
  };
  createdAt: string;
  messageType: string;
  readAt?: string;
}

interface ChatInterfaceProps {
  requestId: string;
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string;
    profile: {
      displayName: string;
    };
  };
  onClose?: () => void;
}

export default function ChatInterface({ requestId, otherUser, onClose }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Initialize Socket.io connection
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      auth: { token }
    });

    newSocket.on("connect", () => {
      console.log("Connected to chat server");
      newSocket.emit("join-request", requestId);
    });

    newSocket.on("joined-request", () => {
      console.log("Joined request chat room");
    });

    newSocket.on("new-message", (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    newSocket.on("user-typing", (data: { userId: string; userName: string }) => {
      if (data.userId !== localStorage.getItem("userId")) {
        setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    newSocket.on("user-stopped-typing", (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(id => id !== data.userId));
      if (typingUsers.length <= 1) {
        setIsTyping(false);
      }
    });

    newSocket.on("error", (error: { message: string }) => {
      toast.error(error.message);
    });

    setSocket(newSocket);

    // Fetch existing messages
    fetchMessages();

    return () => {
      newSocket.disconnect();
    };
  }, [requestId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/messages/conversation/${requestId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !socket) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      socket.emit("send-message", {
        requestId,
        content: messageContent,
        messageType: "TEXT"
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!socket) return;
    
    socket.emit("typing-start", { requestId });
    
    // Stop typing after 3 seconds of inactivity
    setTimeout(() => {
      socket.emit("typing-stop", { requestId });
    }, 3000);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <img
            src={otherUser.avatarUrl || '/default-avatar.png'}
            alt={otherUser.profile.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="text-white font-semibold">{otherUser.profile.displayName}</h3>
            <p className="text-slate-400 text-sm">Active now</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Phone className="w-5 h-5 text-slate-300" />
          </button>
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Video className="w-5 h-5 text-slate-300" />
          </button>
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Info className="w-5 h-5 text-slate-300" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-300" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => {
            const isOwn = message.senderId === localStorage.getItem("userId");
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {!isOwn && (
                    <img
                      src={message.sender.avatarUrl || '/default-avatar.png'}
                      alt={message.sender.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className={`px-4 py-2 rounded-2xl ${
                    isOwn 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-slate-700 text-slate-100'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-purple-200' : 'text-slate-400'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex items-end space-x-2">
              <img
                src={otherUser.avatarUrl || '/default-avatar.png'}
                alt={otherUser.profile.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="bg-slate-700 px-4 py-2 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Paperclip className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Smile className="w-5 h-5 text-slate-300" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
