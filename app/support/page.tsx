"use client"
import { useRouter } from "next/navigation"
import { IC } from "@/components/ui"

export default function SupportHome() {
  const router = useRouter()
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IC name="activity" size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>IMARAT IT Support</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>How can we help you today?</div>
          </div>
        </div>
        <button onClick={() => router.push("/login")}
          style={{ padding: "7px 16px", borderRadius: 8, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text2)", fontSize: 13, cursor: "pointer" }}>
          Staff Login
        </button>
      </header>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 24px 40px" }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 12 }}>IMARAT IT Support Portal</div>
        <div style={{ fontSize: 16, color: "var(--text3)", maxWidth: 480, margin: "0 auto" }}>Get help from our IT team. Submit a ticket, start a live chat, or track your existing request.</div>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: 20, padding: "0 32px 60px", justifyContent: "center", flexWrap: "wrap", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        {[
          { icon: "ticket", title: "Submit a Ticket", sub: "Report an issue and get a ticket number to track your request.", color: "#3b82f6", btn: "Submit Ticket", href: "/support/ticket" },
          { icon: "chat", title: "Live Chat", sub: "Chat with an IT agent in real-time for immediate assistance.", color: "#10b981", btn: "Start Chat", href: "/support/chat" },
          { icon: "search", title: "Track My Request", sub: "Check the status of your existing ticket using your ticket number.", color: "#8b5cf6", btn: "Track Request", href: "/support/track" },
        ].map(card => (
          <div key={card.title} style={{ flex: "1 1 240px", maxWidth: 280, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, borderTop: `4px solid ${card.color}`, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${card.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IC name={card.icon} size={26} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>{card.title}</div>
              <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6 }}>{card.sub}</div>
            </div>
            <button onClick={() => router.push(card.href)}
              style={{ marginTop: "auto", padding: "10px 20px", borderRadius: 9, background: card.color, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", transition: "opacity .15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              {card.btn}
            </button>
          </div>
        ))}
      </div>

      {/* Info bar */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "20px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text3)" }}>
          Support Hours: Monday – Friday, 8:00 AM – 6:00 PM PKT &nbsp;|&nbsp; Email: itsupport@imarat.com
        </div>
      </div>
    </div>
  )
}