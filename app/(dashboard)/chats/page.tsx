'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAPI } from '@/hooks/useAPI'
import { Chat } from '@/types'
import ChatWindow from '@/components/chat/ChatWindow'
import { Avatar, Badge, PriorityBadge, Btn, IC, Input, Select, Modal, Textarea, Empty, formatTime, Spinner } from '@/components/ui'

export default function ChatsPage() {
  const { user } = useAuth()
  const { get, post, patch } = useAPI()
  const [chats, setChats] = useState<Chat[]>([])
  const [selected, setSelected] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [agents, setAgents] = useState<any[]>([])
  const [newChat, setNewChat] = useState({ subject: '', category: 'general', priority: 'MEDIUM', message: '' })
  const [creating, setCreating] = useState(false)

  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const isAgent = user?.role === 'AGENT'
  const isUser = user?.role === 'USER'

  const fetchChats = useCallback(async () => {
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : ''
      const data = await get(`/chats${params}`)
      setChats(data.chats || [])
    } catch {} finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { fetchChats() }, [fetchChats])
  useEffect(() => {
    const interval = setInterval(fetchChats, 8000)
    return () => clearInterval(interval)
  }, [fetchChats])

  useEffect(() => {
    if (selected) {
      get(`/chats/${selected.id}`).then(d => {
        setSelected(d.chat)
        setChats(prev => prev.map(c => c.id === d.chat.id ? d.chat : c))
      }).catch(() => {})
    }
  }, [selected?.id])

  const filteredChats = chats.filter(c => {
    if (search && !c.subject.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const createChat = async () => {
    if (!newChat.subject.trim() || !newChat.message.trim()) return
    setCreating(true)
    try {
      const data = await post('/chats', newChat)
      setChats(prev => [data.chat, ...prev])
      setSelected(data.chat)
      setShowNew(false)
      setNewChat({ subject: '', category: 'general', priority: 'MEDIUM', message: '' })
    } catch {} finally { setCreating(false) }
  }

  const handleResolve = async (chatId: string) => {
    try {
      await post(`/chats/${chatId}/resolve`, { resolution: 'Resolved by agent' })
      fetchChats()
      if (selected?.id === chatId) get(`/chats/${chatId}`).then(d => setSelected(d.chat))
    } catch {}
  }

  const handleEscalate = async (chatId: string) => {
    try {
      const data = await post(`/chats/${chatId}/escalate`, {})
      alert(`Ticket created: ${data.ticket.id}`)
      fetchChats()
    } catch (err: any) { alert(err.message) }
  }

  const acceptQueuedChat = async (chat: Chat) => {
    if (!user) return
    try {
      await patch(`/chats/${chat.id}`, { agentId: user.id, status: 'ACTIVE', queuePosition: null })
      await post(`/chats/${chat.id}/messages`, { text: `Hello! I am ${user.name} from IMARAT IT Support. I have reviewed your request and will assist you now.` })
      fetchChats()
    } catch {}
  }

  const assignChat = async (agentId: string) => {
    if (!selected) return
    try {
      await post(`/chats/${selected.id}/assign`, { agentId })
      setShowAssign(false)
      fetchChats()
    } catch {}
  }

  const loadAgents = async () => {
    const data = await get('/users?role=AGENT')
    setAgents(data.users || [])
    setShowAssign(true)
  }

  const statusFilters = isUser
    ? ['all', 'ACTIVE', 'QUEUED', 'RESOLVED']
    : ['all', 'ACTIVE', 'QUEUED', 'RESOLVED', 'CLOSED']

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Chat list */}
      <div style={{ width: 320, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 1 }}><IC name="search" size={14} color="var(--text3)" /></div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..."
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px 8px 34px', color: 'var(--text)', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {statusFilters.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: filterStatus === s ? 'var(--accent)' : 'var(--surface2)', color: filterStatus === s ? '#fff' : 'var(--text2)' }}>
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {isUser && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <Btn variant="primary" size="sm" onClick={() => setShowNew(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <IC name="plus" size={14} color="#fff" /> New Support Chat
            </Btn>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>}
          {!loading && filteredChats.length === 0 && <Empty icon="chat" title="No chats" subtitle={isUser ? 'Start a new support chat' : 'No chats match your filters'} />}
          {filteredChats.map(chat => {
            const other = isUser ? chat.agent : chat.user
            const unread = chat._count?.messages || 0
            const isSelected = selected?.id === chat.id
            return (
              <button key={chat.id} onClick={() => { setSelected(chat); get(`/chats/${chat.id}`).then(d => setSelected(d.chat)) }}
                style={{ width: '100%', padding: '12px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: isSelected ? 'var(--surface2)' : 'transparent', borderLeft: `3px solid ${isSelected ? 'var(--accent)' : 'transparent'}`, transition: 'all .12s' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {other && <Avatar user={other} size={32} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.subject}</span>
                      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{formatTime(chat.updatedAt)}</span>
                    </div>
                    {other && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{other.name}</div>}
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Badge label={chat.status} />
                      <PriorityBadge priority={chat.priority} />
                      {unread > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700, marginLeft: 'auto' }}>{unread}</span>}
                    </div>
                    {isAgent && chat.status === 'QUEUED' && (
                      <Btn size="sm" variant="success" onClick={e => { e.stopPropagation(); acceptQueuedChat(chat) }} style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}>Accept Chat</Btn>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chat window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            {isManager && (
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Manager controls:</span>
                <Btn size="sm" variant="ghost" onClick={loadAgents}><IC name="users" size={13} />Assign Agent</Btn>
                <Btn size="sm" variant="warning" onClick={() => handleEscalate(selected.id)}><IC name="escalate" size={13} />Escalate to Ticket</Btn>
              </div>
            )}
            <ChatWindow chat={selected} onMessageSent={fetchChats}
              showAgentControls={isAgent || isManager}
              onResolve={handleResolve} onEscalate={handleEscalate}
              readOnly={isManager} />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty icon="chat" title="Select a chat" subtitle="Choose a conversation from the list to view messages" />
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNew && (
        <Modal title="Start New Support Chat" onClose={() => setShowNew(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Subject" value={newChat.subject} onChange={e => setNewChat({ ...newChat, subject: e.target.value })} placeholder="Brief description of your issue" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Category" value={newChat.category} onChange={e => setNewChat({ ...newChat, category: e.target.value })}>
                {['general', 'hardware', 'software', 'network', 'email', 'security', 'other'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </Select>
              <Select label="Priority" value={newChat.priority} onChange={e => setNewChat({ ...newChat, priority: e.target.value })}>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <Textarea label="Describe your issue" value={newChat.message} onChange={e => setNewChat({ ...newChat, message: e.target.value })} placeholder="Please provide as much detail as possible..." rows={5} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
              <Btn variant="primary" loading={creating} onClick={createChat} disabled={!newChat.subject.trim() || !newChat.message.trim()}>Start Chat</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign modal */}
      {showAssign && (
        <Modal title="Assign Chat to Agent" onClose={() => setShowAssign(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agents.map((agent: any) => (
              <button key={agent.id} onClick={() => assignChat(agent.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <Avatar user={agent} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{agent.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{agent._count?.chatsAsAgent || 0} active chats — {agent.status}</div>
                </div>
                <Badge label={agent.status} />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
