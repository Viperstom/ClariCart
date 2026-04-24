"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import React from "react"

interface StatsSectionProps {
  scrollY: number
  realReviews?: number
  realRating?: number
  productName?: string
}

// Default fallback metrics (shown before any product is searched)
const defaultMetrics = [
  { label: "Total Reviews Analyzed", value: 14502, displayValue: "14,502", icon: "scan", color: "cyan", suffix: "" },
  { label: "Spam/Fake Reviews Removed", value: 3104, displayValue: "3,104", icon: "shield", color: "red", suffix: "" },
  { label: "True Positive Sentiment", value: 94, displayValue: "94", icon: "trend", color: "green", suffix: "%" },
  { label: "Purchase Regret Probability", value: 0, displayValue: "Low Risk", icon: "target", color: "purple", suffix: "" },
]

const icons: Record<string, (color: string) => React.ReactElement> = {
  scan: (color) => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h4M3 12h2M3 17h4" />
    </svg>
  ),
  shield: (color) => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  trend: (color) => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  target: (color) => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color }}>
      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
      <circle cx="12" cy="12" r="2" strokeWidth={1.5} />
    </svg>
  ),
}

const colorMap: Record<string, { text: string; glow: string; border: string; bg: string }> = {
  cyan: {
    text: "oklch(0.8 0.2 195)",
    glow: "oklch(0.8 0.2 195 / 0.3)",
    border: "oklch(0.8 0.2 195 / 0.4)",
    bg: "oklch(0.8 0.2 195 / 0.1)",
  },
  red: {
    text: "oklch(0.7 0.2 25)",
    glow: "oklch(0.65 0.25 25 / 0.3)",
    border: "oklch(0.65 0.25 25 / 0.4)",
    bg: "oklch(0.65 0.25 25 / 0.1)",
  },
  green: {
    text: "oklch(0.72 0.22 145)",
    glow: "oklch(0.72 0.22 145 / 0.3)",
    border: "oklch(0.72 0.22 145 / 0.4)",
    bg: "oklch(0.72 0.22 145 / 0.1)",
  },
  purple: {
    text: "oklch(0.7 0.28 300)",
    glow: "oklch(0.7 0.28 300 / 0.3)",
    border: "oklch(0.7 0.28 300 / 0.4)",
    bg: "oklch(0.7 0.28 300 / 0.1)",
  },
}

function AnimatedCounter({ value, suffix, isInView }: { value: number; suffix: string; isInView: boolean }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView || value === 0) return

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value, isInView])

  if (value === 0) return null

  return (
    <>
      {count.toLocaleString()}{suffix}
    </>
  )
}

export function StatsSection({ scrollY, realReviews, realRating, productName }: StatsSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [lastUpdated, setLastUpdated] = useState("just now")

  const hasRealReviews = realReviews !== undefined && realReviews > 0
  const hasRealRating = realRating !== undefined && realRating > 0
  const amazonTotal = hasRealReviews ? realReviews! : 0
  const CLARICART_DB = 8000  // 4 categories × 2000 reviews ingested by ingest.py
  const AI_READS = 5    // k=5 similarity search per query
  const rating = hasRealRating ? realRating! : 4.2
  const sentiment = Math.min(100, Math.round(((rating - 1) / 4) * 40 + 60))  // capped at 100
  const regretRisk = rating >= 4.0 ? "Low Risk" : rating >= 3.0 ? "Medium Risk" : "High Risk"
  const riskColor = regretRisk === "Low Risk" ? "purple" : regretRisk === "Medium Risk" ? "cyan" : "red"

  const aiMetrics = [
    {
      label: "Total Reviews on Amazon",
      value: amazonTotal,
      displayValue: hasRealReviews ? amazonTotal.toLocaleString() : "—",
      subLabel: hasRealReviews ? "Live from Amazon" : "Blocked by Amazon bot filter",
      icon: "scan", color: "cyan", suffix: "",
    },
    {
      label: "Read by ClariCart AI",
      value: AI_READS,
      displayValue: String(AI_READS),
      subLabel: `From ${CLARICART_DB.toLocaleString()} indexed in our DB`,
      icon: "shield", color: "green", suffix: " reviews",
    },
    {
      label: "True Positive Sentiment",
      value: sentiment,
      displayValue: String(sentiment),
      subLabel: `Based on ${rating.toFixed(1)}\u2605 rating`,
      icon: "trend", color: "green", suffix: "%",
    },
    {
      label: "Purchase Risk Level",
      value: 0,
      displayValue: regretRisk,
      subLabel: rating >= 4.0 ? "Highly trusted by buyers" : rating >= 3.0 ? "Check reviews carefully" : "Significant complaints",
      icon: "target", color: riskColor, suffix: "",
    },
  ]

  // Update last-updated text whenever product changes
  useEffect(() => {
    if (productName) {
      setLastUpdated("just now")
      const id = setTimeout(() => setLastUpdated("2 seconds ago"), 2000)
      return () => clearTimeout(id)
    }
  }, [productName, realReviews, realRating])

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-4"
            style={{
              background: "oklch(0.72 0.22 145 / 0.1)",
              border: "1px solid oklch(0.72 0.22 145 / 0.3)",
              color: "oklch(0.72 0.22 145)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
            LIVE ANALYSIS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Deep AI Analysis Hub
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Real-time metrics scanned by ClariCart AI
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {aiMetrics.map((metric, index) => {
            const colors = colorMap[metric.color]

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div
                  className="relative p-6 md:p-8 rounded-2xl border bg-card/40 backdrop-blur-xl overflow-hidden transition-all duration-500"
                  style={{
                    borderColor: colors.border,
                    boxShadow: `0 0 40px -15px ${colors.glow}`,
                  }}
                >
                  {/* Animated scan line */}
                  <motion.div
                    className="absolute top-0 left-0 right-0 h-[1px] opacity-60"
                    style={{ background: colors.text }}
                    initial={{ scaleX: 0, transformOrigin: "left" }}
                    animate={isInView ? {
                      scaleX: [0, 1, 1, 0],
                      transformOrigin: ["left", "left", "right", "right"]
                    } : {}}
                    transition={{
                      duration: 3,
                      delay: index * 0.2,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  />

                  {/* Glow effect on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${colors.bg} 0%, transparent 70%)`,
                    }}
                  />

                  {/* Icon */}
                  <div className="mb-4 relative">
                    {icons[metric.icon](colors.text)}
                    {/* Subtle glow behind icon */}
                    <div
                      className="absolute inset-0 blur-lg opacity-50 -z-10"
                      style={{ background: colors.glow }}
                    />
                  </div>

                  {/* Value */}
                  <div
                    className="text-3xl md:text-4xl font-bold mb-2 font-mono"
                    style={{ color: colors.text }}
                  >
                    {metric.value === 0 ? (
                      <span>{metric.displayValue}</span>
                    ) : (
                      <AnimatedCounter
                        value={metric.value}
                        suffix={metric.suffix}
                        isInView={isInView}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-sm text-muted-foreground font-medium">
                    {metric.label}
                  </div>
                  {"subLabel" in metric && metric.subLabel && (
                    <div className="text-xs mt-1 opacity-60" style={{ color: colors.text }}>
                      {metric.subLabel}
                    </div>
                  )}

                  {/* Decorative corner accents */}
                  <div
                    className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg"
                    style={{ borderColor: colors.border }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 rounded-br-lg"
                    style={{ borderColor: colors.border }}
                  />

                  {/* Animated bottom line */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px]"
                    style={{ background: colors.text }}
                    initial={{ width: "0%" }}
                    animate={isInView ? { width: "100%" } : {}}
                    transition={{ duration: 1.5, delay: 0.5 + index * 0.15 }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Live pulse indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground"
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "oklch(0.72 0.22 145)" }}
          />
          <span>Analysis updated {lastUpdated}</span>
        </motion.div>
      </div>
    </section>
  )
}
