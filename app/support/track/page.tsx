"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { IC } from "@/components/ui"

function StatusBar({ status }: { status: string }) {
  const steps = ["OPEN", "IN_PROGRESS", "PENDING", "RESOLVED"]
  const idx = steps.indexOf(status)
  const colors: Record<string,string> = { OPEN: "#3b82f6", IN_PROGRESS: "#8b5cf6", PENDING: "#f59e0b", RESOLVED: "#10b981", CLOSED: "#6b7280" }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "20px 0" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: i <= idx ? colors[status] || "#3b82f6" : "var(--surface2)", border: `2px solid ${i <= idx ? colors[status] || "#3b82f6" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {i <= idx && <IC name="check" size={12} color="#fff" />}
            </div>
            <div style={{ fontSize: 10, color: i <= idx ? "var(--text)" : "var(--text3)", marginTop: 4, whiteSpace: "nowrap" }}>{s.replace("_"," ")}</div>
          </div>
          {i < steps.length - 1 && <div style={{ height: 2, flex: 1, background: i < idx ? colors[status] || "#3b82f6" : "var(--border)", marginBottom: 14 }} />}
        </div>
      ))}
    </div>
  )
}

export default function TrackTicket() {
  const router = useRouter()
  const [ticketNum, setTicketNum] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<any>(null)
  const [ticketNumber, setTicketNumber] = useState("")
  const [error, setError] = useState("")

  const track = async () => {
    if (!ticketNum || !email) { setError("Please enter both ticket number and email"); return }
    setLoading(true); setError(""); setTicket(null)
    try {
      const res = await fetch(`/api/public/ticket/track?id=${ticketNum.toLowerCase()}&email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setTicket(data.ticket)
      setTicketNumber(data.ticketNumber)
    } catch { setError("Network error. Please try again.") } finally { setLoading(false) }
  }

  const priorityColors: Record<string,string> = { CRITICAL: "#ef4444", HIGH: "#ea580c", MEDIUM: "#f59e0b", LOW: "#10b981" }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/support")} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 13, cursor: "pointer", background: "none", border: "none" }}>
          <IC name="arrow-right" size={14} color="var(--text3)" />Back
        </button>
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Track My Request</div>
      </header>

      <div style={{ maxWidth: 680, margin: "40px auto", padding: "0 24px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>Enter your ticket details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Ticket Number</label>
              <input value={ticketNum} onChange={e => setTicketNum(e.target.value.toUpperCase())} placeholder="e.g. ABC12345"
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14, fontFamily: "monospace", letterSpacing: "0.1em" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Email Address</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="The email you used to submit" type="email"
                style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14 }} />
            </div>
          </div>
          {error && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 13, marginBottom: 14 }}>{error}</div>}
          <button onClick={track} disabled={loading}
            style={{ width: "100%", padding: "11px", borderRadius: 9, background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", border: "none" }}>
            {loading ? "Searching..." : "Track Ticket"}
          </button>
        </div>

        {ticket && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)" }}>{ticket.subject}</div>
              <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: "var(--accent)", background: "var(--accent-dim)", padding: "4px 10px", borderRadius: 6 }}>#{ticketNumber}</span>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "rgba(59,130,246,0.12)", color: "#60a5fa", fontWeight: 600 }}>{ticket.status.replace("_"," ")}</span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: `${priorityColors[ticket.priority]}18`, color: priorityColors[ticket.priority], fontWeight: 600 }}>{ticket.priority}</span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "var(--surface2)", color: "var(--text3)", border: "1px solid var(--border)" }}>{ticket.category}</span>
            </div>

            <StatusBar status={ticket.status} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "16px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
              {[
                ["Submitted by", ticket.user?.name],
                ["Assigned to", ticket.agent?.name || "Being assigned..."],
                ["Submitted on", new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
                ["Last updated", new Date(ticket.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })],
              ].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>Description</div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, background: "var(--surface2)", padding: "12px 16px", borderRadius: 8, border: "1px solid var(--border)" }}>{ticket.description}</div>
            </div>

            {ticket.comments?.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>Updates ({ticket.comments.length})</div>
                {ticket.comments.map((c: any) => (
                  <div key={c.id} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: c.user?.role === "USER" ? "var(--surface2)" : "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 600, color: c.user?.role === "USER" ? "var(--text2)" : "var(--accent)" }}>
                      {c.user?.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.user?.name}</span>
                        {c.user?.role !== "USER" && <span style={{ fontSize: 10, background: "var(--accent-dim)", color: "var(--accent)", padding: "2px 7px", borderRadius: 4 }}>IT Support</span>}
                        <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: "auto" }}>{new Date(c.createdAt).toLocaleDateString("en-GB")}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6, background: "var(--surface2)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)" }}>{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ticket.resolution && (
              <div style={{ padding: 16, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 10, marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#34d399", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <IC name="check" size={14} color="#34d399" /> Resolution
                </div>
                <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{ticket.resolution}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}