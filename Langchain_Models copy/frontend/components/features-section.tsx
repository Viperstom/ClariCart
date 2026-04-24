"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface FeaturesSectionProps {
  scrollY: number
}

const features = [
  {
    title: "AI-Powered Search",
    description: "Natural language product discovery that understands your intent and preferences.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    gradient: "from-neon-purple to-neon-cyan",
  },
  {
    title: "Instant Checkout",
    description: "One-click purchases with secure biometric authentication and crypto payments.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    gradient: "from-neon-cyan to-neon-purple",
  },
  {
    title: "AR Preview",
    description: "Visualize products in your space before purchase with augmented reality.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    gradient: "from-neon-purple to-neon-cyan",
  },
]

export function FeaturesSection({ scrollY }: FeaturesSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-32 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-sm font-medium text-neon-purple tracking-wide uppercase mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Built for the </span>
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, oklch(0.7 0.28 300) 0%, oklch(0.8 0.2 195) 100%)",
              }}
            >
              Future
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience commerce redefined with cutting-edge technology and seamless integration.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
              className="group relative"
            >
              <div 
                className="relative p-8 rounded-3xl border border-border bg-card/30 backdrop-blur-xl h-full transition-all duration-500 hover:border-neon-purple/40"
                style={{
                  boxShadow: "0 0 50px -20px oklch(0.7 0.25 300 / 0.15)",
                }}
              >
                {/* Hover glow */}
                <div 
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(circle at 50% 0%, oklch(0.7 0.25 300 / 0.1) 0%, transparent 60%)",
                  }}
                />

                {/* Icon container */}
                <div 
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-foreground transition-all duration-500 group-hover:scale-110"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.18 0.04 300) 0%, oklch(0.12 0.03 280) 100%)",
                    boxShadow: "0 0 30px -10px oklch(0.7 0.25 300 / 0.4), inset 0 1px 0 oklch(1 0 0 / 0.05)",
                    border: "1px solid oklch(0.3 0.05 300 / 0.3)",
                  }}
                >
                  <div className="text-neon-cyan group-hover:text-neon-purple transition-colors duration-300">
                    {feature.icon}
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-neon-cyan transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative corner */}
                <div 
                  className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "radial-gradient(circle at 100% 0%, oklch(0.8 0.2 195 / 0.15) 0%, transparent 70%)",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div 
            className="inline-flex items-center gap-4 p-2 pl-6 rounded-full border border-border bg-card/50 backdrop-blur-xl"
            style={{
              boxShadow: "0 0 40px -15px oklch(0.7 0.25 300 / 0.2)",
            }}
          >
            <span className="text-muted-foreground">Ready to transform your shopping experience?</span>
            <button 
              className="px-6 py-3 rounded-full font-medium text-background transition-all duration-300 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, oklch(0.7 0.28 300) 0%, oklch(0.8 0.2 195) 100%)",
              }}
            >
              Get Started
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
