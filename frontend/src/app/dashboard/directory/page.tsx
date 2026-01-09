"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, User, MapPin, Star, Clock, ArrowLeft, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { parseJsonArray } from "@/lib/utils";
import DirectMessageInterface from "@/app/components/DirectMessageInterface";

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
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [skills, setSkills] = useState("");
  const [categories, setCategories] = useState("");
  const [location, setLocation] = useState("");
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
  const [showRequestModal, setShowRequestModal] = useState<string | null>(null);
  const [requestData, setRequestData] = useState({ hours: "", category: "", note: "", location: "" });
  const [showMessageModal, setShowMessageModal] = useState<{ userId: string; userName: string } | null>(null);

  const getMapUrl = (loc: string) => {
    if (!loc) return "";
    const coordMatch = loc.match(/(-?\\d+\\.\\d+)\\s*,\\s*(-?\\d+\\.\\d+)/);
    const base = "https://www.google.com/maps";

    if (coordMatch) {
      const lat = coordMatch[1];
      const lng = coordMatch[2];
      const q = encodeURIComponent(`${lat},${lng}`);
      return `${base}?q=${q}&output=embed`;
    }

    const encoded = encodeURIComponent(loc);
    return `${base}?q=${encoded}&output=embed`;
  };

  useEffect(() => {
    fetchProfiles();
    fetchFollowingStatus();
  }, []);

  const fetchFollowingStatus = async () => {
    try {
      // Get current user's following list
      const userData = await api.get("/api/auth/me").catch(() => null);
      if (!userData || !userData.user) return;

      const userId = userData.user.id;
      const followingData = await api.get(`/api/connections/${userId}/following-list`).catch(() => ({ following: [] }));
      
      const statusMap: Record<string, boolean> = {};
      (followingData.following || []).forEach((user: any) => {
        statusMap[user.id] = true;
      });
      setFollowingStatus(statusMap);
    } catch (error) {
      console.error("Failed to fetch following status:", error);
    }
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
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
      const payload: any = {
        providerId: userId,
        hours: parseFloat(requestData.hours),
        category: requestData.category,
        note: requestData.note,
      };
      if (requestData.location) {
        payload.location = requestData.location;
        // Also append to note so the recipient always sees the location
        payload.note = `${requestData.note ? requestData.note + "\\n" : ""}Location: ${requestData.location}`;
      }
      await api.post("/api/booking", payload);
      toast.success("Time request sent successfully!");
      setShowRequestModal(null);
      setRequestData({ hours: "", category: "", note: "" });
    } catch (error: any) {
      console.error("Failed to send request:", error);
      toast.error(error.message || "Failed to send request");
    }
  };

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Directory</h1>
              <p className="text-slate-300">Browse and discover other users</p>
            </div>
          </div>

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
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
              </div>
              <input
                type="text"
                placeholder="Skills (comma-separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Categories (comma-separated)"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-400 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-green-400 hover:to-green-500 transition-all"
            >
              Search Profiles
            </button>
          </div>

          {/* Profiles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-green-400/50 transition-all group"
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-slate-900 font-bold text-lg">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">{profile.displayName}</h3>
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

                {/* Location with Map Button */}
                {profile.location && (
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        // Open location in Google Maps
                        const encodedLocation = encodeURIComponent(profile.location || "");
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 text-sm transition-all w-full"
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="flex-1 text-left">{profile.location}</span>
                      <span className="text-xs">View on Map</span>
                    </button>
                  </div>
                )}

                {profile.ratingAvg && (
                  <div className="flex items-center mb-4">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-yellow-400 font-semibold">{profile.ratingAvg.toFixed(1)}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowRequestModal(profile.id)}
                    className="flex-1 bg-gradient-to-r from-green-400 to-green-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:from-green-300 hover:to-green-400 transition-all text-sm"
                  >
                    Request Time
                  </button>
                  <button 
                    onClick={() => setShowMessageModal({ userId: profile.userId, userName: profile.displayName })}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all flex items-center gap-2 text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                  <button 
                    onClick={() => handleFollow(profile.userId)}
                    className={`px-4 py-2 border rounded-lg transition-all text-sm ${
                      followingStatus[profile.userId]
                        ? "bg-green-400/20 border-green-400 text-green-400"
                        : "border-slate-600 text-slate-300 hover:border-green-400 hover:text-green-400"
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
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="e.g., 2.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <input
                    type="text"
                    value={requestData.category}
                    onChange={(e) => setRequestData({...requestData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="e.g., Web Development"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location (optional)</label>
                  <input
                    type="text"
                    value={requestData.location}
                    onChange={(e) => setRequestData({...requestData, location: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="City, address, or coordinates"
                  />
                  {requestData.location && (
                    <div className="mt-3 h-48 rounded-lg overflow-hidden border border-slate-600">
                      <iframe
                        title="location-map"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src={getMapUrl(requestData.location)}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Note (Optional)</label>
                  <textarea
                    value={requestData.note}
                    onChange={(e) => setRequestData({...requestData, note: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Add any additional details..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(null);
                    setRequestData({ hours: "", category: "", note: "", location: "" });
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRequestTime(profile.id, profile.userId)}
                  disabled={!requestData.hours || !requestData.category}
                  className="flex-1 px-4 py-2 bg-green-400 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-lg transition-colors"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Direct Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col border border-slate-700">
            <DirectMessageInterface
              receiverId={showMessageModal.userId}
              receiverName={showMessageModal.userName}
              onClose={() => setShowMessageModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

