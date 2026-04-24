"use client"

import { motion } from "framer-motion"
import { MemoryProfileIndicator } from "./memory-profile-indicator"
import { ClariCartLogo } from "./claricart-logo"

export function ClariCartHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* ClariCart Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          {/* Smart Cart Logo */}
          <ClariCartLogo size={44} animated={true} />
          
          {/* Brand Name */}
          <div className="flex items-baseline">
            <span 
              className="text-2xl font-bold tracking-tight"
              style={{ color: "oklch(0.95 0.01 280)" }}
            >
              Clari
            </span>
            <span 
              className="text-2xl font-bold tracking-tight bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, oklch(0.72 0.22 145) 0%, oklch(0.8 0.2 195) 100%)",
              }}
            >
              Cart
            </span>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="hidden md:flex items-center gap-6"
        >
          {["Products", "Analysis", "Reviews"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium text-muted-foreground hover:text-neon-green transition-colors duration-300"
            >
              {item}
            </a>
          ))}
          
          {/* Memory Profile Indicator */}
          <MemoryProfileIndicator />
        </motion.nav>
      </div>
    </header>
  )
}
