'use client'
import { useState, useEffect } from 'react'
import { useAPI } from '@/hooks/useAPI'
import { IC, Toggle, Btn, Input, Select, Spinner, Card } from '@/components/ui'

export default function SettingsPage() {
  const { get, patch, post, del } = useAPI()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [quickReplies, setQuickReplies] = useState<any[]>([])
  const [tab, setTab] = useState('company')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newQR, setNewQR] = useState({ title: '', text: '', category: 'general' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([get('/settings'), get('/quickreplies')]).then(([s, q]) => {
      setSettings(s.settings || {})
      setQuickReplies(q.replies || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await patch('/settings', { settings })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {} finally { setSaving(false) }
  }

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }))

  const addQR = async () => {
    if (!newQR.title.trim() || !newQR.text.trim()) return
    const data = await post('/quickreplies', newQR)
    setQuickReplies(prev => [...prev, data.reply])
    setNewQR({ title: '', text: '', category: 'general' })
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><Spinner size={32} /></div>

  const tabs = [
    { id: 'company', label: 'Company', icon: 'shield' },
    { id: 'chat', label: 'Chat & Routing', icon: 'chat' },
    { id: 'sla', label: 'SLA Policy', icon: 'clock' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'quickreplies', label: 'Quick Replies', icon: 'zap' },
    { id: 'ai', label: 'AI Settings', icon: 'bot' },
  ]

  const Field = ({ label, sub, children }: any) => (
    <div style={{ display: 'flex', alignItems: sub ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 20, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )

  const inputStyle = { background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 12px', color: 'var(--text)', fontSize: 13, width: 240 }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  return (
    <div style={{ padding: 28, display: 'flex', gap: 28, maxWidth: 1000 }}>
      {/* Tab nav */}
      <div style={{ width: 200, flexShrink: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 13, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 3, background: tab === t.id ? 'var(--accent-dim)' : 'transparent', color: tab === t.id ? 'var(--accent)' : 'var(--text2)', fontWeight: tab === t.id ? 600 : 400 }}>
            <IC name={t.icon} size={15} color={tab === t.id ? 'var(--accent)' : 'currentColor'} />{t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, paddingLeft: 28, borderLeft: '1px solid var(--border)' }}>
        {tab === 'company' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Company Information</div>
            <Field label="Company Name" sub="Displayed throughout the portal"><input value={settings.company_name || ''} onChange={e => set('company_name', e.target.value)} style={inputStyle} /></Field>
            <Field label="Support Email" sub="Default reply-to for notifications"><input value={settings.support_email || ''} onChange={e => set('support_email', e.target.value)} style={inputStyle} /></Field>
            <Field label="Support Phone" sub="Displayed on portal and emails"><input value={settings.support_phone || ''} onChange={e => set('support_phone', e.target.value)} style={inputStyle} /></Field>
            <Field label="Timezone"><select value={settings.timezone || 'UTC'} onChange={e => set('timezone', e.target.value)} style={selectStyle}>
              {['UTC', 'Asia/Karachi', 'America/New_York', 'Europe/London', 'Asia/Dubai'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select></Field>
            <Field label="Business Hours Start"><input value={settings.business_hours_start || '08:00'} onChange={e => set('business_hours_start', e.target.value)} type="time" style={inputStyle} /></Field>
            <Field label="Business Hours End"><input value={settings.business_hours_end || '18:00'} onChange={e => set('business_hours_end', e.target.value)} type="time" style={inputStyle} /></Field>
          </div>
        )}

        {tab === 'chat' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Chat Configuration</div>
            <Field label="Auto-assign Chats" sub="Automatically route incoming chats to available agents">
              <Toggle checked={settings.chat_auto_assign === 'true'} onChange={v => set('chat_auto_assign', String(v))} />
            </Field>
            <Field label="Routing Strategy" sub="Algorithm for assigning chats to agents">
              <select value={settings.chat_routing_strategy || 'round-robin'} onChange={e => set('chat_routing_strategy', e.target.value)} style={selectStyle}>
                <option value="round-robin">Round Robin</option>
                <option value="least-loaded">Least Loaded</option>
                <option value="skill-based">Skill Based</option>
                <option value="manual">Manual Only</option>
              </select>
            </Field>
            <Field label="Max Queue Size" sub="Maximum chats allowed in queue before rejecting"><input value={settings.chat_max_queue || '50'} onChange={e => set('chat_max_queue', e.target.value)} type="number" style={{ ...inputStyle, width: 120 }} /></Field>
            <Field label="Idle Timeout (seconds)" sub="Auto-close after inactivity period"><input value={settings.chat_idle_timeout || '300'} onChange={e => set('chat_idle_timeout', e.target.value)} type="number" style={{ ...inputStyle, width: 120 }} /></Field>
          </div>
        )}

        {tab === 'sla' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>SLA Policy Configuration</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>Define response and resolution time targets in hours for each priority level.</div>
            {[
              { priority: 'critical', label: 'Critical', color: '#ef4444' },
              { priority: 'high', label: 'High', color: '#ea580c' },
              { priority: 'medium', label: 'Medium', color: '#f59e0b' },
              { priority: 'low', label: 'Low', color: '#10b981' },
            ].map(({ priority, label, color }) => (
              <div key={priority} style={{ padding: '14px 16px', background: 'var(--surface2)', borderRadius: 10, border: `1px solid var(--border)`, marginBottom: 12, borderLeft: `4px solid ${color}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{label} Priority</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>First Response (hours)</label>
                    <input value={settings[`sla_${priority}_response`] || ''} onChange={e => set(`sla_${priority}_response`, e.target.value)} type="number" step="0.5" style={{ ...inputStyle, width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Resolution Time (hours)</label>
                    <input value={settings[`sla_${priority}_resolution`] || ''} onChange={e => set(`sla_${priority}_resolution`, e.target.value)} type="number" step="0.5" style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'notifications' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Notification Settings</div>
            <Field label="Email Notifications" sub="Send email alerts for new chats and ticket updates">
              <Toggle checked={settings.email_notifications === 'true'} onChange={v => set('email_notifications', String(v))} />
            </Field>
            <Field label="Browser Notifications" sub="Show desktop push notifications for agents">
              <Toggle checked={settings.browser_notifications === 'true'} onChange={v => set('browser_notifications', String(v))} />
            </Field>
            <Field label="SLA Warning Alerts" sub="Notify agents when tickets approach SLA breach">
              <Toggle checked={(settings.sla_warnings ?? 'true') === 'true'} onChange={v => set('sla_warnings', String(v))} />
            </Field>
            <Field label="Daily Digest Email" sub="Send daily summary to managers">
              <Toggle checked={(settings.daily_digest ?? 'false') === 'true'} onChange={v => set('daily_digest', String(v))} />
            </Field>
          </div>
        )}

        {tab === 'quickreplies' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Quick Reply Templates</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {quickReplies.map(qr => (
                <div key={qr.id} style={{ padding: '12px 14px', background: 'var(--surface2)', borderRadius: 9, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{qr.title}</span>
                    <span style={{ fontSize: 10, background: 'var(--surface3)', color: 'var(--text3)', padding: '2px 7px', borderRadius: 5 }}>{qr.category}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>{qr.text}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, background: 'var(--surface2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>Add New Template</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input value={newQR.title} onChange={e => setNewQR({ ...newQR, title: e.target.value })} placeholder="Template title" style={{ ...inputStyle, width: '100%' }} />
                <textarea value={newQR.text} onChange={e => setNewQR({ ...newQR, text: e.target.value })} placeholder="Template text..." rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <Btn size="sm" variant="primary" onClick={addQR} disabled={!newQR.title || !newQR.text}><IC name="plus" size={13} color="#fff" />Add Template</Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'ai' && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>AI Assistant Settings</div>
            <Field label="AI Suggested Replies" sub="Show AI-powered reply suggestions to agents">
              <Toggle checked={settings.ai_suggestions === 'true'} onChange={v => set('ai_suggestions', String(v))} />
            </Field>
            <Field label="Auto Issue Detection" sub="AI detects and categorizes issues automatically">
              <Toggle checked={(settings.ai_issue_detection ?? 'true') === 'true'} onChange={v => set('ai_issue_detection', String(v))} />
            </Field>
            <Field label="Chat Summarization" sub="AI generates summaries for resolved chats">
              <Toggle checked={(settings.ai_summarization ?? 'true') === 'true'} onChange={v => set('ai_summarization', String(v))} />
            </Field>
            <Field label="AI Model">
              <select value={settings.ai_model || 'claude-sonnet-4-20250514'} onChange={e => set('ai_model', e.target.value)} style={selectStyle}>
                <option value="claude-sonnet-4-20250514">Claude Sonnet 4 (Recommended)</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Faster)</option>
              </select>
            </Field>
          </div>
        )}

        {/* Save button */}
        <div style={{ marginTop: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Btn variant="primary" loading={saving} onClick={saveSettings}>
            {!saving && <IC name="check" size={14} color="#fff" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </Btn>
          {saved && <span style={{ fontSize: 13, color: '#34d399', display: 'flex', alignItems: 'center', gap: 5 }}><IC name="check" size={14} color="#34d399" />Saved successfully</span>}
        </div>
      </div>
    </div>
  )
}
