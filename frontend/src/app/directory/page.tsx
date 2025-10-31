"use client";

import { useState, useEffect } from "react";
import { Search, Filter, User, MapPin, Star, Clock } from "lucide-react";

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

      const response = await fetch(`http://localhost:4000/profiles?${params}`);
      const data = await response.json();
      setProfiles(data.profiles || []);
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setLoading(true);
    fetchProfiles();
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
                <button className="flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 px-4 py-2 rounded-lg font-semibold hover:from-yellow-300 hover:to-amber-400 transition-all">
                  Request Time
                </button>
                <button className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-all">
                  Follow
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
  );
}
