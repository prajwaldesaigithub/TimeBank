"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle, MessageCircle } from "lucide-react";

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
}

export default function RequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">("incoming");

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      const role = activeTab === "incoming" ? "provider" : "receiver";
      const response = await fetch(`http://localhost:4000/booking?role=${role}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: "accept" | "decline" | "cancel" | "complete") => {
    try {
      const response = await fetch(`http://localhost:4000/booking/${bookingId}/${action}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        ...(action === "accept" && { body: JSON.stringify({ slot: new Date().toISOString() }) }),
      });

      if (response.ok) {
        fetchBookings(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to ${action} booking: ${error.error}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} booking:`, error);
      alert(`Failed to ${action} booking`);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
          Time Requests
        </h1>

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
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.map((booking) => (
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
                      <p className="font-semibold">{booking.hours}h</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Category</span>
                      <p className="font-semibold">{booking.category}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-sm">Role</span>
                      <p className="font-semibold">
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
                </div>

                {/* Actions */}
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

                  <button className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-all text-sm font-medium">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {bookings.length === 0 && (
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
        )}
      </div>
    </div>
  );
}
