"use client"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, IC, StatusDot, formatTime } from "@/components/ui"
import { useState, useEffect, useCallback, useRef } from "react"
import { useAPI } from "@/hooks/useAPI"
import { Notification } from "@/types"
import { useRouter } from "next/navigation"

function useNotificationSound() {
  return useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch {}
  }, [])
}

export default function Header({ title }: { title: string }) {
  const { user, updateUser } = useAuth()
  const { get, patch } = useAPI()
  const router = useRouter()
  const [showNotif, setShowNotif] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const prevUnread = useRef(0)
  const playSound = useNotificationSound()
  const unread = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const d = await get("/notifications")
        const notifs = d.notifications || []
        const newUnread = notifs.filter((n: Notification) => !n.isRead).length
        if (prevUnread.current > 0 && newUnread > prevUnread.current) {
          playSound()
        }
        prevUnread.current = newUnread
        setNotifications(notifs)
      } catch {}
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 12000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    await patch("/notifications", {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    prevUnread.current = 0
  }

  const setStatus = async (status: string) => {
    if (!user) return
    await patch(`/users/${user.id}`, { status })
    updateUser({ status: status as any })
    setShowStatus(false)
  }

  const typeIcons: Record<string,string> = {
    NEW_CHAT: "chat", CHAT_ASSIGNED: "chat", NEW_MESSAGE: "chat", CHAT_RESOLVED: "resolve",
    TICKET_CREATED: "ticket", TICKET_UPDATED: "ticket", TICKET_ASSIGNED: "ticket", SYSTEM: "bell",
  }

  return (
    <header style={{ height: "var(--header-h)", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 24px", gap: 16, position: "sticky", top: 0, zIndex: 40 }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowNotif(!showNotif); setShowStatus(false) }}
            style={{ position: "relative", width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: showNotif ? "var(--surface2)" : "transparent", color: "var(--text2)", border: "1px solid transparent", transition: "all .15s", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
            onMouseLeave={e => { if (!showNotif) e.currentTarget.style.background = "transparent" }}>
            <IC name="bell" size={17} />
            {unread > 0 && (
              <span style={{ position: "absolute", top: 5, right: 5, minWidth: 16, height: 16, borderRadius: 99, background: "var(--danger)", border: "2px solid var(--surface)", fontSize: 9, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>{unread > 9 ? "9+" : unread}</span>
            )}
          </button>
          {showNotif && (
            <div className="slide-up" style={{ position: "absolute", right: 0, top: 44, width: 360, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden" }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                  Notifications {unread > 0 && <span style={{ fontSize: 11, background: "var(--danger)", color: "#fff", borderRadius: 99, padding: "1px 7px", marginLeft: 6 }}>{unread}</span>}
                </span>
                {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", background: "none", border: "none" }}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: 380, overflowY: "auto" }}>
                {notifications.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text3)", fontSize: 13 }}>No notifications</div>}
                {notifications.slice(0, 15).map(n => (
                  <div key={n.id} onClick={() => { setShowNotif(false); if (n.chatId) router.push("/dashboard/chats"); else if (n.ticketId) router.push("/dashboard/tickets") }}
                    style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, cursor: "pointer", background: n.isRead ? "transparent" : "rgba(59,130,246,0.05)", transition: "background .15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = n.isRead ? "transparent" : "rgba(59,130,246,0.05)"}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: n.isRead ? "var(--surface2)" : "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <IC name={typeIcons[n.type] || "bell"} size={16} color={n.isRead ? "var(--text3)" : "var(--accent)"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: "var(--text)", marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>{formatTime(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0, marginTop: 4 }} />}
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
                <button onClick={() => { setShowNotif(false); router.push("/dashboard/notifications") }} style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", background: "none", border: "none" }}>View all notifications</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <button onClick={() => { setShowStatus(!showStatus); setShowNotif(false) }}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 8, background: showStatus ? "var(--surface2)" : "transparent", border: "1px solid transparent", cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
            onMouseLeave={e => { if (!showStatus) e.currentTarget.style.background = "transparent" }}>
            <div style={{ position: "relative" }}>
              <Avatar user={user} size={28} />
              <StatusDot status={user?.status || "OFFLINE"} style={{ position: "absolute", bottom: 0, right: 0, border: "2px solid var(--surface)" }} />
            </div>
            <IC name="chevron-down" size={12} color="var(--text3)" />
          </button>
          {showStatus && (
            <div className="slide-up" style={{ position: "absolute", right: 0, top: 44, width: 200, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 12px 36px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{user?.email}</div>
              </div>
              {(["ONLINE","BUSY","AWAY","OFFLINE"] as const).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", fontSize: 13, color: "var(--text)", background: user?.status === s ? "var(--surface2)" : "none", border: "none", cursor: "pointer" }}>
                  <StatusDot status={s} />
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                  {user?.status === s && <IC name="check" size={13} color="var(--accent)" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {(showNotif || showStatus) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => { setShowNotif(false); setShowStatus(false) }} />
      )}
    </header>
  )
}