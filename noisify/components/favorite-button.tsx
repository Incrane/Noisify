"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addFavorite, removeFavorite } from "@/app/app/profil/actions";

import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  activityId: string;
  isFavorite: boolean;
  className?: string;
}

export default function FavoriteButton({
  activityId,
  isFavorite: initialIsFavorite,
  className = "",
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    const newStatus = !isFavorite;
    setIsFavorite(newStatus); // Optimistic update

    try {
      if (newStatus) {
        await addFavorite("activity", activityId);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 2000);
      } else {
        await removeFavorite("activity", activityId);
      }
    } catch (error) {
      console.error("Failed to toggle favorite", error);
      setIsFavorite(!newStatus); // Revert
      
      if (error instanceof Error && error.message.includes("Not authenticated")) {
          router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.8 }}
        onClick={toggleFavorite}
        className={`p-2 rounded-full transition-colors ${
            isFavorite 
            ? "bg-red-500 text-white" 
            : "bg-white/80 backdrop-blur-sm text-slate-600 hover:bg-white hover:text-red-500"
        } ${className}`}
      >
        <Heart
          className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
        />
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-100 pointer-events-none"
            >
              <div className="bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-slate-800/50">
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                <span>Tillagd i favoriter</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
