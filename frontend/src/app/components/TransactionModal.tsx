"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Clock, User, Star } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  otherUser: {
    id: string;
    name: string;
    profile?: {
      displayName: string;
    };
  };
  bookingHours: number;
  onTransactionComplete: () => void;
  onShowRating: (userId: string, userName: string, bookingId: string) => void;
}

export default function TransactionModal({
  isOpen,
  onClose,
  bookingId,
  otherUser,
  bookingHours,
  onTransactionComplete,
  onShowRating
}: TransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
      setAmount(bookingHours.toString());
      setDescription(`Payment for ${bookingHours} hours - ${bookingId.substring(0, 8)}`);
    }
  }, [isOpen, bookingHours, bookingId]);

  const fetchBalance = async () => {
    try {
      const data = await api.get("/api/wallet/balance");
      setBalance(data.balance || 0);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const handleTransaction = async () => {
    const transactionAmount = parseFloat(amount);
    
    if (!transactionAmount || transactionAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (transactionAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/transactions/transfer", {
        receiverId: otherUser.id,
        amount: transactionAmount,
        description: description || `Payment for booking ${bookingId.substring(0, 8)}`
      });

      toast.success("Transaction completed successfully! Stats updated for both users.");
      
      // Refresh balance immediately
      await fetchBalance();
      
      // Call completion handler to refresh bookings, history, and trigger wallet refresh
      onTransactionComplete();
      onClose();
      
      // Show rating popup after transaction
      setTimeout(() => {
        onShowRating(
          otherUser.id,
          otherUser.profile?.displayName || otherUser.name,
          bookingId
        );
      }, 500);
    } catch (error: any) {
      console.error("Failed to complete transaction:", error);
      toast.error(error.message || "Failed to complete transaction");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Complete Transaction</h3>
                <p className="text-sm text-slate-400">Send time credits to {otherUser.profile?.displayName || otherUser.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Balance Display */}
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300">Available Balance</span>
                </div>
                <span className="text-2xl font-bold text-white">{balance.toFixed(2)}h</span>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Sending to</p>
                  <p className="font-semibold text-white">{otherUser.profile?.displayName || otherUser.name}</p>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount (hours)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                max={balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
              <p className="mt-2 text-xs text-slate-400">
                Recommended: {bookingHours.toFixed(2)}h (based on booking)
              </p>
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Add a note about this transaction..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransaction}
                disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Credits
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

