"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Save, RotateCcw, MapPin } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import LocationPicker from "@/app/components/LocationPicker";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Me = { id: string; email: string; name: string; avatarUrl: string | null };

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  const headers = () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  useEffect(() => {
    (async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) { router.replace("/login"); return; }
      try {
        const res = await fetch(`${API}/auth/me`, { headers: headers() });
        if (!res.ok) { localStorage.removeItem("token"); router.replace("/login"); return; }
        const data = await res.json();
        setMe(data.user);
        setName(data.user.name || "");
        setAvatarUrl(data.user.avatarUrl || "");
        
        // Fetch profile for location
        const profileRes = await fetch(`${API}/api/profiles/me`, { headers: headers() });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData.profile);
          setLocation(profileData.profile?.location || "");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      // Update user info
      const userRes = await fetch(`${API}/auth/me`, {
        method: "PATCH",
        headers: headers(),
        body: JSON.stringify({ name, avatarUrl: avatarUrl || null }),
      });
      const userData = await userRes.json().catch(() => ({}));
      if (!userRes.ok) throw new Error(userData?.error || "Failed to update profile");
      setMe(userData.user);

      // Update profile location
      if (location !== profile?.location) {
        await fetch(`${API}/api/profiles/me`, {
          method: "PATCH",
          headers: headers(),
          body: JSON.stringify({ location: location || null }),
        });
      }

      toast.success("Profile updated successfully");
    } catch (e: any) {
      setError(e?.message || "Failed to update profile");
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
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
              <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
              <p className="text-slate-300">Manage your profile and settings</p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Your Profile</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Avatar Section */}
              <div className="md:col-span-1">
                <div className="aspect-square w-32 mx-auto md:mx-0 overflow-hidden rounded-2xl border-2 border-slate-600 bg-slate-700">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`flex h-full w-full items-center justify-center text-slate-400 ${avatarUrl ? 'hidden' : ''}`}>
                    <User className="w-12 h-12" />
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Avatar URL</label>
                  <input
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-slate-400">Paste a direct image URL (JPG/PNG/SVG/WebP).</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <div className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300">
                    {me?.email || "N/A"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      readOnly
                    />
                    <button
                      onClick={() => setShowLocationPicker(true)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      Set on Map
                    </button>
                  </div>
                  {location && (
                    <button
                      onClick={() => {
                        const encoded = encodeURIComponent(location);
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
                      }}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      View on Google Maps
                    </button>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={save}
                    disabled={saving || name.trim().length < 2}
                    className={`flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all ${
                      saving ? "opacity-70" : ""
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName(me?.name || "");
                      setAvatarUrl(me?.avatarUrl || "");
                      setLocation(profile?.location || "");
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <LocationPicker
          value={location}
          onChange={(newLocation) => {
            setLocation(newLocation);
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </div>
  );
}

