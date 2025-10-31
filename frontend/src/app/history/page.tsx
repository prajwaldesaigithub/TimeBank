"use client";

import { useState, useEffect } from "react";
import { Clock, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react";

interface LedgerEntry {
  id: string;
  hours: string;
  type: "EARNED" | "SPENT";
  description?: string;
  createdAt: string;
  refBookingId?: string;
}

interface Balance {
  balance: number;
  earned: number;
  spent: number;
}

export default function HistoryPage() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "EARNED" | "SPENT">("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBalance();
    fetchHistory();
  }, [filter, page]);

  const fetchBalance = async () => {
    try {
      const response = await fetch("http://localhost:4000/wallet/balance", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.append("type", filter);
      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await fetch(`http://localhost:4000/wallet/history?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntries(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !balance) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-6 h-24"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-6 h-20"></div>
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
          Time History
        </h1>

        {/* Balance Cards */}
        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Current Balance</p>
                  <p className="text-2xl font-bold text-slate-100">{balance.balance.toFixed(2)}h</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-slate-900" />
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Earned</p>
                  <p className="text-2xl font-bold text-green-400">{balance.earned.toFixed(2)}h</p>
                </div>
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Spent</p>
                  <p className="text-2xl font-bold text-red-400">{balance.spent.toFixed(2)}h</p>
                </div>
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 mb-8">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300 font-medium">Filter by type:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-yellow-400 text-slate-900"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("EARNED")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "EARNED"
                    ? "bg-green-400 text-slate-900"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Earned
              </button>
              <button
                onClick={() => setFilter("SPENT")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === "SPENT"
                    ? "bg-red-400 text-slate-900"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                Spent
              </button>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-6 h-20 animate-pulse"></div>
              ))}
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700 hover:border-yellow-400/30 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {entry.type === "EARNED" ? (
                      <TrendingUp className="w-5 h-5 text-green-400 mr-3" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400 mr-3" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-100">
                        {entry.description || (entry.type === "EARNED" ? "Time earned" : "Time spent")}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      entry.type === "EARNED" ? "text-green-400" : "text-red-400"
                    }`}>
                      {entry.type === "EARNED" ? "+" : "-"}{entry.hours}h
                    </p>
                    <p className="text-slate-400 text-sm">
                      {entry.type === "EARNED" ? "Earned" : "Spent"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && entries.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No history yet</h3>
            <p className="text-slate-500">Your time transactions will appear here</p>
          </div>
        )}

        {/* Pagination */}
        {entries.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-slate-300">Page {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:border-yellow-400 hover:text-yellow-400 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
