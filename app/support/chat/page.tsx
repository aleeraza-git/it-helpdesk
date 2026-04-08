"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { IC } from "@/components/ui"

export default function PublicChat() {
  const router = useRouter()
  const [step, setStep] = useState<"form"|"chat">("form")
  const [form, setForm] = useState({ name: "", email: "", subject: "", category: "general", message: "" })
  const [chatId, setChatId] = useState("")
  const [agentName, setAgentName] = useState("")
  const [chatStatus, setChatStatus] = useState("")
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [sending, setSending] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (step === "chat" && chatId) {
      const poll = setInterval(async () => {
        const res = await fetch(`/api/public/chat/${chatId}/messages?email=${encodeURIComponent(form.email)}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.chat.messages || [])
          setChatStatus(data.chat.status)
        }
      }, 4000)
      return () => clearInterval(poll)
    }
  }, [step, chatId, form.email])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages.length])

  const startChat = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) { setError("Please fill in all fields"); return }
    setStarting(true); setError("")
    try {
      const res = await fetch("/api/public/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setChatId(data.chatId)
      setAgentName(data.agentName || "")
      setChatStatus(data.status)
      // Load initial messages
      const msgRes = await fetch(`/api/public/chat/${data.chatId}/messages?email=${encodeURIComponent(form.email)}`)
      const msgData = await msgRes.json()
      setMessages(msgData.chat?.messages || [])
      setStep("chat")
    } catch { setError("Failed to start chat. Please try again.") } finally { setStarting(false) }
  }

  const sendMessage = async () => {
    if (!newMsg.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/public/chat/${chatId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: newMsg, email: form.email }) })
      if (res.ok) {
        const data = await res.json()
        setMessages(prev => [...prev, data.message])
        setNewMsg("")
      }
    } catch {} finally { setSending(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <button onClick={() => router.push("/support")} style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text2)", fontSize: 13, cursor: "pointer", background: "none", border: "none" }}>
          <IC name="arrow-right" size={14} color="var(--text3)" />Back
        </button>
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Live Support Chat</div>
        {step === "chat" && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: chatStatus === "ACTIVE" ? "#10b981" : "#f59e0b", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 13, color: "var(--text2)" }}>{chatStatus === "ACTIVE" ? (agentName ? `Connected with ${agentName}` : "Connected") : "In Queue — Agent will join shortly"}</span>
          </div>
        )}
      </header>

      {step === "form" ? (
        <div style={{ maxWidth: 560, margin: "40px auto", padding: "0 24px", width: "100%" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Start a Live Chat</div>
            <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 24 }}>Fill in your details and an agent will assist you shortly.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[["Full Name","name","text","John Smith"],["Email","email","email","john@company.com"]].map(([l,k,t,p]) => (
                  <div key={k}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>{l} <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type={t} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={p}
                      style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14 }} />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14 }}>
                  {["general","hardware","software","network","email","security"].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Subject <span style={{ color: "#ef4444" }}>*</span></label>
                <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of your issue"
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Initial Message <span style={{ color: "#ef4444" }}>*</span></label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Describe your issue..."
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14, resize: "none", fontFamily: "inherit" }} />
              </div>
              {error && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 13 }}>{error}</div>}
              <button onClick={startChat} disabled={starting}
                style={{ padding: "12px", borderRadius: 10, background: "#10b981", color: "#fff", fontSize: 15, fontWeight: 600, cursor: starting ? "not-allowed" : "pointer", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <IC name="chat" size={18} color="#fff" />
                {starting ? "Connecting..." : "Start Live Chat"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 720, width: "100%", margin: "0 auto", padding: "20px 24px", gap: 0 }}>
          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
            {chatStatus === "QUEUED" && (
              <div style={{ textAlign: "center", padding: 20, background: "rgba(245,158,11,0.08)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.2)", marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#fbbf24" }}>You are in the queue</div>
                <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>An agent will be with you shortly. Please wait.</div>
              </div>
            )}
            {messages.map((msg: any) => {
              const isMe = msg.sender?.role === "USER"
              const isSystem = msg.type === "SYSTEM"
              if (isSystem) return (
                <div key={msg.id} style={{ textAlign: "center", margin: "8px 0" }}>
                  <span style={{ fontSize: 12, color: "var(--text3)", background: "var(--surface2)", padding: "4px 12px", borderRadius: 99, border: "1px solid var(--border)" }}>{msg.text}</span>
                </div>
              )
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: isMe ? "row-reverse" : "row", gap: 10, marginBottom: 14, paddingLeft: isMe ? 48 : 0, paddingRight: isMe ? 0 : 48 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: isMe ? "var(--surface2)" : "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: isMe ? "var(--text2)" : "var(--accent)" }}>
                    {msg.sender?.name?.charAt(0)}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>{isMe ? "You" : msg.sender?.name}</div>
                    <div style={{ background: isMe ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "var(--surface)", color: isMe ? "#fff" : "var(--text)", padding: "10px 14px", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.55, border: isMe ? "none" : "1px solid var(--border)", boxShadow: isMe ? "0 4px 12px rgba(59,130,246,0.3)" : "none" }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>{new Date(msg.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, display: "flex", gap: 10 }}>
            <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Type your message... (Enter to send)"
              rows={2} style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 14, resize: "none", fontFamily: "inherit" }} />
            <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
              style={{ padding: "10px 18px", borderRadius: 10, background: newMsg.trim() ? "#3b82f6" : "var(--surface2)", color: newMsg.trim() ? "#fff" : "var(--text3)", border: "none", cursor: newMsg.trim() ? "pointer" : "not-allowed", flexShrink: 0, display: "flex", alignItems: "center" }}>
              <IC name="send" size={18} color={newMsg.trim() ? "#fff" : "var(--text3)"} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}