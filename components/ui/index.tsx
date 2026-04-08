'use client'
import React, { useState, useRef, useEffect, ReactNode } from 'react'
import { User, Priority, ChatStatus, TicketStatus, UserStatus } from '@/types'

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
  A: '#3b82f6', B: '#10b981', C: '#f59e0b', D: '#8b5cf6', E: '#ef4444',
  F: '#ec4899', G: '#06b6d4', H: '#84cc16', I: '#f97316', J: '#6366f1',
  K: '#14b8a6', L: '#a855f7', M: '#eab308', N: '#22c55e', O: '#0ea5e9',
  P: '#f43f5e', Q: '#8b5cf6', R: '#3b82f6', S: '#10b981', T: '#f59e0b',
}

export function Avatar({ user, size = 32 }: { user?: Partial<User> | null; size?: number }) {
  if (!user) return null
  const initials = user.avatar || (user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U')
  const color = AVATAR_COLORS[initials[0]?.toUpperCase()] || '#3b82f6'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.35, fontWeight: 600, flexShrink: 0, userSelect: 'none', letterSpacing: '0.02em' }}>
      {initials}
    </div>
  )
}

// ─── StatusDot ────────────────────────────────────────────────────────────────
export function StatusDot({ status, style = {} }: { status: UserStatus | string; style?: React.CSSProperties }) {
  const colors: Record<string, string> = { ONLINE: '#10b981', BUSY: '#ef4444', AWAY: '#f59e0b', OFFLINE: '#475569' }
  return <span style={{ width: 9, height: 9, borderRadius: '50%', background: colors[status] || '#475569', display: 'inline-block', flexShrink: 0, ...style }} />
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  QUEUED: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  RESOLVED: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  CLOSED: { bg: 'rgba(100,116,139,0.15)', color: '#64748b' },
  OPEN: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  IN_PROGRESS: { bg: 'rgba(139,92,246,0.15)', color: '#a78bfa' },
  PENDING: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  ONLINE: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
  BUSY: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
  AWAY: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  OFFLINE: { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' },
  USER: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  AGENT: { bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
  MANAGER: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
  ADMIN: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
}

export function Badge({ label, className }: { label: string; className?: string }) {
  const s = BADGE_STYLES[label] || { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', background: s.bg, color: s.color, letterSpacing: '0.02em' }}>
      {label.replace('_', ' ')}
    </span>
  )
}

// ─── PriorityBadge ────────────────────────────────────────────────────────────
const PRIORITY_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  CRITICAL: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', dot: '#ef4444' },
  HIGH: { bg: 'rgba(234,88,12,0.12)', color: '#fb923c', dot: '#ea580c' },
  MEDIUM: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', dot: '#f59e0b' },
  LOW: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', dot: '#10b981' },
}

export function PriorityBadge({ priority }: { priority: Priority | string }) {
  const s = PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {priority}
    </span>
  )
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success' | 'warning'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Btn({ variant = 'ghost', size = 'md', loading, children, style, disabled, ...props }: BtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 8, fontWeight: 500, fontFamily: 'inherit', cursor: disabled || loading ? 'not-allowed' : 'pointer', transition: 'all .15s', border: '1px solid transparent', flexShrink: 0, opacity: disabled || loading ? 0.65 : 1,
  }
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '5px 12px', fontSize: 12 },
    md: { padding: '8px 16px', fontSize: 13 },
    lg: { padding: '10px 20px', fontSize: 14 },
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' },
    ghost: { background: 'transparent', color: 'var(--text2)', borderColor: 'var(--border)' },
    danger: { background: 'rgba(239,68,68,0.12)', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' },
    success: { background: 'rgba(16,185,129,0.12)', color: '#34d399', borderColor: 'rgba(16,185,129,0.25)' },
    warning: { background: 'rgba(245,158,11,0.12)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.25)' },
  }
  return (
    <button disabled={disabled || loading} style={{ ...base, ...sizes[size], ...variants[variant], ...style }} {...props}>
      {loading ? <div style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : children}
    </button>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; icon?: ReactNode
}

export function Input({ label, error, icon, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ width: '100%' }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <div style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }}>{icon}</div>}
        <input
          style={{ width: '100%', background: 'var(--surface2)', border: `1px solid ${focused ? 'var(--accent)' : error ? '#ef4444' : 'var(--border)'}`, borderRadius: 8, padding: `9px ${icon ? '14px 9px 36px' : '14px'}`, color: 'var(--text)', fontSize: 14, transition: 'border-color .15s', boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none', ...style }}
          onFocus={e => { setFocused(true); props.onFocus?.(e) }}
          onBlur={e => { setFocused(false); props.onBlur?.(e) }}
          {...props} />
      </div>
      {error && <div style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{error}</div>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, children, style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div style={{ width: '100%' }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>}
      <select style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 14, cursor: 'pointer', ...style }} {...props}>
        {children}
      </select>
    </div>
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ width: '100%' }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>{label}</label>}
      <textarea
        style={{ width: '100%', background: 'var(--surface2)', border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, padding: '9px 14px', color: 'var(--text)', fontSize: 14, resize: 'vertical', transition: 'border-color .15s', boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none', fontFamily: 'inherit', lineHeight: 1.6, ...style }}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        {...props} />
    </div>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, className }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, ...style }}>{children}</div>
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, children, onClose, width = 540 }: { title: string; children: ReactNode; onClose: () => void; width?: number }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' }}>
      <div className="slide-up" style={{ width, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{title}</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text2)', background: 'var(--surface2)', cursor: 'pointer' }}>
            <IC name="x" size={14} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }: { size?: number }) {
  return <div style={{ width: size, height: size, border: `2px solid var(--border)`, borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function Empty({ icon, title, subtitle, action }: { icon: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 12, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IC name={icon} size={24} color="var(--text3)" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text2)' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 300 }}>{subtitle}</div>}
      {action}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!checked)} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? 'var(--accent)' : 'var(--border2)', position: 'relative', transition: 'background .2s', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
      {label && <span style={{ fontSize: 14, color: 'var(--text)' }}>{label}</span>}
    </label>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
export function Tip({ children, text }: { children: ReactNode; text: string }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#f1f5f9', padding: '5px 10px', borderRadius: 6, fontSize: 12, whiteSpace: 'nowrap', zIndex: 200, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          {text}
        </div>
      )}
    </div>
  )
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
export function Tag({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11, color: 'var(--text2)' }}>
      {label}
      {onRemove && <button onClick={onRemove} style={{ color: 'var(--text3)', padding: 0, lineHeight: 1 }}>×</button>}
    </span>
  )
}

// ─── IC (Icon Component) ──────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  ticket: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4M8 3v4M2 11h20"/></>,
  kb: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></>,
  send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  attach: <><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  'check-double': <><path d="M18 6L7 17l-5-5"/><path d="M22 6L11 17"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  'arrow-right': <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  'chevron-down': <><polyline points="6 9 12 15 18 9"/></>,
  'chevron-right': <><polyline points="9 18 15 12 9 6"/></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
  note: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  escalate: <><polyline points="16 17 21 12 16 7"/><line x1="3" y1="12" x2="21" y2="12"/></>,
  resolve: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  bot: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><line x1="12" y1="2" x2="12" y2="6"/><circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/></>,
  filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  refresh: <><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  warning: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  thumbsup: <><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></>,
  list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  paperclip: <><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  'bar-chart': <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  'pie-chart': <><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  'help-circle': <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  'trending-up': <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
}

export function IC({ name, size = 16, color = 'currentColor' }: { name: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {ICONS[name] || null}
    </svg>
  )
}

// ─── formatTime ───────────────────────────────────────────────────────────────
export function formatTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
