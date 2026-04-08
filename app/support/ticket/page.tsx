"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { IC } from "@/components/ui"

export default function SubmitTicket() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", description: "", category: "general", priority: "MEDIUM" })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const submit = async () => {
    if (!form.name || !form.email || !form.subject || !form.description) { setError("Please fill in all required fields."); return }
    setSubmitting(true); setError("")
    try {
      const res = await fetch("/api/public/ticket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to submit"); return }
      setResult(data)
    } catch { setError("Network error. Please try again.") } finally { setSubmitting(false) }
  }

  const inp = (label: string, key: string, type = "text", placeholder = "", required = true) => (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>
      <input type={type} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={placeholder}
        style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14 }} />
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => router.push("/support")} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 13, cursor: "pointer", background: "none", border: "none" }}>
          <IC name="arrow-right" size={14} color="var(--text3)" />Back
        </button>
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Submit a Support Ticket</div>
      </header>

      <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 24px" }}>
        {result ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 40, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <IC name="check" size={32} color="#10b981" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Ticket Submitted!</div>
            <div style={{ fontSize: 14, color: "var(--text3)", marginBottom: 24 }}>We have received your request. Our team will respond shortly.</div>
            <div style={{ background: "var(--surface2)", border: "2px dashed var(--border)", borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 6 }}>Your Ticket Number</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>{result.ticketNumber}</div>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6 }}>Save this number to track your request</div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>A confirmation has been noted for <strong style={{ color: "var(--text)" }}>{form.email}</strong></div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => router.push("/support/track")}
                style={{ padding: "10px 20px", borderRadius: 9, background: "var(--accent)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none" }}>
                Track My Ticket
              </button>
              <button onClick={() => { setResult(null); setForm({ name: "", email: "", phone: "", subject: "", description: "", category: "general", priority: "MEDIUM" }) }}
                style={{ padding: "10px 20px", borderRadius: 9, background: "var(--surface2)", color: "var(--text2)", fontSize: 14, cursor: "pointer", border: "1px solid var(--border)" }}>
                Submit Another
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>New Support Request</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {inp("Full Name", "name", "text", "John Smith")}
                {inp("Email Address", "email", "email", "john@company.com")}
                {inp("Phone Number", "phone", "text", "+92-XXX-XXXXXXX", false)}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14 }}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14 }}>
                  {["general","hardware","software","network","email","security","other"].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              {inp("Subject", "subject", "text", "Brief description of the issue")}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Description <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={5}
                  placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, and what you have already tried..."
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
              </div>
              {error && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 13 }}>{error}</div>}
              <button onClick={submit} disabled={submitting}
                style={{ padding: "12px", borderRadius: 10, background: submitting ? "var(--accent-dim)" : "var(--accent)", color: "#fff", fontSize: 15, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}