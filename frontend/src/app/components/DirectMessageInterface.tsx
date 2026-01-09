"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, User } from "lucide-react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string;
    profile?: {
      displayName: string;
    };
  };
  createdAt: string;
  messageType: string;
  readAt?: string;
}

interface DirectMessageInterfaceProps {
  receiverId: string;
  receiverName: string;
  onClose?: () => void;
}

export default function DirectMessageInterface({ receiverId, receiverName, onClose }: DirectMessageInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Initialize Socket.io connection
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000", {
      auth: { token }
    });

    newSocket.on("connect", () => {
      console.log("Connected to chat server");
      // Join user's personal room for direct messages
      const userData = localStorage.getItem("userId");
      if (userData) {
        newSocket.emit("join-user", userData);
      }
    });

    newSocket.on("new-message", (message: Message) => {
      // Check if this message is for this conversation
      if ((message.senderId === receiverId && message.receiverId === currentUserId) ||
          (message.senderId === currentUserId && message.receiverId === receiverId)) {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      }
    });

    newSocket.on("error", (error: { message: string }) => {
      toast.error(error.message);
    });

    setSocket(newSocket);
    fetchMessages();

    return () => {
      newSocket.disconnect();
    };
  }, [receiverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await api.get(`/api/messages/direct/${receiverId}`);
      setMessages(Array.isArray(data) ? data : []);
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
      // Try socket first, fallback to API
      if (socket && socket.connected) {
        socket.emit("send-direct-message", {
          receiverId,
          content: messageContent,
          messageType: "TEXT"
        });
        
        // Optimistically add message
        if (currentUserId) {
          const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            content: messageContent,
            senderId: currentUserId,
            sender: {
              id: currentUserId,
              name: "You",
              avatarUrl: undefined,
              profile: { displayName: "You" }
            },
            createdAt: new Date().toISOString(),
            messageType: "TEXT"
          };
          setMessages(prev => [...prev, tempMessage]);
          scrollToBottom();
        }
      } else {
        // Fallback to API
        await api.post("/api/messages", {
          receiverId,
          content: messageContent,
          messageType: "TEXT"
        });
        
        // Refresh messages
        fetchMessages();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
      setNewMessage(messageContent); // Restore message on error
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID
    api.get("/api/auth/me")
      .then((data: any) => {
        if (data && data.user) {
          setCurrentUserId(data.user.id);
          if (typeof window !== "undefined") {
            localStorage.setItem("userId", data.user.id);
          }
        }
      })
      .catch(() => {
        // Fallback to localStorage
        if (typeof window !== "undefined") {
          setCurrentUserId(localStorage.getItem("userId"));
        }
      });
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{receiverName}</h3>
            <p className="text-xs text-slate-400">Direct message</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUserId;
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[70%] ${isOwn ? "bg-purple-600" : "bg-slate-700"} rounded-lg p-3`}>
                  {!isOwn && (
                    <p className="text-xs text-slate-300 mb-1">
                      {message.sender.profile?.displayName || message.sender.name}
                    </p>
                  )}
                  <p className="text-white text-sm">{message.content}</p>
                  <p className="text-xs text-slate-300 mt-1">{formatTime(message.createdAt)}</p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

