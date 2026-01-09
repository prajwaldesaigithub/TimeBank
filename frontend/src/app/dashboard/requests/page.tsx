"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MessageCircle,
  ArrowLeft,
  History,
  Calendar
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import DirectMessageInterface from "@/app/components/DirectMessageInterface";
import TransactionModal from "@/app/components/TransactionModal";
import RatingModal from "@/app/components/RatingModal";

interface Booking {
  id: string;
  providerId: string;
  receiverId: string;
  hours: string;
  category: string;
  note?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "COMPLETED";
  createdAt: string;
  startAt?: string;
  endAt?: string;
  provider?: {
    id: string;
    name: string;
    avatarUrl?: string;
    profile?: {
      displayName: string;
    };
  };
  receiver?: {
    id: string;
    name: string;
    avatarUrl?: string;
    profile?: {
      displayName: string;
    };
  };
}

export default function RequestsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [historyBookings, setHistoryBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "history">("incoming");
  const [showChat, setShowChat] = useState(false);
  const [chatBookingId, setChatBookingId] = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedBookingForTransaction, setSelectedBookingForTransaction] = useState<Booking | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState<{ userId: string; userName: string; bookingId: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID
    api.get("/api/auth/me")
      .then((data: any) => {
        if (data && data.user) {
          setCurrentUserId(data.user.id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBookings();
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const role = activeTab === "incoming" ? "provider" : "receiver";
      const data = await api.get(`/api/booking?role=${role}`);
      const allBookings = data.bookings || [];
      
      // Separate active and completed/cancelled bookings
      const active = allBookings.filter((b: Booking) => 
        b.status !== "COMPLETED" && b.status !== "CANCELLED" && b.status !== "DECLINED"
      );
      const history = allBookings.filter((b: Booking) => 
        b.status === "COMPLETED" || b.status === "CANCELLED" || b.status === "DECLINED"
      );
      
      setBookings(active);
      if (activeTab === "history") {
        setHistoryBookings(history);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      // Fetch all bookings and filter for history
      const [incomingData, outgoingData] = await Promise.all([
        api.get("/api/booking?role=provider").catch(() => ({ bookings: [] })),
        api.get("/api/booking?role=receiver").catch(() => ({ bookings: [] }))
      ]);
      
      const allBookings = [
        ...(incomingData.bookings || []),
        ...(outgoingData.bookings || [])
      ];
      
      // Remove duplicates and filter for history
      const uniqueBookings = Array.from(
        new Map(allBookings.map((b: Booking) => [b.id, b])).values()
      );
      
      const history = uniqueBookings.filter((b: Booking) => 
        b.status === "COMPLETED" || b.status === "CANCELLED" || b.status === "DECLINED"
      ).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setHistoryBookings(history);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      toast.error("Failed to load history");
    }
  };

  const handleBookingAction = async (bookingId: string, action: "accept" | "decline" | "cancel" | "complete") => {
    try {
      if (action === "complete") {
        // First mark booking as completed
        await api.post(`/api/booking/${bookingId}/complete-confirm`);
        toast.success("Booking marked as complete");
        
        // Find the booking to get other user info
        const booking = bookings.find(b => b.id === bookingId) || 
                       historyBookings.find(b => b.id === bookingId);
        
        if (booking) {
          // Get current user to determine the other user
          const userData = await api.get("/api/auth/me").catch(() => null);
          if (userData && userData.user) {
            const currentUserId = userData.user.id;
            const otherUserId = booking.providerId === currentUserId 
              ? booking.receiverId 
              : booking.providerId;
            
            // Get other user's info
            const otherUser = booking.providerId === currentUserId 
              ? booking.receiver 
              : booking.provider;
            
            if (otherUserId && otherUser) {
              setSelectedBookingForTransaction(booking);
              setShowTransactionModal(true);
            }
          }
        }
      } else {
        const body = action === "accept" ? { slot: new Date().toISOString() } : undefined;
        await api.patch(`/api/booking/${bookingId}/${action}`, body);
        toast.success(`Booking ${action}ed successfully`);
      }
      fetchBookings(); // Refresh the list
    } catch (error: any) {
      console.error(`Failed to ${action} booking:`, error);
      toast.error(error.message || `Failed to ${action} booking`);
    }
  };

  const handleTransactionComplete = async () => {
    // Refresh bookings and history
    await fetchBookings();
    await fetchHistory();
    
    // Trigger a custom event to refresh wallet stats across all pages
    window.dispatchEvent(new CustomEvent('transactionCompleted'));
    
    toast.success("Transaction completed! Stats updated for both users.");
  };

  useEffect(() => {
    // Listen for rating submission to refresh stats
    const handleRatingSubmitted = () => {
      fetchBookings();
      fetchHistory();
      window.dispatchEvent(new CustomEvent('transactionCompleted'));
    };
    
    window.addEventListener('ratingSubmitted', handleRatingSubmitted);
    return () => {
      window.removeEventListener('ratingSubmitted', handleRatingSubmitted);
    };
  }, []);

  const handleShowRating = (userId: string, userName: string, bookingId: string) => {
    setRatingData({ userId, userName, bookingId });
    setShowRatingModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case "ACCEPTED":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case "DECLINED":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "CANCELLED":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case "COMPLETED":
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-400/20 text-yellow-300 border-yellow-400/30";
      case "ACCEPTED":
        return "bg-green-400/20 text-green-300 border-green-400/30";
      case "DECLINED":
        return "bg-red-400/20 text-red-300 border-red-400/30";
      case "CANCELLED":
        return "bg-gray-400/20 text-gray-300 border-gray-400/30";
      case "COMPLETED":
        return "bg-blue-400/20 text-blue-300 border-blue-400/30";
      default:
        return "bg-slate-400/20 text-slate-300 border-slate-400/30";
    }
  };

  const renderBookingCard = (booking: Booking, isHistory: boolean = false) => (
    <div
      key={booking.id}
      className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-yellow-400/30 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {getStatusIcon(booking.status)}
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
              {booking.status}
            </span>
            <span className="ml-4 text-slate-400 text-sm">
              {new Date(booking.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-slate-400 text-sm">Hours</span>
              <p className="font-semibold text-white">{booking.hours}h</p>
            </div>
            <div>
              <span className="text-slate-400 text-sm">Category</span>
              <p className="font-semibold text-white">{booking.category}</p>
            </div>
            <div>
              <span className="text-slate-400 text-sm">Role</span>
              <p className="font-semibold text-white">
                {activeTab === "incoming" ? "Provider" : "Requester"}
              </p>
            </div>
          </div>

          {booking.note && (
            <div className="mb-4">
              <span className="text-slate-400 text-sm">Note</span>
              <p className="text-slate-300 mt-1">{booking.note}</p>
            </div>
          )}

          {booking.startAt && (
            <div className="mb-4">
              <span className="text-slate-400 text-sm">Scheduled</span>
              <p className="text-slate-300 mt-1">
                {new Date(booking.startAt).toLocaleString()}
              </p>
            </div>
          )}

          {booking.endAt && (
            <div className="mb-4">
              <span className="text-slate-400 text-sm">Completed</span>
              <p className="text-slate-300 mt-1">
                {new Date(booking.endAt).toLocaleString()}
              </p>
            </div>
          )}

          {(booking.provider || booking.receiver) && (
            <div className="mb-4">
              <span className="text-slate-400 text-sm">
                {activeTab === "incoming" ? "Requester" : "Provider"}
              </span>
              <p className="text-slate-300 mt-1">
                {activeTab === "incoming" 
                  ? booking.receiver?.profile?.displayName || booking.receiver?.name || "Unknown"
                  : booking.provider?.profile?.displayName || booking.provider?.name || "Unknown"
                }
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {!isHistory && (
          <div className="flex flex-col gap-2 ml-4">
            {booking.status === "PENDING" && activeTab === "incoming" && (
              <>
                <button
                  onClick={() => handleBookingAction(booking.id, "accept")}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all text-sm font-medium"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleBookingAction(booking.id, "decline")}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-sm font-medium"
                >
                  Decline
                </button>
              </>
            )}

            {booking.status === "ACCEPTED" && (
              <button
                onClick={() => handleBookingAction(booking.id, "complete")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-sm font-medium"
              >
                Mark Complete
              </button>
            )}

            {(booking.status === "PENDING" || booking.status === "ACCEPTED") && (
              <button
                onClick={() => handleBookingAction(booking.id, "cancel")}
                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-red-400 hover:text-red-400 transition-all text-sm font-medium"
              >
                Cancel
              </button>
            )}

            <button 
              onClick={() => {
                const otherUser = activeTab === "incoming" 
                  ? booking.receiver 
                  : booking.provider;
                const otherUserId = activeTab === "incoming" 
                  ? booking.receiverId 
                  : booking.providerId;
                if (otherUser || otherUserId) {
                  setChatBookingId(booking.id);
                  setChatUser({
                    id: otherUser?.id || otherUserId,
                    name: otherUser?.profile?.displayName || otherUser?.name || "User",
                    profile: {
                      displayName: otherUser?.profile?.displayName || otherUser?.name || "User"
                    }
                  });
                  setShowChat(true);
                }
              }}
              className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-all text-sm font-medium flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && bookings.length === 0 && historyBookings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading requests...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Time Requests</h1>
              <p className="text-slate-300">Manage your incoming, outgoing requests and view history</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-800/50 rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab("incoming")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "incoming"
                  ? "bg-yellow-400 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Incoming Requests
            </button>
            <button
              onClick={() => setActiveTab("outgoing")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === "outgoing"
                  ? "bg-yellow-400 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === "history"
                  ? "bg-yellow-400 text-slate-900"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {activeTab === "history" ? (
              loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-6 h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : historyBookings.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">No history</h3>
                  <p className="text-slate-500">Your completed and cancelled requests will appear here</p>
                </div>
              ) : (
                historyBookings.map((booking) => renderBookingCard(booking, true))
              )
            ) : (
              loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-slate-800 rounded-lg p-6 h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">
                    No {activeTab} requests
                  </h3>
                  <p className="text-slate-500">
                    {activeTab === "incoming" 
                      ? "You haven't received any time requests yet" 
                      : "You haven't sent any time requests yet"
                    }
                  </p>
                </div>
              ) : (
                bookings.map((booking) => renderBookingCard(booking, false))
              )
            )}
          </div>
        </div>
      </div>

      {/* Direct Message Modal */}
      {showChat && chatUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col border border-slate-700">
            <DirectMessageInterface
              receiverId={chatUser.id}
              receiverName={chatUser.profile?.displayName || chatUser.name || "User"}
              onClose={() => {
                setShowChat(false);
                setChatBookingId(null);
                setChatUser(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedBookingForTransaction && currentUserId && (() => {
        const otherUser = selectedBookingForTransaction.providerId === currentUserId 
          ? selectedBookingForTransaction.receiver 
          : selectedBookingForTransaction.provider;
        const otherUserId = selectedBookingForTransaction.providerId === currentUserId 
          ? selectedBookingForTransaction.receiverId 
          : selectedBookingForTransaction.providerId;

        if (!otherUser || !otherUserId) return null;

        return (
          <TransactionModal
            isOpen={showTransactionModal}
            onClose={() => {
              setShowTransactionModal(false);
              setSelectedBookingForTransaction(null);
            }}
            bookingId={selectedBookingForTransaction.id}
            otherUser={{
              id: otherUserId,
              name: otherUser.name || "User",
              profile: otherUser.profile
            }}
            bookingHours={parseFloat(selectedBookingForTransaction.hours) || 0}
            onTransactionComplete={handleTransactionComplete}
            onShowRating={handleShowRating}
          />
        );
      })()}

      {/* Rating Modal */}
      {showRatingModal && ratingData && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingData(null);
            fetchBookings();
            fetchHistory();
          }}
          userId={ratingData.userId}
          userName={ratingData.userName}
          bookingId={ratingData.bookingId}
        />
      )}
    </div>
  );
}

