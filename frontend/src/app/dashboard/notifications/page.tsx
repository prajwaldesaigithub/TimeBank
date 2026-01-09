"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  MessageCircle,
  Send,
  User,
  AlertCircle,
  MapPin
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import ChatInterface from "@/app/components/ChatInterface";

interface Notification {
  id: string;
  kind: string;
  payload: any;
  readAt?: string;
  createdAt: string;
}

interface Booking {
  id: string;
  providerId: string;
  receiverId: string;
  hours: string;
  category: string;
  note?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  provider?: {
    id: string;
    name: string;
    avatarUrl?: string;
    profile?: {
      displayName: string;
    };
  };
  receiver?: {
    id: string;
    name: string;
    avatarUrl?: string;
    profile?: {
      displayName: string;
    };
  };
}

interface MessageSender {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  profile?: {
    displayName: string;
    location?: string;
    ratingAvg?: number;
    avatarUrl?: string;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messageSenders, setMessageSenders] = useState<MessageSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatRequestId, setChatRequestId] = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState<"notifications" | "messages">("notifications");

  useEffect(() => {
    fetchNotifications();
    fetchMessageSenders();
    // Set up polling for new notifications
    const interval = setInterval(() => {
      fetchNotifications();
      fetchMessageSenders();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMessageSenders = async () => {
    try {
      const data = await api.get("/api/messages/senders");
      setMessageSenders(data.users || []);
    } catch (error) {
      console.error("Failed to fetch message senders:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await api.get("/api/notifications");
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, readAt: new Date().toISOString() }
            : n
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleBookingAction = async (bookingId: string, action: "accept" | "decline" | "cancel") => {
    try {
      const body = action === "accept" ? { slot: new Date().toISOString() } : undefined;
      await api.patch(`/api/booking/${bookingId}/${action}`, body);
      toast.success(`Booking ${action}ed successfully`);
      fetchNotifications(); // Refresh notifications
    } catch (error: any) {
      console.error(`Failed to ${action} booking:`, error);
      toast.error(error.message || `Failed to ${action} booking`);
    }
  };

  const handleSendMessage = async (receiverId: string, content: string) => {
    if (!content.trim()) return;
    
    try {
      await api.post("/api/messages", {
        receiverId,
        content: content.trim(),
        messageType: "TEXT"
      });
      toast.success("Message sent");
      setMessageText("");
      fetchNotifications(); // Refresh to show new notification
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error(error.message || "Failed to send message");
    }
  };

  const openChat = (requestId: string, otherUser: any) => {
    setChatRequestId(requestId);
    setChatUser(otherUser);
    setShowChat(true);
  };

  const getNotificationIcon = (kind: string) => {
    switch (kind) {
      case "booking_request":
      case "NEW_BOOKING_REQUEST":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "booking_accepted":
      case "BOOKING_ACCEPTED":
        return <Check className="w-5 h-5 text-green-400" />;
      case "booking_declined":
      case "BOOKING_DECLINED":
        return <X className="w-5 h-5 text-red-400" />;
      case "booking_cancelled":
      case "BOOKING_CANCELLED":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case "booking_completed":
      case "BOOKING_COMPLETED":
        return <Check className="w-5 h-5 text-blue-400" />;
      case "message":
      case "NEW_MESSAGE":
        return <MessageCircle className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationTitle = (kind: string, payload: any) => {
    switch (kind) {
      case "booking_request":
      case "NEW_BOOKING_REQUEST":
        return `New time request from ${payload.requesterName || payload.senderName || "someone"}`;
      case "booking_accepted":
      case "BOOKING_ACCEPTED":
        return `Your time request was accepted`;
      case "booking_declined":
      case "BOOKING_DECLINED":
        return `Your time request was declined`;
      case "booking_cancelled":
      case "BOOKING_CANCELLED":
        return `Time request was cancelled`;
      case "booking_completed":
      case "BOOKING_COMPLETED":
        return `Time session completed`;
      case "message":
      case "NEW_MESSAGE":
        return `New message from ${payload.senderName || "someone"}`;
      default:
        return "Notification";
    }
  };

  const getNotificationDescription = (kind: string, payload: any) => {
    switch (kind) {
      case "booking_request":
      case "NEW_BOOKING_REQUEST":
        return `${payload.hours || 0} hours for ${payload.category || "service"}`;
      case "booking_accepted":
      case "BOOKING_ACCEPTED":
        return `Your request for ${payload.hours || 0} hours has been accepted`;
      case "booking_declined":
      case "BOOKING_DECLINED":
        return `Your request for ${payload.hours || 0} hours was declined`;
      case "booking_cancelled":
      case "BOOKING_CANCELLED":
        return `The time request has been cancelled`;
      case "booking_completed":
      case "BOOKING_COMPLETED":
        return `You earned ${payload.hours || 0} hours from the session`;
      case "message":
      case "NEW_MESSAGE":
        return payload.content || payload.message || "You have a new message";
      default:
        return "You have a new notification";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
              <p className="text-slate-300">Stay updated with your time exchanges and messages</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "notifications"
                  ? "bg-yellow-400 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "messages"
                  ? "bg-yellow-400 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Message Senders ({messageSenders.length})
            </button>
          </div>

          {/* Message Senders Tab */}
          {activeTab === "messages" && (
            <div className="space-y-4 mb-8">
              {messageSenders.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">No messages yet</h3>
                  <p className="text-slate-500">Users who send you messages will appear here</p>
                </div>
              ) : (
                messageSenders.map((sender) => (
                  <div
                    key={sender.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-purple-400/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {sender.profile?.avatarUrl || sender.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sender.profile?.avatarUrl || sender.avatarUrl}
                            alt={sender.profile?.displayName || sender.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {(sender.profile?.displayName || sender.name).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-white text-lg">
                            {sender.profile?.displayName || sender.name}
                          </h3>
                          {sender.profile?.location && (
                            <p className="text-slate-400 text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {sender.profile.location}
                            </p>
                          )}
                          {sender.profile?.ratingAvg && (
                            <p className="text-yellow-400 text-sm">
                              ⭐ {sender.profile.ratingAvg.toFixed(1)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setChatUser({
                            id: sender.id,
                            name: sender.profile?.displayName || sender.name,
                            profile: { displayName: sender.profile?.displayName || sender.name }
                          });
                          setChatRequestId(null);
                          setShowChat(true);
                        }}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Notifications List */}
          {activeTab === "notifications" && (
            <div className="space-y-4 mb-8">
              {notifications.map((notification) => {
                const isUnread = !notification.readAt;
                const isBookingRequest =
                  notification.kind === "booking_request" || notification.kind === "NEW_BOOKING_REQUEST";
                const isMessage = notification.kind === "message" || notification.kind === "NEW_MESSAGE";

                return (
                  <div
                    key={notification.id}
                    className={`bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border transition-all ${
                      isUnread ? "border-yellow-400/50 bg-yellow-400/5" : "border-slate-700 opacity-75"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        {getNotificationIcon(notification.kind)}
                        <div className="ml-4 flex-1">
                          <h3 className="font-semibold text-slate-100 mb-1">
                            {getNotificationTitle(notification.kind, notification.payload)}
                          </h3>
                          <p className="text-slate-300 text-sm mb-2">
                            {getNotificationDescription(notification.kind, notification.payload)}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>

                          {/* Action Buttons for Booking Requests */}
                          {isBookingRequest && notification.payload.bookingId && (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => {
                                  handleBookingAction(notification.payload.bookingId, "accept");
                                  markAsRead(notification.id);
                                }}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  handleBookingAction(notification.payload.bookingId, "decline");
                                  markAsRead(notification.id);
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => {
                                  if (notification.payload.requestId) {
                                    openChat(notification.payload.requestId, {
                                      id: notification.payload.senderId,
                                      name: notification.payload.senderName || "User",
                                      profile: { displayName: notification.payload.senderName || "User" },
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </button>
                            </div>
                          )}

                          {/* Message Reply Section */}
                          {isMessage && notification.payload.senderId && (
                            <div className="mt-4 space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={messageText}
                                  onChange={(e) => setMessageText(e.target.value)}
                                  placeholder="Type a message..."
                                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleSendMessage(notification.payload.senderId, messageText);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    handleSendMessage(notification.payload.senderId, messageText);
                                    markAsRead(notification.id);
                                  }}
                                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all flex items-center gap-2"
                                >
                                  <Send className="w-4 h-4" />
                                  Send
                                </button>
                              </div>
                              {notification.payload.requestId && (
                                <button
                                  onClick={() => {
                                    openChat(notification.payload.requestId, {
                                      id: notification.payload.senderId,
                                      name: notification.payload.senderName || "User",
                                      profile: { displayName: notification.payload.senderName || "User" },
                                    });
                                  }}
                                  className="text-sm text-purple-400 hover:text-purple-300"
                                >
                                  Open full conversation
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isUnread && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="ml-4 px-3 py-1 bg-yellow-400 text-slate-900 rounded-lg text-sm font-medium hover:bg-yellow-300 transition-all"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {notifications.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">No notifications</h3>
                  <p className="text-slate-500">You're all caught up!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface Modal */}
      {showChat && chatRequestId && chatUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Chat with {chatUser.profile?.displayName || chatUser.name}</h3>
              <button
                onClick={() => {
                  setShowChat(false);
                  setChatRequestId(null);
                  setChatUser(null);
                }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                requestId={chatRequestId}
                otherUser={chatUser}
                onClose={() => {
                  setShowChat(false);
                  setChatRequestId(null);
                  setChatUser(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

