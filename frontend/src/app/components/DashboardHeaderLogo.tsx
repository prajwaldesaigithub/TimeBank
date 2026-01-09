"use client";

import { motion } from "framer-motion";

export default function DashboardHeaderLogo() {
  return (
    <div className="fixed top-4 left-4 z-40 pointer-events-none">
      <motion.h1
        className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent"
        style={{
          textShadow: '0 0 20px rgba(234, 179, 8, 0.6)',
          filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.4))',
        }}
        animate={{
          x: [0, 10, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        TimeBank
      </motion.h1>
    </div>
  );
}

