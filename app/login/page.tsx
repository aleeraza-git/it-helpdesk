"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { IC } from "@/components/ui"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const result = await login(email, password)
    if (result.success) router.replace("/dashboard")
    else { setError(result.error || "Login failed"); setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", marginBottom: 16, boxShadow: "0 8px 32px rgba(59,130,246,0.35)" }}>
            <IC name="activity" size={32} color="#fff" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em" }}>IMARAT IT Support</div>
          <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 6 }}>Staff Portal — Sign In</div>
        </div>

        <form onSubmit={handleLogin} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text2)", marginBottom: 8 }}>Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="your@imarat.com"
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14, transition: "border-color .15s" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text2)", marginBottom: 8 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required placeholder="••••••••••••"
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", color: "var(--text)", fontSize: 14, transition: "border-color .15s" }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"} />
          </div>
          {error && (
            <div style={{ marginBottom: 20, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: 13 }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: "100%", height: 44, background: loading ? "var(--accent-dim)" : "var(--accent)", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: loading ? "not-allowed" : "pointer", border: "none" }}>
            {loading
              ? <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              : "Sign In"}
          </button>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <button type="button" onClick={() => router.push("/support")}
              style={{ fontSize: 13, color: "var(--text3)", background: "none", border: "none", cursor: "pointer" }}>
              ← Back to Support Portal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}