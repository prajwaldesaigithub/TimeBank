"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Wallet,
  Bell,
  User,
  Users,
  Clock,
  ArrowRight,
  LogOut
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

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh stats when transaction completes
    const handleTransactionComplete = () => {
      fetchDashboardData();
    };
    
    // Refresh stats when rating is submitted
    const handleRatingSubmitted = () => {
      fetchDashboardData();
    };
    
    window.addEventListener('transactionCompleted', handleTransactionComplete);
    window.addEventListener('ratingSubmitted', handleRatingSubmitted);
    
    return () => {
      window.removeEventListener('transactionCompleted', handleTransactionComplete);
      window.removeEventListener('ratingSubmitted', handleRatingSubmitted);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const statsData = await api.get("/api/transactions/stats").catch(() => null);
      if (statsData) {
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    toast.success("Logged out successfully");
    router.replace("/login");
  };

  const contentContainers = [
    {
      id: "wallet",
      title: "Wallet",
      description: "View your credits and transaction history",
      icon: Wallet,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
      route: "/dashboard/wallet"
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "View and respond to notifications and messages",
      icon: Bell,
      color: "from-yellow-500 to-amber-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
      route: "/dashboard/notifications"
    },
    {
      id: "profile",
      title: "Profile",
      description: "Manage your profile and settings",
      icon: User,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      route: "/dashboard/profile"
    },
    {
      id: "directory",
      title: "Directory",
      description: "Browse and discover other users",
      icon: Users,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
      route: "/dashboard/directory"
    },
    {
      id: "requests",
      title: "Requests",
      description: "Manage your time requests and history",
      icon: Clock,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      route: "/dashboard/requests"
    }
  ];

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
      {/* Top Right Corner - Logout */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-red-400/30 flex items-center gap-2 text-white font-medium transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </motion.button>
      </div>

      <div className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-300">Welcome back! Manage your time exchanges and connections.</p>
          </div>

          {/* Content Containers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contentContainers.map((container) => {
              const Icon = container.icon;
              return (
                <motion.div
                  key={container.id}
                  whileHover={{ scale: 1.03, y: -5 }}
                  onClick={() => router.push(container.route)}
                  className={`${container.bgColor} ${container.borderColor} border-2 rounded-xl p-6 cursor-pointer transition-all group`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${container.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className={`w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{container.title}</h3>
                  <p className="text-slate-400 text-sm">{container.description}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}