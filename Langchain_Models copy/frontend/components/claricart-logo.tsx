"use client"

import { motion } from "framer-motion"

interface ClariCartLogoProps {
  size?: number
  animated?: boolean
}

export function ClariCartLogo({ size = 40, animated = true }: ClariCartLogoProps) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Main SVG Logo */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Definitions for gradients and filters */}
        <defs>
          {/* Neon green gradient */}
          <linearGradient id="neonGreenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.82 0.22 145)" />
            <stop offset="100%" stopColor="oklch(0.65 0.2 145)" />
          </linearGradient>
          
          {/* Cyan accent gradient */}
          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.8 0.2 195)" />
            <stop offset="100%" stopColor="oklch(0.7 0.18 195)" />
          </linearGradient>
          
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Neural glow filter */}
          <filter id="neuralGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Cart body forming a "C" shape */}
        <motion.path
          d="M12 14 L14 14 L18 30 L36 30 L40 18 L20 18"
          stroke="url(#neonGreenGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#glow)"
          initial={animated ? { pathLength: 0, opacity: 0 } : {}}
          animate={animated ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Cart handle - extending the C */}
        <motion.path
          d="M10 12 L14 14"
          stroke="url(#neonGreenGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
          initial={animated ? { pathLength: 0, opacity: 0 } : {}}
          animate={animated ? { pathLength: 1, opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
        />
        
        {/* Regular wheel */}
        <motion.circle
          cx="22"
          cy="36"
          r="3"
          fill="none"
          stroke="url(#neonGreenGradient)"
          strokeWidth="2"
          filter="url(#glow)"
          initial={animated ? { scale: 0, opacity: 0 } : {}}
          animate={animated ? { scale: 1, opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 1.2 }}
        />
        
        {/* AI Brain wheel - neural network node */}
        <g filter="url(#neuralGlow)">
          {/* Outer circle */}
          <motion.circle
            cx="34"
            cy="36"
            r="4"
            fill="none"
            stroke="url(#cyanGradient)"
            strokeWidth="1.5"
            initial={animated ? { scale: 0, opacity: 0 } : {}}
            animate={animated ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 1.3 }}
          />
          
          {/* Inner core */}
          <motion.circle
            cx="34"
            cy="36"
            r="2"
            fill="url(#cyanGradient)"
            initial={animated ? { scale: 0, opacity: 0 } : {}}
            animate={animated ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.3, delay: 1.4 }}
          />
          
          {/* Neural connection lines radiating from the AI wheel */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            const x2 = 34 + Math.cos(rad) * 6
            const y2 = 36 + Math.sin(rad) * 6
            return (
              <motion.line
                key={angle}
                x1="34"
                y1="36"
                x2={x2}
                y2={y2}
                stroke="url(#cyanGradient)"
                strokeWidth="0.75"
                strokeOpacity="0.6"
                initial={animated ? { pathLength: 0, opacity: 0 } : {}}
                animate={animated ? { pathLength: 1, opacity: 0.6 } : {}}
                transition={{ duration: 0.2, delay: 1.5 + i * 0.05 }}
              />
            )
          })}
          
          {/* Small neural dots at line ends */}
          {[0, 120, 240].map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            const cx = 34 + Math.cos(rad) * 6
            const cy = 36 + Math.sin(rad) * 6
            return (
              <motion.circle
                key={`dot-${angle}`}
                cx={cx}
                cy={cy}
                r="1"
                fill="url(#cyanGradient)"
                initial={animated ? { scale: 0, opacity: 0 } : {}}
                animate={animated ? { scale: 1, opacity: 0.8 } : {}}
                transition={{ duration: 0.2, delay: 1.7 + i * 0.1 }}
              />
            )
          })}
        </g>
        
        {/* Data scan line inside cart */}
        <motion.line
          x1="22"
          y1="22"
          x2="35"
          y2="22"
          stroke="url(#cyanGradient)"
          strokeWidth="1"
          strokeOpacity="0.5"
          strokeDasharray="2 2"
          initial={animated ? { opacity: 0, x: -5 } : {}}
          animate={animated ? { opacity: [0, 0.5, 0], x: 5 } : {}}
          transition={{ duration: 2, delay: 2, repeat: Infinity, repeatDelay: 3 }}
        />
        <motion.line
          x1="20"
          y1="26"
          x2="37"
          y2="26"
          stroke="url(#cyanGradient)"
          strokeWidth="1"
          strokeOpacity="0.4"
          strokeDasharray="3 2"
          initial={animated ? { opacity: 0, x: 5 } : {}}
          animate={animated ? { opacity: [0, 0.4, 0], x: -5 } : {}}
          transition={{ duration: 2, delay: 2.5, repeat: Infinity, repeatDelay: 3 }}
        />
      </svg>
      
      {/* Background glow */}
      <div 
        className="absolute inset-0 rounded-xl blur-lg -z-10 opacity-50"
        style={{
          background: "radial-gradient(circle at 70% 80%, oklch(0.8 0.2 195 / 0.4) 0%, oklch(0.72 0.22 145 / 0.2) 50%, transparent 70%)",
        }}
      />
    </div>
  )
}
