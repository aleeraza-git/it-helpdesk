'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Chat, Message, User, QuickReply } from '@/types'
import { Avatar, IC, Btn, Tip, Badge, PriorityBadge, formatTime, formatDateTime, Spinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { useAPI } from '@/hooks/useAPI'

interface ChatWindowProps {
  chat: Chat
  onMessageSent?: () => void
  showAgentControls?: boolean
  onResolve?: (chatId: string) => void
  onEscalate?: (chatId: string) => void
  readOnly?: boolean
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface2)' }} />
      <div style={{ background: 'var(--surface2)', padding: '10px 16px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)', animation: 'pulse 1.2s ease infinite', animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

function MsgBubble({ msg, isMe }: { msg: Message & { sender?: any }; isMe: boolean }) {
  const isSystem = msg.type === 'SYSTEM'
  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', padding: '6px 16px', margin: '8px 0' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--surface2)', padding: '4px 12px', borderRadius: 99, border: '1px solid var(--border)' }}>{msg.text}</span>
      </div>
    )
  }
  return (
    <div className="msg-in" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row', marginBottom: 14, paddingLeft: isMe ? 48 : 0, paddingRight: isMe ? 0 : 48 }}>
      {!isMe && <Avatar user={msg.sender} size={28} />}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
        {!isMe && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, paddingLeft: 4 }}>{msg.sender?.name}</div>}
        <div style={{
          background: isMe ? 'linear-gradient(135deg,#3b82f6,#2563eb)' : 'var(--surface2)',
          color: isMe ? '#fff' : 'var(--text)',
          padding: '10px 14px', lineHeight: 1.55, fontSize: 14,
          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          boxShadow: isMe ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
          border: isMe ? 'none' : '1px solid var(--border)',
          wordBreak: 'break-word',
        }}>
          {msg.fileName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IC name="paperclip" size={14} />
              <span>{msg.fileName}</span>
              {msg.fileSize && <span style={{ opacity: 0.7, fontSize: 12 }}>({Math.round(msg.fileSize / 1024)}KB)</span>}
            </div>
          ) : msg.text}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
          {formatTime(msg.createdAt)}
          {isMe && <IC name={msg.isRead ? 'check-double' : 'check'} size={12} color={msg.isRead ? 'var(--accent)' : 'var(--text3)'} />}
        </div>
      </div>
    </div>
  )
}

export default function ChatWindow({ chat, onMessageSent, showAgentControls, onResolve, onEscalate, readOnly }: ChatWindowProps) {
  const { user } = useAuth()
  const { post, patch, get } = useAPI()
  const [messages, setMessages] = useState<Message[]>(chat.messages || [])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [notes, setNotes] = useState(chat.internalNotes || [])
  const [noteText, setNoteText] = useState('')
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([])
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Poll for new messages
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const data = await get(`/chats/${chat.id}`)
        setMessages(data.chat.messages || [])
        setNotes(data.chat.internalNotes || [])
      } catch {}
    }, 5000)
    return () => clearInterval(poll)
  }, [chat.id])

  useEffect(() => {
    if (showAgentControls) {
      get('/quickreplies').then(d => setQuickReplies(d.replies || [])).catch(() => {})
    }
  }, [showAgentControls])

  const sendMessage = async () => {
    if (!text.trim() || sending || readOnly) return
    setSending(true)
    try {
      const data = await post(`/chats/${chat.id}/messages`, { text: text.trim() })
      setMessages(prev => [...prev, data.message])
      setText('')
      onMessageSent?.()
      // Mark messages as read
      await patch(`/chats/${chat.id}/messages`, {})
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const sendFile = async (file: File) => {
    try {
      // In production, upload to storage first. Here we simulate with filename
      await post(`/chats/${chat.id}/messages`, { text: `Attached file: ${file.name}`, type: 'FILE', fileName: file.name, fileSize: file.size })
      onMessageSent?.()
    } catch {}
  }

  const addNote = async () => {
    if (!noteText.trim()) return
    try {
      const data = await post(`/chats/${chat.id}/notes`, { text: noteText })
      setNotes(prev => [...prev, data.note])
      setNoteText('')
    } catch {}
  }

  const getAISuggestion = async () => {
    setLoadingAI(true)
    try {
      const lastMsg = messages[messages.length - 1]?.text || ''
      const data = await post('/ai', { action: 'suggest_reply', context: { subject: chat.subject, category: chat.category, lastMessage: lastMsg } })
      setAiSuggestion(data.response)
    } catch {} finally { setLoadingAI(false) }
  }

  const canSend = !readOnly && (chat.status === 'ACTIVE' || chat.status === 'QUEUED')
  const agent = chat.agent
  const chatUser = chat.user

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.subject}</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <Badge label={chat.status} />
              <PriorityBadge priority={chat.priority} />
              <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>{chat.category}</span>
              {showAgentControls && chatUser && (
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>User: {chatUser.name} — {chatUser.department}</span>
              )}
            </div>
          </div>
          {showAgentControls && !readOnly && (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Tip text="AI Suggestion"><Btn size="sm" variant="ghost" onClick={getAISuggestion} loading={loadingAI}><IC name="bot" size={14} /></Btn></Tip>
              <Tip text="Internal Notes"><Btn size="sm" variant={showNotes ? 'primary' : 'ghost'} onClick={() => setShowNotes(!showNotes)}><IC name="note" size={14} /></Btn></Tip>
              <Tip text="Quick Replies"><Btn size="sm" variant={showQuickReplies ? 'primary' : 'ghost'} onClick={() => setShowQuickReplies(!showQuickReplies)}><IC name="zap" size={14} /></Btn></Tip>
              {chat.status === 'ACTIVE' && <Tip text="Escalate to Ticket"><Btn size="sm" variant="warning" onClick={() => onEscalate?.(chat.id)}><IC name="escalate" size={14} />Escalate</Btn></Tip>}
              {chat.status === 'ACTIVE' && <Btn size="sm" variant="success" onClick={() => onResolve?.(chat.id)}><IC name="resolve" size={14} />Resolve</Btn>}
            </div>
          )}
          {!showAgentControls && !readOnly && chat.status === 'ACTIVE' && (
            <Tip text="Escalate to Ticket">
              <Btn size="sm" variant="warning" onClick={() => onEscalate?.(chat.id)}><IC name="escalate" size={14} />Create Ticket</Btn>
            </Tip>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)', fontSize: 13 }}>No messages yet. Start the conversation.</div>
          )}
          {messages.map(msg => (
            <MsgBubble key={msg.id} msg={msg as any} isMe={msg.senderId === user?.id} />
          ))}
          {chat.status === 'QUEUED' && (
            <div style={{ textAlign: 'center', padding: 20, background: 'rgba(245,158,11,0.08)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)', margin: '16px 0' }}>
              <IC name="clock" size={20} color="#fbbf24" />
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fbbf24', marginTop: 8 }}>In Queue</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>An agent will be with you shortly. Position: {chat.queuePosition || 1}</div>
            </div>
          )}
          {chat.status === 'RESOLVED' && (
            <div style={{ textAlign: 'center', padding: 20, background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)', margin: '16px 0' }}>
              <IC name="resolve" size={20} color="#34d399" />
              <div style={{ fontSize: 14, fontWeight: 500, color: '#34d399', marginTop: 8 }}>Resolved</div>
              {chat.resolution && <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{chat.resolution}</div>}
            </div>
          )}
          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div style={{ margin: '0 16px 8px', padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>
              <IC name="bot" size={14} color="var(--accent)" /> AI Suggested Reply
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{aiSuggestion}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Btn size="sm" variant="primary" onClick={() => { setText(aiSuggestion); setAiSuggestion(''); textRef.current?.focus() }}>Use This</Btn>
              <Btn size="sm" variant="ghost" onClick={() => setAiSuggestion('')}>Dismiss</Btn>
            </div>
          </div>
        )}

        {/* Quick replies panel */}
        {showAgentControls && showQuickReplies && (
          <div style={{ borderTop: '1px solid var(--border)', maxHeight: 220, overflowY: 'auto', background: 'var(--surface2)', flexShrink: 0 }}>
            <div style={{ padding: '8px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', borderBottom: '1px solid var(--border)' }}>QUICK REPLIES</div>
            {quickReplies.map(qr => (
              <button key={qr.id} onClick={() => { setText(qr.text); setShowQuickReplies(false); textRef.current?.focus() }}
                style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'transparent', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{qr.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qr.text}</div>
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        {canSend && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <input ref={fileRef as any} type="file" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && sendFile(e.target.files[0])} />
              <Tip text="Attach file">
                <Btn size="sm" variant="ghost" onClick={() => fileRef.current?.click()} style={{ padding: 9, flexShrink: 0 }}><IC name="paperclip" size={16} /></Btn>
              </Tip>
              <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                rows={1} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, resize: 'none', lineHeight: 1.5, minHeight: 42, maxHeight: 140, fontFamily: 'inherit', transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              <Btn size="sm" variant="primary" onClick={sendMessage} loading={sending} disabled={!text.trim()} style={{ padding: 10, flexShrink: 0 }}>
                {!sending && <IC name="send" size={16} color="#fff" />}
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* Internal notes panel */}
      {showAgentControls && showNotes && (
        <div style={{ width: 300, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <IC name="note" size={14} color="#fbbf24" />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Internal Notes</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>Agents only</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {notes.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>No notes yet</div>}
            {notes.map((note: any) => (
              <div key={note.id} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>{note.agent?.name} — {formatTime(note.createdAt)}</div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{note.text}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add internal note..." rows={3}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text)', fontSize: 13, resize: 'none', fontFamily: 'inherit', marginBottom: 8 }} />
            <Btn size="sm" variant="warning" onClick={addNote} disabled={!noteText.trim()} style={{ width: '100%', justifyContent: 'center' }}>Add Note</Btn>
          </div>
        </div>
      )}

      {/* User info panel (agent view) */}
      {showAgentControls && !showNotes && chatUser && (
        <div style={{ width: 260, borderLeft: '1px solid var(--border)', background: 'var(--surface)', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginBottom: 12 }}>USER DETAILS</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, padding: 12, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <Avatar user={chatUser} size={40} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{chatUser.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{chatUser.department}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{chatUser.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['Chat started', formatTime(chat.createdAt)],
              ['Category', chat.category],
              ['Priority', chat.priority],
              ['Tags', chat.tags?.join(', ') || 'None'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text3)' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
