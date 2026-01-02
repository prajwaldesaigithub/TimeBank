"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Clock, 
  Users, 
  TrendingUp, 
  Bell,
  Star,
  Calendar,
  MessageCircle,
  Wallet,
  Settings,
  Plus,
  Search,
  Filter,
  Award,
  CreditCard,
  Send,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface DashboardStats {
  credits: number;
  reputation: number;
  averageRating: number;
  totalRatings: number;
  totalEarned: number;
  totalSpent: number;
  completedTransactions: number;
  pendingTransactions: number;
}

interface TimeRequest {
  id: string;
  title: string;
  description: string;
  duration: number;
  credits: number;
  status: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl: string;
    profile: {
      displayName: string;
    };
  };
  receiver?: {
    id: string;
    name: string;
    avatarUrl: string;
    profile: {
      displayName: string;
    };
  };
}

interface Conversation {
  id: string;
  title: string;
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string;
    profile: {
      displayName: string;
    };
  };
  lastMessage?: {
    content: string;
    senderName: string;
    createdAt: string;
  };
  status: string;
  unreadCount: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [timeRequests, setTimeRequests] = useState<TimeRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, requestsData, conversationsData] = await Promise.all([
        api.get("/api/transactions/stats").catch(() => null),
        api.get("/api/time-requests/user/me").catch(() => ({ sent: [], received: [] })),
        api.get("/api/messages/conversations").catch(() => [])
      ]);

      if (statsData) {
        setStats(statsData);
      }

      if (requestsData) {
        setTimeRequests([...(requestsData.sent || []), ...(requestsData.received || [])]);
      }

      if (conversationsData) {
        setConversations(Array.isArray(conversationsData) ? conversationsData : []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "requests", label: "Requests", icon: Clock },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
      case 'ACCEPTED': return 'bg-blue-500/20 text-blue-400';
      case 'COMPLETED': return 'bg-green-500/20 text-green-400';
      case 'REJECTED': return 'bg-red-500/20 text-red-400';
      case 'CANCELLED': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-300">Welcome back! Here's what's happening with your time exchanges.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Credits</p>
                  <p className="text-2xl font-bold text-white">{stats?.credits || 0}</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Reputation</p>
                  <p className="text-2xl font-bold text-white">{stats?.reputation || 0}</p>
                </div>
                <Award className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Rating</p>
                  <p className="text-2xl font-bold text-white">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
                </div>
                <Star className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">{stats?.completedTransactions || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? "bg-purple-600 text-white"
                            : "text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                {activeTab === "overview" && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-6">Overview</h2>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-3">Recent Time Requests</h3>
                        <div className="space-y-3">
                          {timeRequests.slice(0, 3).map((request) => (
                            <div key={request.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                              <div className={`w-2 h-2 rounded-full ${
                                request.status === 'COMPLETED' ? 'bg-green-400' :
                                request.status === 'PENDING' ? 'bg-yellow-400' :
                                request.status === 'ACCEPTED' ? 'bg-blue-400' : 'bg-gray-400'
                              }`}></div>
                              <div className="flex-1">
                                <p className="text-slate-300">{request.title}</p>
                                <p className="text-slate-500 text-sm">
                                  {request.sender?.profile.displayName || request.receiver?.profile.displayName} • 
                                  {request.duration}h • {request.credits} credits
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-white mb-3">Recent Messages</h3>
                        <div className="space-y-3">
                          {conversations.slice(0, 3).map((conversation) => (
                            <div key={conversation.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {conversation.otherUser.profile.displayName.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium">{conversation.otherUser.profile.displayName}</p>
                                <p className="text-slate-400 text-sm truncate">
                                  {conversation.lastMessage?.content || 'No messages yet'}
                                </p>
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">{conversation.unreadCount}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "requests" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">Time Requests</h2>
                      <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>New Request</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      {timeRequests.length === 0 ? (
                        <div className="text-center py-8">
                          <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                          <p className="text-slate-400">No time requests yet</p>
                          <p className="text-slate-500 text-sm">Start by browsing users and sending requests</p>
                        </div>
                      ) : (
                        timeRequests.map((request) => (
                          <div key={request.id} className="p-4 bg-slate-700/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-white font-medium">{request.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                                {request.status}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm mb-3">{request.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 text-sm">
                                {request.sender?.profile.displayName || request.receiver?.profile.displayName}
                              </span>
                              <span className="text-slate-500 text-sm">
                                {request.duration}h • {request.credits} credits
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "messages" && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white">Messages</h2>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                          <Search className="w-4 h-4 text-slate-300" />
                        </button>
                        <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                          <Filter className="w-4 h-4 text-slate-300" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {conversations.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                          <p className="text-slate-400">No conversations yet</p>
                          <p className="text-slate-500 text-sm">Start a conversation by accepting a time request</p>
                        </div>
                      ) : (
                        conversations.map((conversation) => (
                          <div key={conversation.id} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors cursor-pointer">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {conversation.otherUser.profile.displayName.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="text-white font-medium">{conversation.otherUser.profile.displayName}</h3>
                                <span className="text-slate-500 text-sm">
                                  {conversation.lastMessage ? new Date(conversation.lastMessage.createdAt).toLocaleDateString() : ''}
                                </span>
                              </div>
                              <p className="text-slate-400 text-sm truncate">
                                {conversation.lastMessage?.content || 'No messages yet'}
                              </p>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-semibold">{conversation.unreadCount}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "wallet" && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-6">Wallet</h2>
                    <div className="space-y-6">
                      <div className="text-center">
                        <p className="text-slate-400 mb-2">Current Balance</p>
                        <p className="text-4xl font-bold text-white">{stats?.credits || 0}</p>
                        <p className="text-slate-500">credits</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors">
                          Buy Credits
                        </button>
                        <button className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors">
                          Transaction History
                        </button>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium text-white mb-3">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-700/50 rounded-lg">
                            <p className="text-slate-400 text-sm">Total Earned</p>
                            <p className="text-white font-semibold">{stats?.totalEarned || 0}</p>
                          </div>
                          <div className="p-3 bg-slate-700/50 rounded-lg">
                            <p className="text-slate-400 text-sm">Total Spent</p>
                            <p className="text-white font-semibold">{stats?.totalSpent || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "notifications" && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-6">Notifications</h2>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                        <div>
                          <p className="text-white">New time request from Jane Smith</p>
                          <p className="text-slate-500 text-sm">5 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                        <div>
                          <p className="text-white">Session completed with John Doe</p>
                          <p className="text-slate-500 text-sm">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "settings" && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-6">Settings</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-white">Email Notifications</span>
                        <input type="checkbox" className="w-4 h-4 text-purple-600" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-white">Push Notifications</span>
                        <input type="checkbox" className="w-4 h-4 text-purple-600" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <span className="text-white">Profile Visibility</span>
                        <select className="bg-slate-700 text-white px-3 py-1 rounded">
                          <option>Public</option>
                          <option>Private</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}