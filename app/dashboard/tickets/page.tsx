"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useAPI } from "@/hooks/useAPI"
import { Ticket } from "@/types"
import { Avatar, Badge, PriorityBadge, Btn, IC, Input, Select, Textarea, Modal, Empty, formatTime, formatDateTime, Spinner, Tag, Card } from "@/components/ui"

function useNotificationSound() {
  const playSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch {}
  }, [])
  return playSound
}

export default function TicketsPage() {
  const { user } = useAuth()
  const { get, post, patch } = useAPI()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selected, setSelected] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [search, setSearch] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [comment, setComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)
  const [newTicket, setNewTicket] = useState({ subject: "", description: "", category: "general", priority: "MEDIUM", tags: "" })
  const [creating, setCreating] = useState(false)
  const prevTicketCount = useRef(0)
  const playSound = useNotificationSound()

  const isManager = user?.role === "MANAGER" || user?.role === "ADMIN"
  const isAgent = user?.role === "AGENT"

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (filterPriority !== "all") params.set("priority", filterPriority)
      if (search) params.set("search", search)
      const data = await get(`/tickets?${params}`)
      const newTickets = data.tickets || []
      if (prevTicketCount.current > 0 && newTickets.length > prevTicketCount.current) {
        playSound()
      }
      prevTicketCount.current = newTickets.length
      setTickets(newTickets)
    } catch {} finally { setLoading(false) }
  }, [filterStatus, filterPriority, search])

  useEffect(() => { fetchTickets() }, [fetchTickets])
  useEffect(() => {
    const interval = setInterval(fetchTickets, 10000)
    return () => clearInterval(interval)
  }, [fetchTickets])

  const fetchSelected = async (id: string) => {
    const data = await get(`/tickets/${id}`)
    setSelected(data.ticket)
    setTickets(prev => prev.map(t => t.id === id ? data.ticket : t))
  }

  const createTicket = async () => {
    if (!newTicket.subject.trim()) return
    setCreating(true)
    try {
      const data = await post("/tickets", { ...newTicket, tags: newTicket.tags.split(",").map((t: string) => t.trim()).filter(Boolean) })
      setTickets(prev => [data.ticket, ...prev])
      setSelected(data.ticket)
      setShowNew(false)
      setNewTicket({ subject: "", description: "", category: "general", priority: "MEDIUM", tags: "" })
    } catch {} finally { setCreating(false) }
  }

  const addComment = async () => {
    if (!selected || !comment.trim()) return
    setSendingComment(true)
    try {
      await post(`/tickets/${selected.id}/comments`, { text: comment, isInternal })
      setComment(""); setIsInternal(false)
      fetchSelected(selected.id)
    } catch {} finally { setSendingComment(false) }
  }

  const updateStatus = async (ticketId: string, status: string) => {
    try {
      await patch(`/tickets/${ticketId}`, { status })
      fetchTickets()
      if (selected?.id === ticketId) fetchSelected(ticketId)
    } catch {}
  }

  const loadAgentsAndAssign = async () => {
    const data = await get("/users?role=AGENT")
    setAgents(data.users || [])
    setShowAssign(true)
  }

  const assignAgent = async (agentId: string) => {
    if (!selected) return
    try {
      await post(`/tickets/${selected.id}/assign`, { agentId })
      setShowAssign(false)
      fetchSelected(selected.id)
      fetchTickets()
      playSound()
    } catch (err: any) { alert(err.message) }
  }

  const filteredTickets = tickets.filter(t => {
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const priorityOrder: Record<string,number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  filteredTickets.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3))

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <div style={{ width: 360, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)", flexShrink: 0 }}>
        <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><IC name="search" size={14} color="var(--text3)" /></div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."
              style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px 8px 34px", color: "var(--text)", fontSize: 13 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 10px", color: "var(--text)", fontSize: 12, cursor: "pointer" }}>
              <option value="all">All Status</option>
              {["OPEN","IN_PROGRESS","PENDING","RESOLVED","CLOSED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 7, padding: "6px 10px", color: "var(--text)", fontSize: 12, cursor: "pointer" }}>
              <option value="all">All Priority</option>
              {["CRITICAL","HIGH","MEDIUM","LOW"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{filteredTickets.length} tickets</span>
          <Btn size="sm" variant="primary" onClick={() => setShowNew(true)}><IC name="plus" size={12} color="#fff" />New Ticket</Btn>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading && <div style={{ display: "flex", justifyContent: "center", padding: 30 }}><Spinner /></div>}
          {!loading && filteredTickets.length === 0 && <Empty icon="ticket" title="No tickets" subtitle="Adjust filters or create a new ticket" />}
          {filteredTickets.map(t => (
            <button key={t.id} onClick={() => fetchSelected(t.id)}
              style={{ width: "100%", padding: "12px 14px", textAlign: "left", border: "none", cursor: "pointer", borderBottom: "1px solid var(--border)", background: selected?.id === t.id ? "var(--surface2)" : "transparent", borderLeft: `3px solid ${selected?.id === t.id ? "var(--accent)" : "transparent"}`, transition: "all .12s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{t.subject}</span>
                {t.slaBreached && <IC name="warning" size={14} color="#ef4444" />}
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 5 }}>{t.user?.name} — {formatTime(t.updatedAt)}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <Badge label={t.status} />
                <PriorityBadge priority={t.priority} />
                <span style={{ fontSize: 10, color: "var(--text3)", background: "var(--surface2)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>{t.category}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {selected ? (
          <div style={{ padding: 28, maxWidth: 860, margin: "0 auto" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1.3, letterSpacing: "-0.02em" }}>{selected.subject}</h2>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {isManager && (
                    <Btn size="sm" variant="ghost" onClick={loadAgentsAndAssign}><IC name="users" size={13} />Assign Agent</Btn>
                  )}
                  {(isAgent || isManager) && (
                    <select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value)}
                      style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 12px", color: "var(--text)", fontSize: 13, cursor: "pointer" }}>
                      {["OPEN","IN_PROGRESS","PENDING","RESOLVED","CLOSED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Badge label={selected.status} />
                <PriorityBadge priority={selected.priority} />
                <span style={{ fontSize: 11, background: "var(--surface2)", color: "var(--text2)", padding: "3px 9px", borderRadius: 6, border: "1px solid var(--border)" }}>{selected.category}</span>
                {selected.slaBreached && <span style={{ fontSize: 11, background: "rgba(239,68,68,0.12)", color: "#f87171", padding: "3px 9px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", gap: 4 }}><IC name="warning" size={11} />SLA Breached</span>}
                {selected.tags?.map(tag => <Tag key={tag} label={tag} />)}
              </div>
            </div>

            <Card style={{ marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
                {[
                  ["Ticket ID", selected.id.slice(-8).toUpperCase()],
                  ["Reported By", selected.user?.name || "—"],
                  ["Assigned To", selected.agent?.name || "Unassigned"],
                  ["Department", selected.user?.department || "—"],
                  ["Created", formatDateTime(selected.createdAt)],
                  ["Last Updated", formatDateTime(selected.updatedAt)],
                  ["Due Date", selected.dueDate ? formatDateTime(selected.dueDate) : "Not set"],
                  ["Resolution SLA", selected.slaResolution ? `${selected.slaResolution}h` : "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 500, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>Description</div>
              <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{selected.description}</div>
            </Card>

            {selected.resolution && (
              <Card style={{ marginBottom: 20, border: "1px solid rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <IC name="resolve" size={16} color="#34d399" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>Resolution</span>
                  {selected.resolvedAt && <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: "auto" }}>{formatDateTime(selected.resolvedAt)}</span>}
                </div>
                <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7 }}>{selected.resolution}</div>
              </Card>
            )}

            <Card>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 20 }}>Activity ({selected.comments?.length || 0})</div>
              {selected.comments?.map(c => (
                <div key={c.id} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <Avatar user={c.user} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.user?.name}</span>
                      {c.isInternal && <span style={{ fontSize: 11, background: "rgba(245,158,11,0.12)", color: "#fbbf24", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.25)" }}>Internal Note</span>}
                      <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: "auto" }}>{formatDateTime(c.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.7, padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)", whiteSpace: "pre-wrap" }}>{c.text}</div>
                  </div>
                </div>
              ))}
              {selected.status !== "CLOSED" && (
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 8 }}>
                  <Textarea label="Add comment or update" value={comment} onChange={e => setComment(e.target.value)} placeholder="Write your update..." rows={4} />
                  {(isAgent || isManager) && (
                    <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer", fontSize: 13, color: "var(--text2)" }}>
                      <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
                      Mark as internal note (not visible to user)
                    </label>
                  )}
                  <div style={{ marginTop: 12 }}>
                    <Btn variant="primary" loading={sendingComment} onClick={addComment} disabled={!comment.trim()}>
                      <IC name="send" size={14} color="#fff" />{isInternal ? "Add Internal Note" : "Add Comment"}
                    </Btn>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Empty icon="ticket" title="Select a ticket" subtitle="Click any ticket from the list to view details" />
          </div>
        )}
      </div>

      {showNew && (
        <Modal title="Create New Support Ticket" onClose={() => setShowNew(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Input label="Subject" value={newTicket.subject} onChange={e => setNewTicket({ ...newTicket, subject: e.target.value })} placeholder="Brief summary of the issue" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Select label="Category" value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}>
                {["general","hardware","software","network","email","security","other"].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </Select>
              <Select label="Priority" value={newTicket.priority} onChange={e => setNewTicket({ ...newTicket, priority: e.target.value })}>
                {["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <Textarea label="Description" value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} placeholder="Detailed description..." rows={5} />
            <Input label="Tags (comma separated)" value={newTicket.tags} onChange={e => setNewTicket({ ...newTicket, tags: e.target.value })} placeholder="vpn, network, remote-work" />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
              <Btn variant="primary" loading={creating} onClick={createTicket} disabled={!newTicket.subject.trim()}>Create Ticket</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showAssign && (
        <Modal title="Assign Agent to Ticket" onClose={() => setShowAssign(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {agents.length === 0 && <div style={{ textAlign: "center", color: "var(--text3)", padding: 20 }}>No agents available</div>}
            {agents.map((agent: any) => (
              <button key={agent.id} onClick={() => assignAgent(agent.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, background: "var(--surface2)", borderRadius: 10, border: `1px solid ${selected?.agentId === agent.id ? "var(--accent)" : "var(--border)"}`, cursor: "pointer", textAlign: "left", transition: "border-color .15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = selected?.agentId === agent.id ? "var(--accent)" : "var(--border)"}>
                <Avatar user={agent} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{agent.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>{agent.department || "IT Helpdesk"} — {agent.status}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{agent._count?.chatsAsAgent || 0} active chats</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <Badge label={agent.status} />
                  {selected?.agentId === agent.id && <span style={{ fontSize: 11, color: "var(--accent)" }}>Current</span>}
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
