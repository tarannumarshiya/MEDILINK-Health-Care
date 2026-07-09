"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

interface Message {
  id: number;
  role: "bot" | "user";
  text: string;
}

const quickReplies = [
  "Book an appointment",
  "Emergency contact",
  "Our departments",
  "Working hours",
];

const botResponses: Record<string, string> = {
  "book an appointment": "You can book an appointment by visiting our Appointment page or calling +880 1712 889900. We have 50+ specialists available. Shall I take you there?",
  "emergency contact": "🚨 Emergency: +880 1999 123456 (Available 24/7). For life-threatening situations, please call immediately. Our emergency department is always open.",
  "our departments": "We have 11 specialized departments: Emergency/Trauma, Cardiology, Neurology, Orthopedics, Pediatrics, Oncology, Radiology, Gynecology, General Medicine, Laboratory, and Pharmacy.",
  "working hours": "Our outpatient services run Mon–Sat, 8am–8pm. Emergency & ICU are open 24/7. Pharmacy is open 8am–10pm.",
};

function getBotReply(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(botResponses)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  if (lower.includes("appoint") || lower.includes("book")) return botResponses["book an appointment"];
  if (lower.includes("emergency") || lower.includes("urgent")) return botResponses["emergency contact"];
  if (lower.includes("depart") || lower.includes("speciali")) return botResponses["our departments"];
  if (lower.includes("hour") || lower.includes("time") || lower.includes("open")) return botResponses["working hours"];
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey"))
    return "Hello! I'm Medi, your Medilink assistant. I can help with appointments, departments, emergencies, or general queries. What do you need?";
  if (lower.includes("thank")) return "You're welcome! Is there anything else I can help you with?";
  return "I can help with appointments, department info, emergency contacts, and working hours. For complex queries, please call us at +880 1712 889900 or email info@medilinkhealth.com.";
}

let msgId = 0;

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: msgId++, role: "bot", text: "Hi! I'm Medi 👋 — your Medilink health assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    if (!text.trim()) return;
    const userMsg: Message = { id: msgId++, role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = getBotReply(text);
      setMessages((m) => [...m, { id: msgId++, role: "bot", text: reply }]);
      setTyping(false);
    }, 900);
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-lg sm:bottom-6 sm:right-6"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Pulse ring */}
      {!open && (
        <span className="pointer-events-none fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full opacity-60 sm:bottom-6 sm:right-6"
          style={{ animation: "pulse-ring 2.4s ease-out infinite", background: "var(--gradient-primary)" }}
        />
      )}

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed bottom-36 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[340px] flex-col overflow-hidden rounded-3xl shadow-2xl sm:bottom-24 sm:right-6 sm:w-[340px]"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(24px) saturate(160%)",
              WebkitBackdropFilter: "blur(24px) saturate(160%)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--shadow-glow), 0 32px 64px -16px rgba(0,0,0,0.25)",
              height: "480px",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: "var(--gradient-primary)" }}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-white">Medi — Medilink Assistant</p>
                <span className="flex items-center gap-1.5 text-[11px] text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
                  Online
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-scroll px-4 py-4 space-y-3" style={{ overflowY: "scroll", WebkitOverflowScrolling: "touch" }}>
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${m.role === "bot" ? "bg-primary" : "bg-primary/60"}`}>
                    {m.role === "bot" ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "bot"
                        ? "bg-background/80 text-foreground rounded-tl-sm"
                        : "text-primary-foreground rounded-tr-sm"
                    }`}
                    style={m.role === "user" ? { background: "var(--gradient-primary)" } : {}}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                    <Bot size={14} />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-background/80 px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/60"
                        style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary/20"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2 border-t border-border px-4 py-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Type a message..."
                className="h-10 flex-1 rounded-xl border border-input bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => send(input)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-primary-foreground transition hover:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
