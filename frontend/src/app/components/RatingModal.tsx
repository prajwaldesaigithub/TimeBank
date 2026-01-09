"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Send } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  bookingId: string;
}

export default function RatingModal({
  isOpen,
  onClose,
  userId,
  userName,
  bookingId
}: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/ratings", {
        ratedId: userId,
        bookingId: bookingId,
        score: score,
        comment: comment.trim() || undefined
      });

      toast.success("Rating submitted successfully!");
      
      // Trigger stats refresh event
      window.dispatchEvent(new CustomEvent('ratingSubmitted', { 
        detail: { userId, bookingId } 
      }));
      
      // Reset form
      setScore(0);
      setComment("");
      onClose();
    } catch (error: any) {
      console.error("Failed to submit rating:", error);
      toast.error(error.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
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
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Rate {userName}</h3>
                <p className="text-sm text-slate-400">Share your experience</p>
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
            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Your Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setScore(star)}
                    onMouseEnter={() => setHoveredScore(star)}
                    onMouseLeave={() => setHoveredScore(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredScore || score)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-slate-600"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {score > 0 && (
                <p className="mt-2 text-sm text-slate-400">
                  {score === 5 && "Excellent!"}
                  {score === 4 && "Great!"}
                  {score === 3 && "Good"}
                  {score === 2 && "Fair"}
                  {score === 1 && "Poor"}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Tell others about your experience..."
                maxLength={500}
              />
              <p className="mt-1 text-xs text-slate-400">{comment.length}/500</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || score === 0}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Rating
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

