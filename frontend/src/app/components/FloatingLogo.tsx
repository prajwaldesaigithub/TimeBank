"use client";

import { motion } from "framer-motion";

export default function FloatingLogo() {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none overflow-hidden h-20">
      {/* Enhanced Stars Background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute bg-white rounded-full"
            initial={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.4,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
            }}
          />
        ))}
      </div>

      {/* Modern Planets with Glow Effects */}
      <motion.div
        className="absolute top-2 left-[5%] w-12 h-12 rounded-full"
        animate={{
          x: ["-50px", "calc(100vw - 50px)", "-50px"],
          y: [0, -15, 0],
          rotate: 360,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 shadow-[0_0_20px_rgba(168,85,247,0.6)]" />
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-300/50 to-transparent" />
        <div className="absolute top-2 left-3 w-2 h-2 bg-white/60 rounded-full" />
      </motion.div>

      <motion.div
        className="absolute top-6 left-[15%] w-10 h-10 rounded-full"
        animate={{
          x: ["-50px", "calc(100vw - 50px)", "-50px"],
          y: [0, 20, 0],
          rotate: -360,
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
          delay: 3,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-blue-300/50 to-transparent" />
        <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white/60 rounded-full" />
      </motion.div>

      <motion.div
        className="absolute top-1 left-[25%] w-8 h-8 rounded-full"
        animate={{
          x: ["-50px", "calc(100vw - 50px)", "-50px"],
          y: [0, -12, 0],
          rotate: 180,
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
          delay: 5,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
        <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-pink-300/50 to-transparent" />
      </motion.div>

      <motion.div
        className="absolute top-10 left-[35%] w-6 h-6 rounded-full"
        animate={{
          x: ["-50px", "calc(100vw - 50px)", "-50px"],
          y: [0, 10, 0],
          rotate: -180,
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
          delay: 7,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
      </motion.div>

      {/* Floating Logo - Simple Text Animation Left to Right */}
      <motion.div
        className="absolute top-1/2 left-0 -translate-y-1/2"
        animate={{
          x: ["-200px", "calc(100vw + 200px)"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <motion.h1
          className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent whitespace-nowrap"
          style={{
            textShadow: '0 0 30px rgba(234, 179, 8, 0.8), 0 0 60px rgba(234, 179, 8, 0.4)',
            filter: 'drop-shadow(0 0 10px rgba(234, 179, 8, 0.5))',
          }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          TimeBank
        </motion.h1>
      </motion.div>
    </div>
  );
}
