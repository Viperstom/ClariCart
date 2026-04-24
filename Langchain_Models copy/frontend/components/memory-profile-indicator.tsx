"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

interface UserPreference {
  icon: React.ReactNode
  label: string
  value: string
}

const userPreferences: UserPreference[] = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: "Activity",
    value: "Runner & Hiker",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    label: "Priority",
    value: "Lightweight gear",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Budget",
    value: "Mid-range (₹8,000-₹25,000)",
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Must-have",
    value: "Water resistance",
  },
]

export function MemoryProfileIndicator() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Profile Chip */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300"
        style={{
          background: isHovered
            ? "oklch(0.72 0.22 145 / 0.15)"
            : "oklch(0.15 0.02 280 / 0.8)",
          backdropFilter: "blur(10px)",
          border: `1px solid ${isHovered ? "oklch(0.72 0.22 145 / 0.4)" : "oklch(0.25 0.04 280)"}`,
          boxShadow: isHovered ? "0 0 20px -5px oklch(0.72 0.22 145 / 0.3)" : "none",
        }}
      >
        {/* Pulsing dot */}
        <span className="relative flex items-center justify-center">
          <motion.span
            className="w-2 h-2 rounded-full"
            style={{ background: "oklch(0.72 0.22 145)" }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span
            className="absolute w-2 h-2 rounded-full animate-ping"
            style={{ background: "oklch(0.72 0.22 145 / 0.5)" }}
          />
        </span>

        {/* Profile icon */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, oklch(0.72 0.22 145 / 0.3) 0%, oklch(0.8 0.2 195 / 0.2) 100%)",
            border: "1px solid oklch(0.72 0.22 145 / 0.3)",
            color: "oklch(0.82 0.2 145)",
          }}
        >
          A
        </div>

        <span className="text-sm font-medium text-foreground">Profile Active</span>

        {/* Chevron */}
        <motion.svg
          className="w-4 h-4 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isHovered ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
            style={{
              background: "linear-gradient(135deg, oklch(0.12 0.025 280 / 0.98) 0%, oklch(0.08 0.02 280 / 0.98) 100%)",
              backdropFilter: "blur(40px)",
              border: "1px solid oklch(0.3 0.05 280 / 0.4)",
              boxShadow: "0 25px 50px -12px oklch(0 0 0 / 0.5), 0 0 60px -30px oklch(0.72 0.22 145 / 0.3)",
            }}
          >
            {/* Glow accent */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px]"
              style={{
                background: "linear-gradient(90deg, transparent, oklch(0.72 0.22 145), transparent)",
              }}
            />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.72 0.22 145 / 0.2) 0%, oklch(0.8 0.2 195 / 0.15) 100%)",
                    border: "1px solid oklch(0.72 0.22 145 / 0.3)",
                  }}
                >
                  <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">AI Memory Active</h4>
                  <p className="text-xs text-muted-foreground">Personalized recommendations enabled</p>
                </div>
              </div>

              {/* Memory message */}
              <div
                className="p-4 rounded-xl mb-4"
                style={{
                  background: "oklch(0.72 0.22 145 / 0.08)",
                  border: "1px solid oklch(0.72 0.22 145 / 0.2)",
                }}
              >
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="text-neon-green font-medium">Remembering:</span> You are a runner and prefer lightweight gear with excellent water resistance.
                </p>
              </div>

              {/* Preferences list */}
              <div className="space-y-2">
                {userPreferences.map((pref, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg transition-colors hover:bg-muted/30"
                  >
                    <span className="text-neon-cyan">{pref.icon}</span>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{pref.label}</span>
                      <span className="text-sm text-foreground font-medium">{pref.value}</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-border">
                <button
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "oklch(0.18 0.02 280)",
                    border: "1px solid oklch(0.25 0.04 280)",
                    color: "oklch(0.7 0.02 280)",
                  }}
                >
                  Edit Preferences
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
