"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, Clock, User, MessageCircle } from "lucide-react";

interface Notification {
  id: string;
  kind: string;
  payload: any;
  readAt?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("http://localhost:4000/notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`http://localhost:4000/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, readAt: new Date().toISOString() }
              : n
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (kind: string) => {
    switch (kind) {
      case "booking_request":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "booking_accepted":
        return <Check className="w-5 h-5 text-green-400" />;
      case "booking_declined":
        return <X className="w-5 h-5 text-red-400" />;
      case "booking_completed":
        return <Check className="w-5 h-5 text-blue-400" />;
      case "message":
        return <MessageCircle className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  const getNotificationTitle = (kind: string, payload: any) => {
    switch (kind) {
      case "booking_request":
        return `New time request from ${payload.requesterName || "someone"}`;
      case "booking_accepted":
        return `Your time request was accepted`;
      case "booking_declined":
        return `Your time request was declined`;
      case "booking_completed":
        return `Time session completed`;
      case "message":
        return `New message from ${payload.senderName || "someone"}`;
      default:
        return "Notification";
    }
  };

  const getNotificationDescription = (kind: string, payload: any) => {
    switch (kind) {
      case "booking_request":
        return `${payload.hours || 0} hours for ${payload.category || "service"}`;
      case "booking_accepted":
        return `Your request for ${payload.hours || 0} hours has been accepted`;
      case "booking_declined":
        return `Your request for ${payload.hours || 0} hours was declined`;
      case "booking_completed":
        return `You earned ${payload.hours || 0} hours from the session`;
      case "message":
        return payload.message || "You have a new message";
      default:
        return "You have a new notification";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-6 h-20"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
          Notifications
        </h1>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border transition-all ${
                notification.readAt 
                  ? "border-slate-700 opacity-75" 
                  : "border-yellow-400/50 bg-yellow-400/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
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
                  </div>
                </div>

                {!notification.readAt && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-4 px-3 py-1 bg-yellow-400 text-slate-900 rounded-lg text-sm font-medium hover:bg-yellow-300 transition-all"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No notifications</h3>
            <p className="text-slate-500">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
