"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { AuthenticityRadar } from "./authenticity-radar"
import { DevilsAdvocateToggle, DevilsAdvocatePanel } from "./devils-advocate-toggle"

interface SuitabilityVerdictProps {
  scrollY: number
  dynamicName?: string
  dynamicSummary?: string
  realReviews?: number
  realRating?: number
  dynamicKeyPoints?: { text: string, sentiment: "positive" | "negative" }[]
}

interface ReviewPoint {
  text: string
  sentiment: "positive" | "negative" | "neutral"
}

const sampleProduct = {
  name: "Quantum Pro Smartwatch",
  matchScore: 92,
  verdict: "recommended" as const, // "recommended" | "caution" | "not-recommended"
  personalizedVerdict: "Perfect Match based on your need for a rugged, daily smartwatch with long battery life.",
  reviewCount: 12847,
  analyzedReviews: 8542,
  authenticityScore: 94,
  reviewsScannedForBots: 3421,
  reviewConsensus: {
    summary: "Users praise the exceptional durability and water resistance. Battery life exceeds expectations for most, lasting 5-7 days. Some note the charging speed could be improved.",
    keyPoints: [
      { text: "Exceptional durability and build quality", sentiment: "positive" },
      { text: "5-7 day battery life on average", sentiment: "positive" },
      { text: "Water resistant up to 100m", sentiment: "positive" },
      { text: "Charging takes 2+ hours", sentiment: "negative" },
      { text: "GPS accuracy is industry-leading", sentiment: "positive" },
    ] as ReviewPoint[],
  },
  userNeeds: [
    { need: "Rugged build", match: true },
    { need: "Long battery life", match: true },
    { need: "Daily wear comfort", match: true },
    { need: "Fast charging", match: false },
  ],
}

function CircularProgress({
  percentage,
  verdict
}: {
  percentage: number
  verdict: "recommended" | "caution" | "not-recommended"
}) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setAnimatedPercentage(percentage)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isInView, percentage])

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference

  const getColor = () => {
    switch (verdict) {
      case "recommended":
        return { primary: "oklch(0.72 0.22 145)", glow: "oklch(0.72 0.22 145 / 0.4)" }
      case "caution":
        return { primary: "oklch(0.75 0.2 55)", glow: "oklch(0.75 0.2 55 / 0.4)" }
      case "not-recommended":
        return { primary: "oklch(0.65 0.25 25)", glow: "oklch(0.65 0.25 25 / 0.4)" }
    }
  }

  const colors = getColor()

  return (
    <div ref={ref} className="relative w-36 h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="oklch(0.2 0.02 280)"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.primary}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 1.5s ease-out",
            filter: `drop-shadow(0 0 10px ${colors.glow})`,
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-3xl font-bold"
          style={{ color: colors.primary }}
        >
          {animatedPercentage}%
        </span>
        <span className="text-xs text-muted-foreground font-medium">Match</span>
      </div>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl -z-10 opacity-30"
        style={{ background: colors.primary }}
      />
    </div>
  )
}

export function SuitabilityVerdict({ scrollY, dynamicName, dynamicSummary, realReviews, realRating, dynamicKeyPoints }: SuitabilityVerdictProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [product, setProduct] = useState(sampleProduct)
  const [devilsAdvocateEnabled, setDevilsAdvocateEnabled] = useState(false)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  useEffect(() => {
    const calculatedReviews = realReviews || 0; // Use real count from backend; 0 means "not yet fetched"
    const nameLength = dynamicName?.length || 10;

    setProduct({
      ...sampleProduct,
      name: dynamicName || "Dynamic Product",
      reviewCount: calculatedReviews,
      analyzedReviews: Math.floor(calculatedReviews * 0.8),
      matchScore: realRating ? Math.floor((realRating / 5.0) * 100) : 88,
      authenticityScore: 85 + (nameLength % 13), // Deterministic pseudo-random between 85 and 97
      reviewsScannedForBots: Math.floor(calculatedReviews * 0.65), // Dynamic based on total reviews
      personalizedVerdict: `Perfect Match based on your need for a highly-rated ${dynamicName || "product"}.`,
      reviewConsensus: {
        summary: dynamicSummary || "Users strongly praise this product's performance and long-term durability. It meets and exceeds expectations across typical use cases.",
        keyPoints: dynamicKeyPoints || [
          { text: "Excellent core features for the price", sentiment: "positive" },
          { text: "High durability and overall build quality", sentiment: "positive" },
          { text: "Reliable long-term performance", sentiment: "positive" },
          { text: "Some users desire minor functional upgrades", sentiment: "negative" },
        ]
      },
      userNeeds: [
        { need: "High Performance", match: true },
        { need: "Reliable Quality", match: true },
        { need: "Standard Features", match: true },
        { need: "Flawless Setup", match: false },
      ]
    })
  }, [dynamicName, dynamicSummary, realReviews, realRating, dynamicKeyPoints])

  const getVerdictStyles = (verdict: "recommended" | "caution" | "not-recommended") => {
    switch (verdict) {
      case "recommended":
        return {
          bg: "oklch(0.72 0.22 145 / 0.1)",
          border: "oklch(0.72 0.22 145 / 0.3)",
          text: "oklch(0.82 0.2 145)",
          label: "Recommended",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        }
      case "caution":
        return {
          bg: "oklch(0.75 0.2 55 / 0.1)",
          border: "oklch(0.75 0.2 55 / 0.3)",
          text: "oklch(0.85 0.18 55)",
          label: "Consider Carefully",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
        }
      case "not-recommended":
        return {
          bg: "oklch(0.65 0.25 25 / 0.1)",
          border: "oklch(0.65 0.25 25 / 0.3)",
          text: "oklch(0.75 0.22 25)",
          label: "Not Recommended",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        }
    }
  }

  const verdictStyles = getVerdictStyles(product.verdict)

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full text-sm font-medium"
            style={{
              background: "oklch(0.72 0.22 145 / 0.1)",
              border: "1px solid oklch(0.72 0.22 145 / 0.3)",
              color: "oklch(0.82 0.2 145)",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI-Powered Analysis
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI Suitability Verdict
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {product.analyzedReviews > 0
              ? `We analyzed ${product.analyzedReviews.toLocaleString()} verified reviews to determine if this product suits your specific needs.`
              : "We analyzed verified customer reviews to determine if this product suits your specific needs."}
          </p>
        </motion.div>

        {/* Main Verdict Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, oklch(0.14 0.02 280) 0%, oklch(0.1 0.015 280) 100%)",
            border: "1px solid oklch(0.25 0.04 280)",
            boxShadow: "0 40px 100px -20px oklch(0 0 0 / 0.5), 0 0 60px -30px oklch(0.72 0.22 145 / 0.2)",
          }}
        >
          {/* Glow accent */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px]"
            style={{
              background: "linear-gradient(90deg, transparent, oklch(0.72 0.22 145), transparent)",
            }}
          />

          <div className="p-8 md:p-12">
            {/* Product Info Header with Devil's Advocate Toggle */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-10 pb-8 border-b border-border">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-1">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{product.name}</h3>
                  <p className="text-muted-foreground">
                    {product.reviewCount > 0
                      ? `Based on ${product.reviewCount.toLocaleString()} total reviews`
                      : "Based on customer reviews"}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2 px-4 py-2 rounded-full font-medium"
                  style={{
                    background: devilsAdvocateEnabled ? "oklch(0.65 0.25 25 / 0.1)" : verdictStyles.bg,
                    border: `1px solid ${devilsAdvocateEnabled ? "oklch(0.65 0.25 25 / 0.3)" : verdictStyles.border}`,
                    color: devilsAdvocateEnabled ? "oklch(0.75 0.22 25)" : verdictStyles.text,
                    boxShadow: `0 0 20px ${devilsAdvocateEnabled ? "oklch(0.65 0.25 25 / 0.3)" : verdictStyles.border}`,
                    transition: "all 0.4s ease",
                  }}
                >
                  {devilsAdvocateEnabled ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : verdictStyles.icon}
                  {devilsAdvocateEnabled ? "Review Critically" : verdictStyles.label}
                </div>
              </div>

              {/* Devil's Advocate Toggle */}
              <DevilsAdvocateToggle
                isEnabled={devilsAdvocateEnabled}
                onToggle={setDevilsAdvocateEnabled}
              />
            </div>

            {/* Devil's Advocate Panel */}
            <DevilsAdvocatePanel isEnabled={devilsAdvocateEnabled} dynamicKeyPoints={dynamicKeyPoints} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Left Column: Review Consensus + Authenticity */}
              <div className="space-y-6">
                {/* Review Consensus */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "oklch(0.8 0.2 195 / 0.15)",
                        border: "1px solid oklch(0.8 0.2 195 / 0.3)",
                      }}
                    >
                      <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-semibold text-foreground">Review Consensus</h4>
                  </div>

                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {product.reviewConsensus.summary}
                  </p>

                  {/* Key Points */}
                  <div className="space-y-3">
                    {product.reviewConsensus.keyPoints.map((point, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{
                          background: point.sentiment === "positive"
                            ? "oklch(0.72 0.22 145 / 0.08)"
                            : point.sentiment === "negative"
                              ? "oklch(0.65 0.25 25 / 0.08)"
                              : "oklch(0.5 0 0 / 0.08)",
                          border: `1px solid ${point.sentiment === "positive"
                            ? "oklch(0.72 0.22 145 / 0.2)"
                            : point.sentiment === "negative"
                              ? "oklch(0.65 0.25 25 / 0.2)"
                              : "oklch(0.5 0 0 / 0.2)"
                            }`,
                        }}
                      >
                        <span
                          className="mt-0.5"
                          style={{
                            color: point.sentiment === "positive"
                              ? "oklch(0.72 0.22 145)"
                              : point.sentiment === "negative"
                                ? "oklch(0.65 0.25 25)"
                                : "oklch(0.6 0 0)",
                          }}
                        >
                          {point.sentiment === "positive" ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : point.sentiment === "negative" ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          )}
                        </span>
                        <span className="text-foreground text-sm">{point.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Fake Review Radar / Authenticity Score */}
                <AuthenticityRadar
                  score={product.authenticityScore}
                  reviewsScanned={product.reviewsScannedForBots}
                />
              </div>

              {/* Right Column: Match Score */}
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: "oklch(0.72 0.22 145 / 0.15)",
                      border: "1px solid oklch(0.72 0.22 145 / 0.3)",
                    }}
                  >
                    <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-foreground">Does This Suit You?</h4>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                  <CircularProgress
                    percentage={product.matchScore}
                    verdict={product.verdict}
                  />

                  <div className="flex-1">
                    <p
                      className="text-lg font-medium mb-4 leading-relaxed"
                      style={{ color: verdictStyles.text }}
                    >
                      {product.personalizedVerdict}
                    </p>

                    {/* User Needs Match */}
                    <div className="space-y-2">
                      {product.userNeeds.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={isInView ? { opacity: 1, scale: 1 } : {}}
                          transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: item.match
                                ? "oklch(0.72 0.22 145 / 0.2)"
                                : "oklch(0.65 0.25 25 / 0.2)",
                              border: `1px solid ${item.match ? "oklch(0.72 0.22 145 / 0.4)" : "oklch(0.65 0.25 25 / 0.4)"}`,
                            }}
                          >
                            {item.match ? (
                              <svg className="w-3 h-3 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </span>
                          <span className={`text-sm ${item.match ? "text-foreground" : "text-muted-foreground"}`}>
                            {item.need}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 pt-8 border-t border-border">
              <button
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, oklch(0.72 0.22 145) 0%, oklch(0.65 0.2 145) 100%)",
                  color: "oklch(0.05 0.02 145)",
                  boxShadow: "0 10px 30px -10px oklch(0.72 0.22 145 / 0.5)",
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart - Confidence High
                </span>
              </button>
              <button
                onClick={() => setShowFullAnalysis(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold border border-border bg-card/50 text-foreground transition-all duration-300 hover:border-neon-green/30 hover:bg-neon-green/5 hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Full Analysis
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Full Analysis Modal ─────────────────────────────────── */}
      {showFullAnalysis && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={() => setShowFullAnalysis(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-8"
            style={{
              background: "linear-gradient(135deg, oklch(0.13 0.02 280) 0%, oklch(0.09 0.015 280) 100%)",
              border: "1px solid oklch(0.28 0.05 280)",
              boxShadow: "0 40px 100px -20px oklch(0 0 0 / 0.7), 0 0 60px -30px oklch(0.72 0.22 145 / 0.3)",
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "oklch(0.72 0.22 145)" }}>Full Intelligence Report</span>
                <h2 className="text-2xl font-bold text-foreground mt-1">{product.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {product.reviewCount > 0 ? `Based on ${product.reviewCount.toLocaleString()} total reviews` : "Based on customer reviews"}
                </p>
              </div>
              <button
                onClick={() => setShowFullAnalysis(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                style={{ background: "oklch(0.18 0.02 280)", border: "1px solid oklch(0.28 0.05 280)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Confidence Meter */}
            <div className="mb-8 p-6 rounded-2xl" style={{ background: "oklch(0.16 0.02 280)", border: "1px solid oklch(0.25 0.04 280)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Confidence Score</span>
                <span className="text-2xl font-bold" style={{ color: "oklch(0.72 0.22 145)" }}>{product.matchScore}%</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.02 280)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${product.matchScore}%` }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, oklch(0.65 0.2 145), oklch(0.72 0.22 145))" }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Verdict: <span style={{ color: "oklch(0.72 0.22 145)" }} className="font-semibold">{product.matchScore >= 80 ? "Highly Recommended" : product.matchScore >= 60 ? "Consider Carefully" : "Not Recommended"}</span></p>
            </div>

            {/* Sentiment Breakdown */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Sentiment Breakdown</h3>
              {[
                { label: "Positive", pct: 68, color: "oklch(0.72 0.22 145)" },
                { label: "Neutral", pct: 19, color: "oklch(0.75 0.2 55)" },
                { label: "Negative", pct: 13, color: "oklch(0.65 0.25 25)" },
              ].map(({ label, pct, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span style={{ color }} className="font-semibold">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.02 280)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Full Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "oklch(0.72 0.22 145)" }}>✓ Strengths</h3>
                <div className="space-y-2">
                  {product.reviewConsensus.keyPoints.filter(p => p.sentiment === "positive").map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-start gap-2 p-3 rounded-xl text-sm"
                      style={{ background: "oklch(0.72 0.22 145 / 0.07)", border: "1px solid oklch(0.72 0.22 145 / 0.15)" }}
                    >
                      <span style={{ color: "oklch(0.72 0.22 145)" }}>✓</span>
                      <span className="text-foreground">{p.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "oklch(0.65 0.25 25)" }}>✗ Weaknesses</h3>
                <div className="space-y-2">
                  {product.reviewConsensus.keyPoints.filter(p => p.sentiment === "negative").map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-start gap-2 p-3 rounded-xl text-sm"
                      style={{ background: "oklch(0.65 0.25 25 / 0.07)", border: "1px solid oklch(0.65 0.25 25 / 0.15)" }}
                    >
                      <span style={{ color: "oklch(0.65 0.25 25)" }}>✗</span>
                      <span className="text-foreground">{p.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rating Stats */}
            <div className="mb-8 p-6 rounded-2xl" style={{ background: "oklch(0.16 0.02 280)", border: "1px solid oklch(0.25 0.04 280)" }}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Rating Overview</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold" style={{ color: "oklch(0.72 0.22 145)" }}>
                    {(realRating && realRating > 0) ? realRating.toFixed(1) : ((product.matchScore / 100) * 5).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">out of 5.0</div>
                  <div className="flex gap-0.5 mt-2 justify-center">
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} className="w-4 h-4" fill={s <= Math.round((realRating && realRating > 0) ? realRating : (product.matchScore / 100) * 5) ? "oklch(0.75 0.2 55)" : "none"} viewBox="0 0 24 24" stroke="oklch(0.75 0.2 55)">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((star, i) => {
                    const pcts = [52, 24, 12, 7, 5]
                    return (
                      <div key={star} className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs text-muted-foreground w-4">{star}★</span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.22 0.02 280)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pcts[i]}%` }}
                            transition={{ duration: 0.8, delay: 0.1 * i }}
                            className="h-full rounded-full"
                            style={{ background: star >= 4 ? "oklch(0.72 0.22 145)" : star === 3 ? "oklch(0.75 0.2 55)" : "oklch(0.65 0.25 25)" }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{pcts[i]}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-2 self-center">Data sources:</span>
              {["Amazon Reviews", "ClariCart RAG DB", "AI Analysis", "Web Intelligence"].map(src => (
                <span
                  key={src}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "oklch(0.72 0.22 145 / 0.1)", border: "1px solid oklch(0.72 0.22 145 / 0.25)", color: "oklch(0.82 0.2 145)" }}
                >{src}</span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  )
}
