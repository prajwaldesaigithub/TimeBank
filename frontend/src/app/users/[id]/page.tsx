"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Star, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Heart, 
  Share2, 
  Play,
  Award,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { parseJsonArray } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  reputation: number;
  lastActiveAt: string;
  profile: {
    displayName: string;
    bio: string;
    skills: string[];
    location: string;
    ratingAvg: number;
    totalRatings: number;
    avatarUrl: string;
    introMedia: string;
    trustBadge: string;
  };
}

interface TimeRequestForm {
  title: string;
  description: string;
  duration: number;
  proposedDate: string;
  credits: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [requestForm, setRequestForm] = useState<TimeRequestForm>({
    title: '',
    description: '',
    duration: 1,
    proposedDate: '',
    credits: 5
  });

  useEffect(() => {
    if (params.id) {
      fetchUserProfile(params.id as string);
      checkFollowingStatus(params.id as string);
    }
  }, [params.id]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userData = await api.get(`/api/discovery/user/${userId}`);
      // Parse JSON strings to arrays for SQLite compatibility
      if (userData.profile) {
        userData.profile.skills = parseJsonArray(userData.profile.skills);
      }
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      toast.error("Failed to load user profile");
      router.push('/home');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatus = async (userId: string) => {
    try {
      const data = await api.get(`/api/connections/${userId}/following`);
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error("Failed to check follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!user) return;
    setIsFollowingLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/api/connections/${user.id}/follow`);
        setIsFollowing(false);
        toast.success("Unfollowed successfully");
      } else {
        await api.post(`/api/connections/${user.id}/follow`);
        setIsFollowing(true);
        toast.success("Following user");
      }
    } catch (error: any) {
      console.error("Failed to toggle follow:", error);
      toast.error(error.message || "Failed to update follow status");
    } finally {
      setIsFollowingLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await api.post('/api/time-requests', {
        receiverId: user.id,
        ...requestForm
      });
      toast.success("Time request sent successfully!");
      setShowRequestForm(false);
      setRequestForm({
        title: '',
        description: '',
        duration: 1,
        proposedDate: '',
        credits: 5
      });
    } catch (error: any) {
      console.error("Failed to send time request:", error);
      toast.error(error.message || "Failed to send time request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Gold': return 'text-yellow-400 bg-yellow-400/20';
      case 'Silver': return 'text-gray-300 bg-gray-300/20';
      case 'Bronze': return 'text-orange-400 bg-orange-400/20';
      default: return 'text-blue-400 bg-blue-400/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-300">User not found</p>
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
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src={user.profile.avatarUrl || '/default-avatar.png'}
                    alt={user.profile.displayName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-purple-500"
                  />
                  <div className={`absolute -bottom-1 -right-1 px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(user.profile.trustBadge)}`}>
                    {user.profile.trustBadge}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{user.profile.displayName}</h1>
                  <p className="text-slate-400">@{user.name}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-slate-300">{user.profile.ratingAvg.toFixed(1)}</span>
                      <span className="text-slate-500">({user.profile.totalRatings})</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300">{user.reputation}</span>
                    </div>
                    {user.profile.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">{user.profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleFollow}
                  disabled={isFollowingLoading}
                  className={`p-2 rounded-lg transition-colors ${
                    isFollowing 
                      ? "bg-purple-600 hover:bg-purple-700" 
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFollowing ? "text-white fill-current" : "text-slate-300"}`} />
                </button>
                <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                  <Share2 className="w-5 h-5 text-slate-300" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">About</h2>
                <p className="text-slate-300 leading-relaxed">{user.profile.bio}</p>
              </div>

              {/* Skills */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h2 className="text-xl font-semibold text-white mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {user.profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Intro Media */}
              {user.profile.introMedia && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                  <h2 className="text-xl font-semibold text-white mb-4">Introduction</h2>
                  <div className="relative">
                    <img
                      src={user.profile.introMedia}
                      alt="Introduction"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors rounded-lg">
                      <Play className="w-12 h-12 text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Request Time Button */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  Request Time
                </button>
              </div>

              {/* Stats */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Reputation</span>
                    <span className="text-white font-semibold">{user.reputation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rating</span>
                    <span className="text-white font-semibold">{user.profile.ratingAvg.toFixed(1)}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Reviews</span>
                    <span className="text-white font-semibold">{user.profile.totalRatings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Last Active</span>
                    <span className="text-white font-semibold">
                      {new Date(user.lastActiveAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center space-x-2 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <MessageCircle className="w-5 h-5 text-slate-300" />
                    <span className="text-slate-300">Send Message</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <Calendar className="w-5 h-5 text-slate-300" />
                    <span className="text-slate-300">View Availability</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors">
                    <Users className="w-5 h-5 text-slate-300" />
                    <span className="text-slate-300">View Reviews</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Time Request Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700"
          >
            <h3 className="text-xl font-semibold text-white mb-4">Request Time from {user.profile.displayName}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input
                  type="text"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({...requestForm, title: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="What do you need help with?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe what you need help with in detail..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Duration (hours)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={requestForm.duration}
                    onChange={(e) => setRequestForm({...requestForm, duration: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Credits</label>
                  <input
                    type="number"
                    min="1"
                    value={requestForm.credits}
                    onChange={(e) => setRequestForm({...requestForm, credits: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proposed Date</label>
                <input
                  type="datetime-local"
                  value={requestForm.proposedDate}
                  onChange={(e) => setRequestForm({...requestForm, proposedDate: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRequestForm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={isSubmitting || !requestForm.title || !requestForm.description}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
