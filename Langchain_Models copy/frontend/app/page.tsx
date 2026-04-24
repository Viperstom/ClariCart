"use client"

import { useState, useEffect, useRef } from "react"
import { ProductCards } from "@/components/product-cards"
import { ChatInterface } from "@/components/chat-interface"
import { HeroSection } from "@/components/hero-section"
import { StatsSection } from "@/components/stats-section"
import { FeaturesSection } from "@/components/features-section"
import { ClariCartHeader } from "@/components/claricart-header"
import { SuitabilityVerdict } from "@/components/suitability-verdict"

export default function Dashboard() {
  const [scrollY, setScrollY] = useState(0)
  const [hasSearched, setHasSearched] = useState(false)
  const [searchedProduct, setSearchedProduct] = useState("Dynamic Product")
  const [dynamicSummary, setDynamicSummary] = useState("")
  const [realReviews, setRealReviews] = useState(0)
  const [realRating, setRealRating] = useState(0)
  const [dynamicKeyPoints, setDynamicKeyPoints] = useState<{ text: string, sentiment: "positive" | "negative" }[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setScrollY(containerRef.current.scrollTop)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
    }

    const handleGenerativeUI = (e: any) => {
      // RESET OLD STATE so data doesn't leak between searches
      setSearchedProduct("")
      setRealReviews(0)
      setRealRating(0)
      setDynamicSummary("")
      setDynamicKeyPoints([])

      setHasSearched(true)
      if (e.detail && e.detail.length > 0 && e.detail[0].product_name) {
        setSearchedProduct(e.detail[0].product_name.replace(/analyze/i, "").replace(/Product Found/i, "").trim() || "Analyzing Product...")

        let fullText = e.detail[0].bot_text || "";
        let finalSummary = fullText;
        let newPoints: { text: string, sentiment: "positive" | "negative" }[] = [];

        if (fullText.includes("PROS:")) {
          const parts = fullText.split("PROS:");
          finalSummary = parts[0].trim();
          const prosCons = parts[1].split("CONS:");
          if (prosCons.length > 0) {
            const pros = prosCons[0].split("\n").filter((p: string) => p.includes("-")).map((p: string) => ({ text: p.replace("-", "").replace("*", "").trim(), sentiment: "positive" as const }));
            newPoints = [...newPoints, ...pros];
          }
          if (prosCons.length > 1) {
            const cons = prosCons[1].split("\n").filter((p: string) => p.includes("-")).map((p: string) => ({ text: p.replace("-", "").replace("*", "").trim(), sentiment: "negative" as const }));
            newPoints = [...newPoints, ...cons];
          }
        }

        if (finalSummary) setDynamicSummary(finalSummary)
        if (newPoints.length > 0) setDynamicKeyPoints(newPoints)

        if (e.detail[0].reviews) setRealReviews(e.detail[0].reviews)
        if (e.detail[0].rating) setRealRating(e.detail[0].rating)
      }
    }
    window.addEventListener("claricart-generative-ui", handleGenerativeUI)

    return () => {
      if (container) container.removeEventListener("scroll", handleScroll)
      window.removeEventListener("claricart-generative-ui", handleGenerativeUI)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto overflow-x-hidden bg-background relative"
    >
      {/* ClariCart Header */}
      <ClariCartHeader />

      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, oklch(0.72 0.22 145) 0%, transparent 70%)",
            transform: `translate(${scrollY * 0.05}px, ${scrollY * 0.02}px)`,
          }}
        />
        <div
          className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: "radial-gradient(circle, oklch(0.8 0.2 195) 0%, transparent 70%)",
            transform: `translate(${-scrollY * 0.03}px, ${-scrollY * 0.02}px)`,
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
          style={{
            background: "radial-gradient(circle, oklch(0.7 0.28 300) 0%, transparent 70%)",
            transform: `translate(-50%, -50%) rotate(${scrollY * 0.1}deg)`,
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.72 0.22 145) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.72 0.22 145) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content */}
      <main className="relative z-10">
        <HeroSection scrollY={scrollY} />
        {hasSearched ? (
          <>
            <SuitabilityVerdict scrollY={scrollY} dynamicName={searchedProduct} dynamicSummary={dynamicSummary} realReviews={realReviews} realRating={realRating} dynamicKeyPoints={dynamicKeyPoints.length > 0 ? dynamicKeyPoints : undefined} />
            <StatsSection scrollY={scrollY} realReviews={realReviews} realRating={realRating} productName={searchedProduct} />
            <ProductCards scrollY={scrollY} />
            <FeaturesSection scrollY={scrollY} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pt-24 pb-32 opacity-75">
            <h3 className="text-xl font-medium mb-4 text-neon-cyan/50">Awaiting Product Analysis Pipeline</h3>
            <p className="text-muted-foreground text-center max-w-lg">
              The ClariCart LLM is standing by at zero-state. Type the name or link of a product into the floating chat interface to initialize a full Generative AI extraction and analysis.
            </p>
          </div>
        )}
      </main>

      {/* Floating Chat Interface */}
      <ChatInterface />
    </div>
  )
}
