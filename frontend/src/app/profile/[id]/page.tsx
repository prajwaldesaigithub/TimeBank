"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { MapPin, Star, Clock, MessageCircle, User, Calendar } from "lucide-react";

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
  availability: any;
}

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState({
    hours: "",
    category: "",
    note: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchProfile();
    }
  }, [params.id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:4000/profiles/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTime = async () => {
    if (!profile || !requestData.hours || !requestData.category) return;

    try {
      const response = await fetch("http://localhost:4000/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          providerId: profile.userId,
          hours: parseFloat(requestData.hours),
          category: requestData.category,
          note: requestData.note,
        }),
      });

      if (response.ok) {
        alert("Time request sent successfully!");
        setShowRequestModal(false);
        setRequestData({ hours: "", category: "", note: "" });
      } else {
        const error = await response.json();
        alert(`Failed to send request: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to send request:", error);
      alert("Failed to send request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/3 mb-8"></div>
            <div className="bg-slate-800 rounded-lg p-8 h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-400 mb-2">Profile not found</h2>
          <p className="text-slate-500">The profile you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-slate-900 font-bold text-2xl">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold mb-2">{profile.displayName}</h1>
                {profile.location && (
                  <div className="flex items-center text-slate-400 mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    {profile.location}
                  </div>
                )}
                {profile.ratingAvg && (
                  <div className="flex items-center text-yellow-400">
                    <Star className="w-4 h-4 mr-1" />
                    <span className="font-semibold">{profile.ratingAvg.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-6 py-3 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-400 transition-all"
            >
              Request Time
            </button>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 mb-8">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-slate-300 leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Skills */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Availability</h2>
          <div className="flex items-center text-slate-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>Check availability details in the request modal</span>
          </div>
        </div>
      </div>

      {/* Request Time Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">Request Time from {profile.displayName}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={requestData.hours}
                  onChange={(e) => setRequestData({ ...requestData, hours: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="e.g., 2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={requestData.category}
                  onChange={(e) => setRequestData({ ...requestData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="e.g., Tutoring, Consulting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message (optional)
                </label>
                <textarea
                  value={requestData.note}
                  onChange={(e) => setRequestData({ ...requestData, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  rows={3}
                  placeholder="Describe what you need help with..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-slate-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestTime}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-400 transition-all"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
