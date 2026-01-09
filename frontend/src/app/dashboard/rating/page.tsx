"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Star, 
  ArrowLeft, 
  User, 
  Search,
  MessageSquare,
  Calendar,
  Award
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Rating {
  id: string;
  score: number;
  comment?: string;
  createdAt: string;
  rater: {
    id: string;
    name: string;
    avatarUrl?: string;
    profile?: {
      displayName: string;
    };
  };
  rated: {
    id: string;
    name: string;
    avatarUrl?: string;
    profile?: {
      displayName: string;
    };
  };
  bookingId?: string;
}

interface UserToRate {
  id: string;
  name: string;
  avatarUrl?: string;
  profile?: {
    displayName: string;
  };
  bookingId?: string;
  booking?: {
    id: string;
    category: string;
    hours: string;
    status: string;
  };
}

interface RatingStats {
  averageRating: number;
  totalRatings: number;
}

export default function RatingPage() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [usersToRate, setUsersToRate] = useState<UserToRate[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"received" | "given" | "rate">("received");
  const [selectedUser, setSelectedUser] = useState<UserToRate | null>(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchRatings();
    fetchStats();
    if (activeTab === "rate") {
      fetchUsersToRate();
    }
  }, [activeTab]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      // Get current user ID from token or API
      const userData = await api.get("/api/auth/me").catch(() => null);
      if (!userData || !userData.user) return;

      const userId = userData.user.id;
      
      if (activeTab === "received") {
        const data = await api.get(`/api/ratings/user/${userId}`).catch(() => ({ ratings: [] }));
        setRatings(data.ratings || []);
      } else {
        // Get ratings given by user
        const data = await api.get(`/api/ratings/given/${userId}`).catch(() => ({ ratings: [] }));
        setRatings(data.ratings || []);
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error);
      toast.error("Failed to load ratings");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const userData = await api.get("/api/auth/me").catch(() => null);
      if (!userData || !userData.user) return;

      const userId = userData.user.id;
      const data = await api.get(`/api/ratings/user/${userId}`).catch(() => null);
      if (data && data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchUsersToRate = async () => {
    try {
      // Fetch completed bookings where user can rate the other party
      // Get both incoming and outgoing completed bookings
      const [incomingData, outgoingData] = await Promise.all([
        api.get("/api/booking?role=provider&status=COMPLETED").catch(() => ({ bookings: [] })),
        api.get("/api/booking?role=receiver&status=COMPLETED").catch(() => ({ bookings: [] }))
      ]);
      
      const allBookings = [
        ...(incomingData.bookings || []),
        ...(outgoingData.bookings || [])
      ];
      
      // Remove duplicates by booking ID
      const uniqueBookings = Array.from(
        new Map(allBookings.map((b: any) => [b.id, b])).values()
      );
      
      const userData = await api.get("/api/auth/me").catch(() => null);
      if (!userData || !userData.user) return;
      const currentUserId = userData.user.id;

      // Get users from completed bookings
      const users: UserToRate[] = [];
      const processedUserIds = new Set<string>();

      for (const booking of uniqueBookings) {
        const otherUserId = booking.providerId === currentUserId 
          ? booking.receiverId 
          : booking.providerId;
        
        if (otherUserId && !processedUserIds.has(otherUserId)) {
          // Check if already rated (simplified - in production, check rating table)
          processedUserIds.add(otherUserId);
          users.push({
            id: otherUserId,
            name: booking.providerId === currentUserId 
              ? booking.receiver?.profile?.displayName || booking.receiver?.name || "User"
              : booking.provider?.profile?.displayName || booking.provider?.name || "User",
            avatarUrl: booking.providerId === currentUserId 
              ? booking.receiver?.avatarUrl
              : booking.provider?.avatarUrl,
            profile: {
              displayName: booking.providerId === currentUserId 
                ? booking.receiver?.profile?.displayName || booking.receiver?.name || "User"
                : booking.provider?.profile?.displayName || booking.provider?.name || "User"
            },
            bookingId: booking.id,
            booking: {
              id: booking.id,
              category: booking.category,
              hours: booking.hours,
              status: booking.status
            }
          });
        }
      }

      setUsersToRate(users);
    } catch (error) {
      console.error("Failed to fetch users to rate:", error);
      toast.error("Failed to load users to rate");
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedUser || ratingScore === 0) {
      toast.error("Please select a rating score");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/ratings", {
        ratedId: selectedUser.id,
        bookingId: selectedUser.bookingId,
        score: ratingScore,
        comment: ratingComment.trim() || undefined
      });
      
      toast.success("Rating submitted successfully!");
      setSelectedUser(null);
      setRatingScore(0);
      setRatingComment("");
      fetchUsersToRate();
      fetchRatings();
      fetchStats();
    } catch (error: any) {
      console.error("Failed to submit rating:", error);
      toast.error(error.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (score: number, interactive: boolean = false, onStarClick?: (score: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onStarClick ? onStarClick(star) : undefined}
            disabled={!interactive}
            className={`${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } transition-transform`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= score
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-slate-400"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const filteredUsers = usersToRate.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.profile?.displayName?.toLowerCase().includes(searchLower) ||
      user.booking?.category?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && ratings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading ratings...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Ratings</h1>
              <p className="text-slate-300">Rate users and view your rating history</p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <div className="flex items-center mb-4">
                  <Award className="w-5 h-5 text-yellow-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Average Rating</h3>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-3xl font-bold text-yellow-400">{stats.averageRating.toFixed(1)}</p>
                  {renderStars(Math.round(stats.averageRating))}
                </div>
              </div>

              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-purple-400 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Total Ratings</h3>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalRatings}</p>
                <p className="text-slate-400 text-sm mt-1">Ratings received</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab("received")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "received"
                  ? "bg-yellow-400 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ratings Received
            </button>
            <button
              onClick={() => setActiveTab("given")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "given"
                  ? "bg-yellow-400 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Ratings Given
            </button>
            <button
              onClick={() => setActiveTab("rate")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "rate"
                  ? "bg-yellow-400 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Rate Users
            </button>
          </div>

          {/* Content */}
          {activeTab === "rate" ? (
            <div>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users to rate..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Users to Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700 hover:border-yellow-400/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-slate-900 font-bold">
                        {user.profile?.displayName?.charAt(0) || user.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-white">
                          {user.profile?.displayName || user.name}
                        </h3>
                        {user.booking && (
                          <p className="text-slate-400 text-sm">
                            {user.booking.category} • {user.booking.hours}h
                          </p>
                        )}
                      </div>
                    </div>
                    <button className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-lg font-medium transition-all">
                      Rate User
                    </button>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">No users to rate</h3>
                  <p className="text-slate-500">Complete some sessions to rate users</p>
                </div>
              )}

              {/* Rating Modal */}
              {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      Rate {selectedUser.profile?.displayName || selectedUser.name}
                    </h3>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Rating
                      </label>
                      {renderStars(ratingScore, true, setRatingScore)}
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Comment (Optional)
                      </label>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Share your experience..."
                      />
                    </div>

                    {selectedUser.booking && (
                      <div className="mb-6 p-3 bg-slate-700/50 rounded-lg">
                        <p className="text-slate-400 text-sm">Session Details</p>
                        <p className="text-white font-medium">
                          {selectedUser.booking.category} • {selectedUser.booking.hours}h
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setRatingScore(0);
                          setRatingComment("");
                        }}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitRating}
                        disabled={submitting || ratingScore === 0}
                        className="flex-1 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-lg font-medium transition-all"
                      >
                        {submitting ? "Submitting..." : "Submit Rating"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {ratings.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">
                    No {activeTab === "received" ? "ratings received" : "ratings given"} yet
                  </h3>
                  <p className="text-slate-500">
                    {activeTab === "received" 
                      ? "Ratings you receive will appear here"
                      : "Ratings you give will appear here"
                    }
                  </p>
                </div>
              ) : (
                ratings.map((rating) => (
                  <div
                    key={rating.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-slate-900 font-bold">
                          {activeTab === "received"
                            ? rating.rater.profile?.displayName?.charAt(0) || rating.rater.name.charAt(0)
                            : rating.rated.profile?.displayName?.charAt(0) || rating.rated.name.charAt(0)
                          }
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-white">
                              {activeTab === "received"
                                ? rating.rater.profile?.displayName || rating.rater.name
                                : rating.rated.profile?.displayName || rating.rated.name
                              }
                            </h3>
                            {renderStars(rating.score)}
                          </div>
                          {rating.comment && (
                            <p className="text-slate-300 mb-2">{rating.comment}</p>
                          )}
                          <div className="flex items-center gap-4 text-slate-400 text-sm">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(rating.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

