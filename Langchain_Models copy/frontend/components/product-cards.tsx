"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"

interface ProductCardsProps {
  scrollY: number
}

const products = [
  {
    id: 1,
    name: "Quantum Headphones",
    price: "₹24,990",
    category: "Audio",
    image: "🎧",
    color: "purple",
    rating: 4.9,
    reviews: 2847,
  },
  {
    id: 2,
    name: "Neural Interface",
    price: "₹1,09,900",
    category: "Tech",
    image: "🧠",
    color: "cyan",
    rating: 4.8,
    reviews: 1256,
  },
  {
    id: 3,
    name: "Holo Display Pro",
    price: "₹74,900",
    category: "Display",
    image: "📱",
    color: "purple",
    rating: 4.7,
    reviews: 3421,
  },
  {
    id: 4,
    name: "Cyber Glasses",
    price: "₹36,900",
    category: "Wearables",
    image: "👓",
    color: "cyan",
    rating: 4.9,
    reviews: 1892,
  },
  {
    id: 5,
    name: "Flux Controller",
    price: "₹16,490",
    category: "Gaming",
    image: "🎮",
    color: "purple",
    rating: 4.6,
    reviews: 4521,
  },
  {
    id: 6,
    name: "Nano Watch",
    price: "₹49,900",
    category: "Wearables",
    image: "⌚",
    color: "cyan",
    rating: 4.8,
    reviews: 2134,
  },
]

export function ProductCards({ scrollY }: ProductCardsProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-sm font-medium text-neon-cyan tracking-wide uppercase mb-2 block">
                Featured Collection
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Next-Gen Products
              </h2>
            </div>
            <p className="text-muted-foreground max-w-md text-lg">
              Discover cutting-edge technology designed for the future.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 60, rotateX: 10 }}
              animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group"
              style={{ perspective: "1000px" }}
            >
              <div
                className="relative h-full rounded-2xl border border-border overflow-hidden transition-all duration-500"
                style={{
                  background: "linear-gradient(135deg, oklch(0.12 0.02 280) 0%, oklch(0.08 0.015 280) 100%)",
                  boxShadow: hoveredId === product.id
                    ? product.color === "purple"
                      ? "0 20px 60px -20px oklch(0.7 0.28 300 / 0.5), 0 0 30px -10px oklch(0.7 0.28 300 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.05)"
                      : "0 20px 60px -20px oklch(0.8 0.2 195 / 0.5), 0 0 30px -10px oklch(0.8 0.2 195 / 0.3), inset 0 1px 0 oklch(1 0 0 / 0.05)"
                    : "0 10px 40px -20px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.03)",
                  transform: hoveredId === product.id
                    ? "translateY(-8px) rotateX(2deg)"
                    : "translateY(0) rotateX(0)",
                  borderColor: hoveredId === product.id
                    ? product.color === "purple"
                      ? "oklch(0.7 0.28 300 / 0.5)"
                      : "oklch(0.8 0.2 195 / 0.5)"
                    : undefined,
                }}
              >
                {/* Glow background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: product.color === "purple"
                      ? "radial-gradient(circle at 50% 0%, oklch(0.7 0.28 300 / 0.15) 0%, transparent 60%)"
                      : "radial-gradient(circle at 50% 0%, oklch(0.8 0.2 195 / 0.15) 0%, transparent 60%)",
                  }}
                />

                {/* Product image area */}
                <div className="relative h-48 flex items-center justify-center bg-gradient-to-b from-muted/30 to-transparent">
                  <span className="text-7xl transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2">
                    {product.image}
                  </span>

                  {/* Floating particles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                          background: product.color === "purple" ? "oklch(0.7 0.28 300)" : "oklch(0.8 0.2 195)",
                          left: `${20 + i * 15}%`,
                          top: `${30 + i * 10}%`,
                        }}
                        animate={{
                          y: hoveredId === product.id ? [-10, 10, -10] : 0,
                          opacity: hoveredId === product.id ? [0.3, 0.8, 0.3] : 0,
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </div>

                  {/* Category badge */}
                  <div
                    className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md"
                    style={{
                      background: product.color === "purple"
                        ? "oklch(0.7 0.28 300 / 0.2)"
                        : "oklch(0.8 0.2 195 / 0.2)",
                      color: product.color === "purple"
                        ? "oklch(0.8 0.25 300)"
                        : "oklch(0.85 0.18 195)",
                      border: `1px solid ${product.color === "purple" ? "oklch(0.7 0.28 300 / 0.3)" : "oklch(0.8 0.2 195 / 0.3)"}`,
                    }}
                  >
                    {product.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-foreground group-hover:text-neon-cyan transition-colors duration-300">
                      {product.name}
                    </h3>
                    <span
                      className="text-xl font-bold bg-clip-text text-transparent"
                      style={{
                        backgroundImage: product.color === "purple"
                          ? "linear-gradient(135deg, oklch(0.7 0.28 300) 0%, oklch(0.65 0.2 330) 100%)"
                          : "linear-gradient(135deg, oklch(0.8 0.2 195) 0%, oklch(0.75 0.15 180) 100%)",
                      }}
                    >
                      {product.price}
                    </span>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? "text-neon-cyan" : "text-muted"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {product.rating} ({product.reviews.toLocaleString()})
                    </span>
                  </div>

                  {/* Add to cart button */}
                  <button
                    className="w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                    style={{
                      background: hoveredId === product.id
                        ? product.color === "purple"
                          ? "linear-gradient(135deg, oklch(0.7 0.28 300) 0%, oklch(0.65 0.22 280) 100%)"
                          : "linear-gradient(135deg, oklch(0.8 0.2 195) 0%, oklch(0.7 0.18 180) 100%)"
                        : "oklch(0.18 0.02 280)",
                      color: hoveredId === product.id ? "oklch(0.05 0.02 280)" : "oklch(0.9 0.01 280)",
                      border: hoveredId === product.id
                        ? "1px solid transparent"
                        : `1px solid oklch(0.25 0.04 280)`,
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Add to Cart
                  </button>
                </div>

                {/* Bottom glow line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: product.color === "purple"
                      ? "linear-gradient(90deg, transparent, oklch(0.7 0.28 300), transparent)"
                      : "linear-gradient(90deg, transparent, oklch(0.8 0.2 195), transparent)",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
