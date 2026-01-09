"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Wallet, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  CreditCard,
  Calendar,
  Filter
} from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  type: "EARNED" | "SPENT" | "TRANSFER" | "BONUS";
  amount: number;
  hours?: number;
  credits?: number;
  description?: string;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface WalletData {
  credits: number;
  balance: number;
  earned: number;
  spent: number;
}

export default function WalletPage() {
  const router = useRouter();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "EARNED" | "SPENT">("all");

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, [filter]);

  // Refresh stats when page becomes visible (after transaction) or when transaction completes
  useEffect(() => {
    const handleFocus = () => {
      fetchWalletData();
      fetchTransactions();
    };
    
    const handleTransactionComplete = () => {
      fetchWalletData();
      fetchTransactions();
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('transactionCompleted', handleTransactionComplete);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('transactionCompleted', handleTransactionComplete);
    };
  }, []);

  const fetchWalletData = async () => {
    try {
      const data = await api.get("/api/wallet/balance").catch(() => null);
      if (data) {
        setWalletData({
          credits: data.credits || 0,
          balance: data.balance || 0,
          earned: data.earned || 0,
          spent: data.spent || 0
        });
      } else {
        // Fallback to transactions stats
        const stats = await api.get("/api/transactions/stats").catch(() => null);
        if (stats) {
          setWalletData({
            credits: stats.credits || 0,
            balance: stats.credits || 0,
            earned: stats.totalEarned || 0,
            spent: stats.totalSpent || 0
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.append("type", filter);
      
      // Try transactions history first, fallback to wallet history
      const data = await api.get(`/api/transactions/history?${params}`).catch(() => 
        api.get(`/api/wallet/history?${params}`).catch(() => ({ transactions: [], items: [] }))
      );
      
      // Handle both Transaction format and LedgerEntry format
      const trans = data.transactions || data.items || [];
      const formatted = trans.map((t: any) => {
        // If it's a LedgerEntry (has hours and type)
        if (t.hours && (t.type === "EARNED" || t.type === "SPENT")) {
          return {
            id: t.id,
            type: t.type,
            amount: Number(t.hours) || 0,
            hours: Number(t.hours) || 0,
            credits: undefined,
            description: t.description || (t.type === "EARNED" ? "Time earned" : "Time spent"),
            createdAt: t.createdAt,
            sender: undefined,
            receiver: undefined
          };
        }
        // If it's a Transaction (has amount and transaction type)
        // Ensure BONUS transactions are properly formatted
        const transactionType = t.type || "TRANSFER";
        const isBonus = transactionType === "BONUS";
        const isEarned = transactionType === "EARNED";
        const isSpent = transactionType === "SPENT";
        
        return {
          ...t,
          type: transactionType,
          amount: typeof t.amount === 'string' ? Number(t.amount) : t.amount,
          hours: (isEarned || isSpent) ? (typeof t.amount === 'string' ? Number(t.amount) : t.amount) : undefined,
          credits: (isBonus || transactionType === "TRANSFER") ? (typeof t.amount === 'string' ? Number(t.amount) : t.amount) : undefined,
          description: t.description || (isBonus ? "Welcome bonus credits" : isEarned ? "Time earned" : isSpent ? "Time spent" : "Transaction")
        };
      });
      
      setTransactions(formatted);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

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
              <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
              <p className="text-slate-300">Manage your credits and view transaction history</p>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Credits</p>
                  <p className="text-3xl font-bold text-white">{walletData?.credits || 0}</p>
                  <p className="text-slate-500 text-xs mt-1">Time Credits</p>
                </div>
                <CreditCard className="w-10 h-10 text-purple-400" />
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Time Balance</p>
                  <p className="text-3xl font-bold text-white">{walletData?.balance?.toFixed(2) || "0.00"}h</p>
                  <p className="text-slate-500 text-xs mt-1">Total Hours</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400" />
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Net</p>
                  <p className={`text-3xl font-bold ${
                    (walletData?.earned || 0) - (walletData?.spent || 0) >= 0 
                      ? "text-green-400" 
                      : "text-red-400"
                  }`}>
                    {((walletData?.earned || 0) - (walletData?.spent || 0)).toFixed(2)}h
                  </p>
                  <p className="text-slate-500 text-xs mt-1">Earned - Spent</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Total Earned</h3>
              </div>
              <p className="text-2xl font-bold text-green-400">{walletData?.earned?.toFixed(2) || "0.00"}h</p>
              <p className="text-slate-400 text-sm mt-1">Time credits earned from completed sessions</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
              <div className="flex items-center mb-4">
                <TrendingDown className="w-5 h-5 text-red-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Total Spent</h3>
              </div>
              <p className="text-2xl font-bold text-red-400">{walletData?.spent?.toFixed(2) || "0.00"}h</p>
              <p className="text-slate-400 text-sm mt-1">Time credits spent on requests</p>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Transaction History</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      filter === "all"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter("EARNED")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      filter === "EARNED"
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Earned
                  </button>
                  <button
                    onClick={() => setFilter("SPENT")}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      filter === "SPENT"
                        ? "bg-red-600 text-white"
                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    }`}
                  >
                    Spent
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-slate-700/50 rounded-lg p-4 h-20 animate-pulse"></div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">No transactions yet</h3>
                <p className="text-slate-500">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-all"
                  >
                    <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        {transaction.type === "SPENT" ? (
                          <TrendingDown className="w-5 h-5 text-red-400 mr-3" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-green-400 mr-3" />
                        )}
                        <div>
                          <p className="font-semibold text-white">
                            {transaction.description || 
                             (transaction.type === "EARNED" ? "Time earned" : 
                              transaction.type === "BONUS" ? "Welcome bonus credits" :
                              transaction.type === "SPENT" ? "Time spent" : "Transaction")}
                          </p>
                          <p className="text-slate-400 text-sm">
                            {formatDate(transaction.createdAt)}
                          </p>
                          {transaction.sender && (
                            <p className="text-slate-500 text-xs mt-1">
                              From: {transaction.sender.name}
                            </p>
                          )}
                          {transaction.receiver && (
                            <p className="text-slate-500 text-xs mt-1">
                              To: {transaction.receiver.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            transaction.type === "SPENT" ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {transaction.type === "SPENT" ? "-" : "+"}
                          {transaction.hours
                            ? `${transaction.hours}h`
                            : transaction.credits
                            ? `${transaction.credits} credits`
                            : transaction.amount}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {transaction.type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

