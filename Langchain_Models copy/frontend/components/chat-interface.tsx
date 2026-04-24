"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hi! I'm ClariBot, your AI review analyst. Paste a product link and I'll analyze thousands of reviews to tell you if it actually suits your needs.",
  },
]

const quickReplies = [
  "Analyze a smartwatch",
  "Find durable headphones",
  "Check laptop reviews",
]

export function ChatInterface() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
      setIsMinimized(false);
      setTimeout(() => {
        const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (inputEl) inputEl.focus();
      }, 300);
    };
    window.addEventListener('open-claribot', handleOpenChat);
    return () => window.removeEventListener('open-claribot', handleOpenChat);
  }, []);

  const handleSend = async (content: string = input) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content.trim(), session_id: "default_session" }),
      });
      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Error: Could not parse response.",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.generative_ui_components) {
        // Dispatch custom event to trigger other UI components
        window.dispatchEvent(new CustomEvent('claricart-generative-ui', { detail: data.generative_ui_components }));
      }
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Network error: Make sure the FastAPI backend is running on port 8000!.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, oklch(0.72 0.22 145) 0%, oklch(0.8 0.2 195) 100%)",
              boxShadow: "0 0 40px oklch(0.72 0.22 145 / 0.5), 0 8px 32px -8px oklch(0 0 0 / 0.5)",
            }}
          >
            <svg className="w-7 h-7 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {/* Pulse ring */}
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.22 145) 0%, oklch(0.8 0.2 195) 100%)",
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "auto" : 600,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(180deg, oklch(0.14 0.025 280 / 0.95) 0%, oklch(0.1 0.02 280 / 0.98) 100%)",
              backdropFilter: "blur(40px)",
              border: "1px solid oklch(0.3 0.05 300 / 0.3)",
              boxShadow: "0 0 80px -20px oklch(0.7 0.28 300 / 0.3), 0 25px 50px -12px oklch(0 0 0 / 0.5), inset 0 1px 0 oklch(1 0 0 / 0.05)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "oklch(0.25 0.04 280)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.72 0.22 145 / 0.3) 0%, oklch(0.8 0.2 195 / 0.3) 100%)",
                    border: "1px solid oklch(0.72 0.22 145 / 0.3)",
                  }}
                >
                  <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">ClariBot</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <span className="text-xs text-muted-foreground">Ready to analyze</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M4 8h16M4 16h16" : "M20 12H4"} />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {!isMinimized && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl ${message.role === "user"
                            ? "rounded-br-md"
                            : "rounded-bl-md"
                            }`}
                          style={{
                            background: message.role === "user"
                              ? "linear-gradient(135deg, oklch(0.7 0.28 300) 0%, oklch(0.65 0.22 280) 100%)"
                              : "oklch(0.18 0.025 280)",
                            color: message.role === "user" ? "oklch(0.98 0 0)" : "oklch(0.9 0.01 280)",
                            border: message.role === "assistant" ? "1px solid oklch(0.25 0.04 280)" : "none",
                          }}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Typing indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div
                          className="px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1"
                          style={{
                            background: "oklch(0.18 0.025 280)",
                            border: "1px solid oklch(0.25 0.04 280)",
                          }}
                        >
                          {[...Array(3)].map((_, i) => (
                            <motion.span
                              key={i}
                              className="w-2 h-2 rounded-full bg-neon-cyan"
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Quick Replies */}
                  {messages.length < 3 && (
                    <div className="px-5 pb-3 flex flex-wrap gap-2">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply}
                          onClick={() => handleSend(reply)}
                          className="px-3 py-1.5 text-xs rounded-full border transition-all duration-300 hover:scale-105"
                          style={{
                            borderColor: "oklch(0.3 0.05 300 / 0.5)",
                            background: "oklch(0.15 0.02 280)",
                            color: "oklch(0.8 0.15 300)",
                          }}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input */}
                  <div
                    className="px-4 py-4 border-t mt-auto shrink-0"
                    style={{ borderColor: "oklch(0.25 0.04 280)" }}
                  >
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSend()
                      }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl"
                        style={{
                          background: "oklch(0.12 0.02 280)",
                          border: "1px solid oklch(0.25 0.04 280)",
                        }}
                      >
                        <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Ask me anything..."
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                        />
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-neon-cyan transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                          </svg>
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                        style={{
                          background: input.trim()
                            ? "linear-gradient(135deg, oklch(0.7 0.28 300) 0%, oklch(0.8 0.2 195) 100%)"
                            : "oklch(0.2 0.02 280)",
                          boxShadow: input.trim()
                            ? "0 0 20px -5px oklch(0.7 0.28 300 / 0.5)"
                            : "none",
                        }}
                      >
                        <svg className="w-5 h-5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
