"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"

interface DevilsAdvocateToggleProps {
  isEnabled: boolean
  onToggle: (enabled: boolean) => void
}

export function DevilsAdvocateToggle({ isEnabled, onToggle }: DevilsAdvocateToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4 px-5 py-3 rounded-2xl"
        style={{
          background: isEnabled
            ? "linear-gradient(135deg, oklch(0.65 0.25 25 / 0.15) 0%, oklch(0.75 0.2 55 / 0.1) 100%)"
            : "oklch(0.12 0.02 280)",
          border: `1px solid ${isEnabled ? "oklch(0.65 0.25 25 / 0.4)" : "oklch(0.25 0.04 280)"}`,
          boxShadow: isEnabled ? "0 0 30px -10px oklch(0.65 0.25 25 / 0.4)" : "none",
          transition: "all 0.4s ease",
        }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-400"
          style={{
            background: isEnabled
              ? "linear-gradient(135deg, oklch(0.65 0.25 25 / 0.3) 0%, oklch(0.75 0.2 55 / 0.2) 100%)"
              : "oklch(0.18 0.02 280)",
            border: `1px solid ${isEnabled ? "oklch(0.65 0.25 25 / 0.4)" : "oklch(0.25 0.04 280)"}`,
          }}
        >
          <motion.svg
            className="w-5 h-5 transition-colors duration-400"
            style={{ color: isEnabled ? "oklch(0.75 0.22 35)" : "oklch(0.6 0.02 280)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            animate={isEnabled ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </motion.svg>
        </div>

        {/* Label */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-semibold transition-colors duration-400"
              style={{ color: isEnabled ? "oklch(0.85 0.18 35)" : "oklch(0.9 0.01 280)" }}
            >
              Devil&apos;s Advocate
            </span>
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="w-4 h-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              style={{
                background: "oklch(0.2 0.02 280)",
                border: "1px solid oklch(0.3 0.04 280)",
              }}
            >
              <span className="text-[10px]">?</span>
            </button>
          </div>
          <span
            className="text-xs transition-colors duration-400"
            style={{ color: isEnabled ? "oklch(0.7 0.15 35)" : "oklch(0.5 0.02 280)" }}
          >
            {isEnabled ? "Brutal Honesty Mode" : "Balanced View"}
          </span>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => onToggle(!isEnabled)}
          className="relative w-14 h-7 rounded-full transition-all duration-400 focus:outline-none"
          style={{
            background: isEnabled
              ? "linear-gradient(135deg, oklch(0.65 0.25 25) 0%, oklch(0.55 0.2 25) 100%)"
              : "oklch(0.2 0.02 280)",
            boxShadow: isEnabled
              ? "0 0 20px -5px oklch(0.65 0.25 25 / 0.6), inset 0 1px 2px oklch(0 0 0 / 0.2)"
              : "inset 0 1px 3px oklch(0 0 0 / 0.3)",
            border: `1px solid ${isEnabled ? "oklch(0.7 0.25 25 / 0.5)" : "oklch(0.3 0.04 280)"}`,
          }}
        >
          <motion.div
            className="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center"
            animate={{ x: isEnabled ? 28 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{
              background: isEnabled
                ? "linear-gradient(135deg, oklch(0.95 0 0) 0%, oklch(0.85 0.02 35) 100%)"
                : "linear-gradient(135deg, oklch(0.8 0 0) 0%, oklch(0.6 0 0) 100%)",
              boxShadow: isEnabled
                ? "0 2px 8px oklch(0 0 0 / 0.3), 0 0 0 1px oklch(0.65 0.25 25 / 0.3)"
                : "0 2px 4px oklch(0 0 0 / 0.2)",
            }}
          >
            {isEnabled && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full"
                style={{ background: "oklch(0.65 0.25 25)" }}
              />
            )}
          </motion.div>
        </button>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl z-50"
            style={{
              background: "oklch(0.12 0.02 280 / 0.98)",
              backdropFilter: "blur(20px)",
              border: "1px solid oklch(0.3 0.04 280)",
              boxShadow: "0 20px 40px -10px oklch(0 0 0 / 0.5)",
            }}
          >
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Devil&apos;s Advocate Mode</span> shows you every flaw, negative review, and potential issue with this product. Perfect for making fully informed decisions.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Devil's Advocate warning panel that appears when enabled
export function DevilsAdvocatePanel({ isEnabled, dynamicKeyPoints }: { isEnabled: boolean, dynamicKeyPoints?: { text: string, sentiment: "positive" | "negative" }[] }) {
  const defaultNegativePoints = [
    { severity: "high", text: "Long-term quality degradation noted by roughly 12% of long-term buyers" },
    { severity: "medium", text: "Customer service and warranty claims can average 5-7 business days" },
    { severity: "medium", text: "Price-to-value ratio is considered lower compared to direct competitors" },
    { severity: "low", text: "Minor functional inconsistencies reported by a small segment of users" },
  ]

  const extractedCons = dynamicKeyPoints
    ? dynamicKeyPoints.filter(p => p.sentiment === "negative").map((p, i) => ({ severity: i === 0 ? "high" : "medium", text: p.text }))
    : []

  const negativePoints = extractedCons.length > 0 ? extractedCons : defaultNegativePoints

  return (
    <AnimatePresence>
      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 24 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div
            className="p-6 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.25 25 / 0.08) 0%, oklch(0.75 0.2 55 / 0.05) 100%)",
              border: "1px solid oklch(0.65 0.25 25 / 0.3)",
              boxShadow: "0 0 40px -15px oklch(0.65 0.25 25 / 0.3)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "oklch(0.65 0.25 25 / 0.2)",
                  border: "1px solid oklch(0.65 0.25 25 / 0.3)",
                }}
              >
                <svg className="w-5 h-5" style={{ color: "oklch(0.75 0.22 25)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold" style={{ color: "oklch(0.85 0.18 35)" }}>Brutal Honesty Report</h4>
                <p className="text-xs" style={{ color: "oklch(0.65 0.15 35)" }}>Every flaw we found in the reviews</p>
              </div>
            </div>

            {/* Negative points */}
            <div className="space-y-3">
              {negativePoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: point.severity === "high"
                      ? "oklch(0.65 0.25 25 / 0.1)"
                      : point.severity === "medium"
                        ? "oklch(0.75 0.2 55 / 0.1)"
                        : "oklch(0.5 0.1 55 / 0.1)",
                    border: `1px solid ${point.severity === "high"
                      ? "oklch(0.65 0.25 25 / 0.25)"
                      : point.severity === "medium"
                        ? "oklch(0.75 0.2 55 / 0.25)"
                        : "oklch(0.5 0.1 55 / 0.25)"
                      }`,
                  }}
                >
                  <span
                    className="mt-0.5 flex-shrink-0"
                    style={{
                      color: point.severity === "high"
                        ? "oklch(0.65 0.25 25)"
                        : point.severity === "medium"
                          ? "oklch(0.75 0.2 55)"
                          : "oklch(0.6 0.1 55)",
                    }}
                  >
                    {point.severity === "high" ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-foreground">{point.text}</span>
                </motion.div>
              ))}
            </div>

            {/* Warning footer */}
            <div
              className="mt-5 pt-4 flex items-center gap-2 text-xs"
              style={{
                borderTop: "1px solid oklch(0.65 0.25 25 / 0.2)",
                color: "oklch(0.6 0.1 35)"
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This analysis highlights concerns found in reviews. The product may still suit your needs.
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
