'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAPI } from '@/hooks/useAPI'
import { Avatar, Badge, PriorityBadge, Btn, Spinner, formatTime, formatDateTime } from '@/components/ui'
import { Chat, Message, User, QuickReply, InternalNote } from '@/types'

// Icons
const Icon = ({ name, size = 16, color = 'currentColor' }: { name: string; size?: number; color?: string }) => {
  const paths: Record<string, string> = {
    send: 'M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z',
    attach: 'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
    note: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    robot: 'M12 8V4H8 M3 11h18v10H3z M12 8h.01 M8 15h.01 M16 15h.01',
    resolve: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3',
    escalate: 'M16 17l5-5-5-5 M3 12h18',
    check: 'M20 6L9 17l-5-5',
    checkDouble: 'M18 6L7 17l-5-5 M22 6L11 17',
    close: 'M18 6L6 18 M6 6l12 12',
    queue: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
    warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    thumbup: 'M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3',
    clock: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z M12 6v6l4 2',
    tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
    refresh: 'M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15',
    plus: 'M12 5v14 M5 12h14',
    pencil: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    trash: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
    copy: 'M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z',
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {paths[name]?.split(' M').map((segment, i) => (
        <path key={i} d={(i === 0 ? '' : 'M') + segment} />
      ))}
    </svg>
  )
}

// Message bubble
export function MessageBubble({ msg, currentUserId }: { msg: Message; currentUserId: string }) {
  const isMe = msg.senderId === currentUserId
  const isSystem = msg.type === 'SYSTEM'

  if (isSystem) {
    return (
      <div style={{ textAlign: 'center', margin: '10px 0' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--surface2)', padding: '4px 12px', borderRadius: 99, border: '1px solid var(--border)' }}>{msg.text}</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row', marginBottom: 14, animation: 'msgIn 0.15s ease' }}>
      {!isMe && <Avatar user={msg.sender} size={28} />}
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
        {!isMe && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3, paddingLeft: 2 }}>{msg.sender?.name}</div>}
        <div style={{
          background: isMe ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'var(--surface2)',
          color: isMe ? '#fff' : 'var(--text)',
          padding: '10px 14px',
          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontSize: 14, lineHeight: 1.6, border: isMe ? 'none' : '1px solid var(--border)',
          boxShadow: isMe ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
        }}>
          {msg.text}
          {msg.fileName && (
            <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="file" size={14} />
              <span>{msg.fileName}</span>
              {msg.fileSize && <span style={{ opacity: 0.7 }}>({Math.round(msg.fileSize / 1024)}KB)</span>}
            </div>
          )}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4, padding: isMe ? '0 2px' : '0 2px' }}>
          {formatTime(msg.createdAt)}
          {isMe && <Icon name={msg.isRead ? 'checkDouble' : 'check'} size={11} color={msg.isRead ? '#60a5fa' : 'var(--text3)'} />}
        </div>
      </div>
    </div>
  )
}

// Typing indicator
export function TypingIndicator({ name }: { name: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 14 }}>
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text3)', animation: `typingDot 1.2s ${i * 0.2}s ease-in-out infinite` }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{name} is typing</span>
    </div>
  )
}

// Chat input area
export function ChatInput({
  chatId, onSend, disabled = false, showQuickReplies = false, quickReplies = [],
  onAIRequest, loadingAI = false
}: {
  chatId: string; onSend: (text: string, file?: { name: string; size: number }) => Promise<void>
  disabled?: boolean; showQuickReplies?: boolean; quickReplies?: QuickReply[]
  onAIRequest?: () => void; loadingAI?: boolean
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await onSend(text.trim())
      setText('')
      textRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await onSend(`Attached file: ${file.name}`, { name: file.name, size: file.size })
    e.target.value = ''
  }

  const useQuickReply = (qr: QuickReply) => {
    setText(qr.text)
    setShowQR(false)
    textRef.current?.focus()
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      {/* Quick replies panel */}
      {showQR && quickReplies.length > 0 && (
        <div style={{ borderBottom: '1px solid var(--border)', maxHeight: 220, overflowY: 'auto' }}>
          <div style={{ padding: '8px 12px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quick Replies</div>
          {quickReplies.map(qr => (
            <Btn key={qr.id} onClick={() => useQuickReply(qr)}
              style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text2)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{qr.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{qr.text}</div>
            </Btn>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} accept="image/*,.pdf,.doc,.docx,.txt,.log" />

        {showQuickReplies && (
          <Btn onClick={() => setShowQR(v => !v)} title="Quick Replies"
            style={{ padding: 8, background: showQR ? 'var(--accent-light)' : 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: showQR ? '#3b82f6' : 'var(--text3)', cursor: 'pointer', flexShrink: 0 }}>
            <Icon name="queue" size={16} />
          </Btn>
        )}

        <Btn onClick={() => fileRef.current?.click()} title="Attach file"
          style={{ padding: 8, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="attach" size={16} />
        </Btn>

        {onAIRequest && (
          <Btn onClick={onAIRequest} disabled={loadingAI} title="AI suggested reply"
            style={{ padding: 8, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: '#8b5cf6', cursor: 'pointer', flexShrink: 0, opacity: loadingAI ? 0.6 : 1 }}>
            {loadingAI ? <Spinner size={16} /> : <Icon name="robot" size={16} color="#8b5cf6" />}
          </Btn>
        )}

        <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder={disabled ? 'This chat is resolved' : 'Type your message… (Enter to send, Shift+Enter for new line)'}
          disabled={disabled}
          rows={1}
          style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, minHeight: 42, maxHeight: 140, opacity: disabled ? 0.5 : 1 }}
          onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }} />

        <Btn onClick={handleSend} disabled={!text.trim() || sending || disabled}
          style={{ width: 40, height: 40, borderRadius: 10, background: text.trim() && !disabled ? '#3b82f6' : 'var(--surface2)', border: '1px solid var(--border)', color: text.trim() && !disabled ? '#fff' : 'var(--text3)', cursor: text.trim() && !disabled ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
          {sending ? <Spinner size={14} /> : <Icon name="send" size={15} />}
        </Btn>
      </div>
    </div>
  )
}

// AI Suggestion panel
export function AISuggestionPanel({ suggestion, onUse, onDismiss }: { suggestion: string; onUse: (text: string) => void; onDismiss: () => void }) {
  return (
    <div style={{ margin: '0 16px 8px', padding: 14, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, animation: 'fadeIn 0.2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <Icon name="robot" size={13} color="#8b5cf6" />
        AI Suggested Reply
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>{suggestion}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={() => onUse(suggestion)} size="sm" variant="primary">Use this reply</Btn>
        <Btn onClick={onDismiss} size="sm" variant="ghost">Dismiss</Btn>
      </div>
    </div>
  )
}

// Internal notes panel
export function InternalNotesPanel({ notes, onAdd, agentId }: { notes: InternalNote[]; onAdd: (text: string) => Promise<void>; agentId: string }) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!text.trim()) return
    setSaving(true)
    try { await onAdd(text); setText('') } finally { setSaving(false) }
  }

  return (
    <div style={{ width: 280, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)', flexShrink: 0 }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="note" size={14} color="#f59e0b" />
        Internal Notes
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {notes.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', paddingTop: 20 }}>No internal notes yet</div>}
        {notes.map(note => (
          <div key={note.id} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <Avatar user={note.agent} size={20} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>{note.agent?.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{formatTime(note.createdAt)}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{note.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Add internal note (not visible to user)…"
          rows={3} style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'none' }} />
        <Btn onClick={handleAdd} disabled={!text.trim() || saving} size="sm" variant="ghost" style={{ width: '100%', marginTop: 8 }}>
          {saving ? <Spinner size={12} /> : 'Add Note'}
        </Btn>
      </div>
    </div>
  )
}

// Chat header
export function ChatHeader({
  chat, showAgentControls, showManagerControls, onResolve, onEscalate, onAssign, onToggleNotes, notesOpen
}: {
  chat: Chat; showAgentControls?: boolean; showManagerControls?: boolean
  onResolve?: () => void; onEscalate?: () => void; onAssign?: () => void
  onToggleNotes?: () => void; notesOpen?: boolean
}) {
  return (
    <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.subject}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Badge label={chat.status} />
          <PriorityBadge priority={chat.priority} />
          {chat.category && <span style={{ fontSize: 11, padding: '2px 7px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text3)' }}>{chat.category}</span>}
          {chat.agent && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)' }}>
              <Avatar user={chat.agent} size={16} />
              {chat.agent.name}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {showAgentControls && (
          <>
            <Btn onClick={onToggleNotes} title="Internal Notes"
              style={{ padding: '6px 10px', background: notesOpen ? 'rgba(245,158,11,0.15)' : 'var(--surface2)', border: `1px solid ${notesOpen ? '#f59e0b' : 'var(--border)'}`, borderRadius: 7, color: notesOpen ? '#f59e0b' : 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <Icon name="note" size={14} />
              Notes
            </Btn>
            <Btn onClick={onEscalate} title="Create ticket"
              style={{ padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <Icon name="escalate" size={14} />
              Ticket
            </Btn>
            {chat.status === 'ACTIVE' && (
              <Btn onClick={onResolve}
                style={{ padding: '6px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: 7, color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
                <Icon name="resolve" size={14} color="#10b981" />
                Resolve
              </Btn>
            )}
          </>
        )}
        {showManagerControls && (
          <Btn onClick={onAssign}
            style={{ padding: '6px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <Icon name="pencil" size={14} />
            Reassign
          </Btn>
        )}
        {!showAgentControls && !showManagerControls && chat.status === 'ACTIVE' && (
          <Btn onClick={onEscalate}
            style={{ padding: '6px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: '#f59e0b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <Icon name="escalate" size={14} />
            Create Ticket
          </Btn>
        )}
      </div>
    </div>
  )
}

// Queue waiting display
export function QueueBanner({ position }: { position: number }) {
  return (
    <div style={{ margin: '20px', padding: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, textAlign: 'center' }}>
      <div style={{ marginBottom: 8 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>You are in the support queue</div>
      <div style={{ fontSize: 13, color: 'var(--text3)' }}>Position {position} — An available agent will join shortly</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Average wait time: 3–5 minutes</div>
    </div>
  )
}

// Resolved banner
export function ResolvedBanner({ resolution, resolvedAt }: { resolution?: string; resolvedAt?: string }) {
  return (
    <div style={{ margin: '20px', padding: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: resolution ? 8 : 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#10b981' }}>Chat Resolved</div>
          {resolvedAt && <div style={{ fontSize: 12, color: 'var(--text3)' }}>Resolved {formatTime(resolvedAt)}</div>}
        </div>
      </div>
      {resolution && <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{resolution}</div>}
    </div>
  )
}


