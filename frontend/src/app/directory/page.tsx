"use client";

import { useState, useEffect } from "react";
import { Search, Filter, User, MapPin, Star, Clock } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { parseJsonArray } from "@/lib/utils";

interface Profile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  skills: string[];
  categories: string[];
  location?: string;
  ratingAvg?: number;
}

export default function DirectoryPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState("");
  const [categories, setCategories] = useState("");
  const [location, setLocation] = useState("");
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [showRequestModal, setShowRequestModal] = useState<string | null>(null);
  const [requestData, setRequestData] = useState({ hours: "", category: "", note: "" });

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (skills) params.append("skills", skills);
      if (categories) params.append("categories", categories);
      if (location) params.append("location", location);

      const data = await api.get(`/api/profiles?${params}`);
      // Parse JSON strings to arrays for SQLite compatibility
      const parsedProfiles = (data.profiles || []).map((profile: any) => ({
        ...profile,
        skills: parseJsonArray(profile.skills),
        categories: parseJsonArray(profile.categories),
      }));
      setProfiles(parsedProfiles);
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchProfiles();
  };

  const handleFollow = async (userId: string) => {
    try {
      const isFollowing = followingStatus[userId];
      if (isFollowing) {
        await api.delete(`/api/connections/${userId}/follow`);
        setFollowingStatus({ ...followingStatus, [userId]: false });
        toast.success("Unfollowed successfully");
      } else {
        await api.post(`/api/connections/${userId}/follow`);
        setFollowingStatus({ ...followingStatus, [userId]: true });
        toast.success("Following user");
      }
    } catch (error: any) {
      console.error("Failed to toggle follow:", error);
      toast.error(error.message || "Failed to update follow status");
    }
  };

  const handleRequestTime = async (profileId: string, userId: string) => {
    if (!requestData.hours || !requestData.category) {
      toast.error("Please fill in hours and category");
      return;
    }

    try {
      await api.post("/api/booking", {
        providerId: userId,
        hours: parseFloat(requestData.hours),
        category: requestData.category,
        note: requestData.note,
      });
      toast.success("Time request sent successfully!");
      setShowRequestModal(null);
      setRequestData({ hours: "", category: "", note: "" });
    } catch (error: any) {
      console.error("Failed to send request:", error);
      toast.error(error.message || "Failed to send request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-6 h-48"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
          TimeBank Directory
        </h1>

        {/* Search and Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 mb-8 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or skills..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
            <input
              type="text"
              placeholder="Skills (comma-separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Categories (comma-separated)"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-6 py-2 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-400 transition-all"
          >
            Search Profiles
          </button>
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-yellow-400/50 transition-all group"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-slate-900 font-bold text-lg">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">{profile.displayName}</h3>
                  {profile.location && (
                    <div className="flex items-center text-slate-400 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {profile.location}
                    </div>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="text-slate-300 text-sm mb-4 line-clamp-2">{profile.bio}</p>
              )}

              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {profile.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-yellow-400/20 text-yellow-300 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length > 3 && (
                    <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded-full">
                      +{profile.skills.length - 3}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.categories.slice(0, 2).map((category, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {profile.ratingAvg && (
                <div className="flex items-center mb-4">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-yellow-400 font-semibold">{profile.ratingAvg.toFixed(1)}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowRequestModal(profile.id)}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-400 transition-all"
                >
                  Request Time
                </button>
                <button 
                  onClick={() => handleFollow(profile.userId)}
                  className={`px-4 py-2 border rounded-lg transition-all ${
                    followingStatus[profile.userId]
                      ? "bg-yellow-400/20 border-yellow-400 text-yellow-400"
                      : "border-slate-600 text-slate-300 hover:border-yellow-400 hover:text-yellow-400"
                  }`}
                >
                  {followingStatus[profile.userId] ? "Following" : "Follow"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && !loading && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No profiles found</h3>
            <p className="text-slate-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Request Time Modal */}
      {showRequestModal && (() => {
        const profile = profiles.find(p => p.id === showRequestModal);
        if (!profile) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">Request Time from {profile.displayName}</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Hours</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={requestData.hours}
                    onChange={(e) => setRequestData({...requestData, hours: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g., 2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <input
                    type="text"
                    value={requestData.category}
                    onChange={(e) => setRequestData({...requestData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="e.g., Web Development"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Note (Optional)</label>
                  <textarea
                    value={requestData.note}
                    onChange={(e) => setRequestData({...requestData, note: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Add any additional details..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(null);
                    setRequestData({ hours: "", category: "", note: "" });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRequestTime(profile.id, profile.userId)}
                  disabled={!requestData.hours || !requestData.category}
                  className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-lg transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
