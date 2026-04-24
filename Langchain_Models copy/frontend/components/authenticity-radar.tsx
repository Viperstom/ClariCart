"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"

interface AuthenticityRadarProps {
  score: number
  reviewsScanned: number
}

export function AuthenticityRadar({ score, reviewsScanned }: AuthenticityRadarProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const [scanPhase, setScanPhase] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      // Animate the score
      const timer = setTimeout(() => {
        setAnimatedScore(score)
      }, 500)
      
      // Scan animation phases
      const scanInterval = setInterval(() => {
        setScanPhase(prev => (prev + 1) % 360)
      }, 30)

      return () => {
        clearTimeout(timer)
        clearInterval(scanInterval)
      }
    }
  }, [isInView, score])

  const circumference = 2 * Math.PI * 42
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  // Color based on score
  const getColor = () => {
    if (score >= 80) return { primary: "oklch(0.72 0.22 145)", glow: "oklch(0.72 0.22 145 / 0.5)" }
    if (score >= 60) return { primary: "oklch(0.8 0.2 195)", glow: "oklch(0.8 0.2 195 / 0.5)" }
    if (score >= 40) return { primary: "oklch(0.75 0.2 55)", glow: "oklch(0.75 0.2 55 / 0.5)" }
    return { primary: "oklch(0.65 0.25 25)", glow: "oklch(0.65 0.25 25 / 0.5)" }
  }

  const colors = getColor()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative p-6 rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, oklch(0.12 0.02 280) 0%, oklch(0.08 0.015 280) 100%)",
        border: "1px solid oklch(0.25 0.04 280)",
        boxShadow: `0 0 40px -10px ${colors.glow}`,
      }}
    >
      {/* Scanning beam effect */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ opacity: 0.15 }}
      >
        <div 
          className="absolute top-1/2 left-1/2 w-full h-1"
          style={{
            background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
            transform: `translate(-50%, -50%) rotate(${scanPhase}deg)`,
            transformOrigin: "center",
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${colors.primary}20`,
            border: `1px solid ${colors.primary}40`,
          }}
        >
          <svg className="w-5 h-5" style={{ color: colors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-foreground">Fake Review Radar</h4>
          <p className="text-xs text-muted-foreground">Authenticity Score</p>
        </div>
      </div>

      {/* Gauge */}
      <div className="flex items-center gap-6">
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="oklch(0.2 0.02 280)"
              strokeWidth="6"
            />
            
            {/* Animated scan ring */}
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={colors.primary}
              strokeWidth="2"
              strokeDasharray="10 20"
              strokeOpacity={0.3}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "50% 50%" }}
            />
            
            {/* Progress arc */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={colors.primary}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: "stroke-dashoffset 1.5s ease-out",
                filter: `drop-shadow(0 0 8px ${colors.glow})`,
              }}
            />

            {/* Glowing dots on the progress */}
            {animatedScore > 0 && (
              <circle
                cx={50 + 42 * Math.cos(-Math.PI / 2 + (animatedScore / 100) * Math.PI * 2)}
                cy={50 + 42 * Math.sin(-Math.PI / 2 + (animatedScore / 100) * Math.PI * 2)}
                r="4"
                fill={colors.primary}
                style={{
                  filter: `drop-shadow(0 0 6px ${colors.primary})`,
                  transition: "all 1.5s ease-out",
                }}
              />
            )}
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-2xl font-bold"
              style={{ color: colors.primary }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {animatedScore}%
            </motion.span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Authentic</span>
          </div>

          {/* Outer glow */}
          <div 
            className="absolute inset-2 rounded-full blur-lg -z-10 opacity-30"
            style={{ background: colors.primary }}
          />
        </div>

        {/* Status text */}
        <div className="flex-1">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-3"
            style={{
              background: `${colors.primary}15`,
              border: `1px solid ${colors.primary}30`,
              color: colors.primary,
            }}
          >
            <motion.span 
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: colors.primary }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {score >= 80 ? "Highly Trusted" : score >= 60 ? "Generally Trusted" : score >= 40 ? "Mixed Signals" : "Low Trust"}
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI scanned <span className="text-foreground font-medium">{reviewsScanned.toLocaleString()}</span> reviews for bot behavior, duplicate patterns, and manipulation signals.
          </p>
        </div>
      </div>

      {/* Scan line animation */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.primary}, transparent)`,
        }}
        animate={{ 
          opacity: [0.3, 0.8, 0.3],
          scaleX: [0.5, 1, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  )
}
