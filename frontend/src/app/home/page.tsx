"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  Users,
  TrendingUp,
  Award,
  Heart,
  MessageCircle,
  Sparkles,
  Zap,
  Target
} from "lucide-react";
import toast from "react-hot-toast";

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

export default function HomePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [recommendations, setRecommendations] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("reputation");
  const [activeTab, setActiveTab] = useState("discover");

  useEffect(() => {
    fetchUsers();
    fetchRecommendations();
  }, [searchQuery, selectedSkills, sortBy]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("query", searchQuery);
      if (selectedSkills.length > 0) params.append("skills", selectedSkills.join(","));
      params.append("sortBy", sortBy);

      const response = await fetch(`/api/discovery/search?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch("/api/discovery/recommendations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    }
  };

  const skills = [
    "Web Development", "Mobile Development", "Design", "Writing", "Marketing",
    "Photography", "Video Editing", "Music", "Teaching", "Consulting",
    "Translation", "Data Analysis", "Project Management", "Customer Service",
    "Sales", "Accounting", "Legal", "Healthcare", "Fitness", "Cooking"
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Gold': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'Silver': return 'text-gray-300 bg-gray-300/20 border-gray-300/30';
      case 'Bronze': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      default: return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
    }
  };

  const handleUserClick = (userId: string) => {
    window.location.href = `/users/${userId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">Discover TimeBank</h1>
            <p className="text-slate-300 text-lg">Find amazing people to exchange time with</p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setActiveTab("discover")}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  activeTab === "discover"
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Discover</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("recommendations")}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  activeTab === "recommendations"
                    ? "bg-purple-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>For You</span>
                </div>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          {activeTab === "discover" && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by name, skills, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="lg:w-48">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="reputation">Sort by Reputation</option>
                    <option value="rating">Sort by Rating</option>
                    <option value="recent">Sort by Recent</option>
                    <option value="availability">Sort by Availability</option>
                  </select>
                </div>
              </div>

              {/* Skills Filter */}
              <div className="mt-4">
                <p className="text-slate-300 text-sm mb-2">Filter by skills:</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => {
                        if (selectedSkills.includes(skill)) {
                          setSelectedSkills(selectedSkills.filter(s => s !== skill));
                        } else {
                          setSelectedSkills([...selectedSkills, skill]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedSkills.includes(skill)
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recommendations Header */}
          {activeTab === "recommendations" && (
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-semibold text-white">Recommended for You</h2>
              </div>
              <p className="text-slate-300">Based on your skills, location, and preferences</p>
            </div>
          )}

          {/* Users Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 animate-pulse">
                  <div className="w-16 h-16 bg-slate-700 rounded-full mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded mb-4"></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 bg-slate-700 rounded w-20"></div>
                    <div className="h-6 bg-slate-700 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === "discover" ? users : recommendations).map((user: User) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all cursor-pointer group"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="relative">
                      <img
                        src={user.profile?.avatarUrl || '/default-avatar.png'}
                        alt={user.profile?.displayName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-500"
                      />
                      <div className={`absolute -bottom-1 -right-1 px-2 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(user.profile?.trustBadge || 'New')}`}>
                        {user.profile?.trustBadge || 'New'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold group-hover:text-purple-300 transition-colors">
                        {user.profile?.displayName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-400 mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{user.profile?.ratingAvg?.toFixed(1) || '0.0'}</span>
                          <span className="text-slate-500">({user.profile?.totalRatings || 0})</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span>{user.reputation}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {user.profile?.bio || 'No bio available'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {user.profile?.skills?.slice(0, 3).map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs border border-purple-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                    {user.profile?.skills?.length > 3 && (
                      <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded-full text-xs">
                        +{user.profile.skills.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-slate-400 text-sm">
                      {user.profile?.location && (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>{user.profile.location}</span>
                        </>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success("Added to favorites!");
                        }}
                      >
                        <Heart className="w-4 h-4 text-slate-300" />
                      </button>
                      <button 
                        className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUserClick(user.id);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Recommendation reason */}
                  {activeTab === "recommendations" && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Target className="w-3 h-3" />
                        <span>Similar skills & location</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {!loading && (activeTab === "discover" ? users : recommendations).length === 0 && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">
                {activeTab === "discover" ? "No users found" : "No recommendations yet"}
              </h3>
              <p className="text-slate-500">
                {activeTab === "discover" 
                  ? "Try adjusting your search criteria" 
                  : "Complete your profile to get personalized recommendations"
                }
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-white mb-1">1,234</h3>
              <p className="text-slate-400">Active Users</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-white mb-1">5,678</h3>
              <p className="text-slate-400">Hours Exchanged</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 text-center">
              <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-white mb-1">4.8</h3>
              <p className="text-slate-400">Average Rating</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}