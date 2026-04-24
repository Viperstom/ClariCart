"use client"

import { motion } from "framer-motion"

interface HeroSectionProps {
  scrollY: number
}

export function HeroSection({ scrollY }: HeroSectionProps) {
  const opacity = Math.max(0, 1 - scrollY / 400)
  const scale = Math.max(0.8, 1 - scrollY / 2000)
  const translateY = scrollY * 0.3

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center max-w-4xl mx-auto"
        style={{
          opacity,
          transform: `scale(${scale}) translateY(${translateY}px)`,
        }}
      >
        {/* Glowing badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full backdrop-blur-sm"
          style={{
            background: "oklch(0.72 0.22 145 / 0.1)",
            border: "1px solid oklch(0.72 0.22 145 / 0.3)",
          }}
        >
          <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
          <span className="text-sm font-medium text-neon-green">AI-Powered Review Analysis</span>
        </motion.div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
          <span className="text-foreground">Know Before</span>
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, oklch(0.72 0.22 145) 0%, oklch(0.8 0.2 195) 50%, oklch(0.7 0.28 300) 100%)",
            }}
          >
            You Buy
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          ClariCart analyzes thousands of reviews to tell you if a product
          actually suits your specific needs. No more guessing.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-claribot'))}
            className="group relative px-8 py-4 rounded-xl font-semibold text-background overflow-hidden transition-all duration-300 hover:scale-105">
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.22 145) 0%, oklch(0.65 0.2 145) 100%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: "linear-gradient(135deg, oklch(0.75 0.22 145) 0%, oklch(0.72 0.22 145) 100%)",
              }}
            />
            <span className="relative z-10 flex items-center gap-2">
              Analyze a Product
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </button>

          <button
            onClick={() => window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' })}
            className="group px-8 py-4 rounded-xl font-semibold border border-border bg-card/50 backdrop-blur-sm text-foreground transition-all duration-300 hover:border-neon-green/50 hover:bg-neon-green/10">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              See How It Works
            </span>
          </button>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">Scroll to Explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-neon-cyan"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
