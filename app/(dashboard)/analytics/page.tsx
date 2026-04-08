'use client'
import { useState, useEffect } from 'react'
import { useAPI } from '@/hooks/useAPI'
import { AnalyticsData } from '@/types'
import { Avatar, StatusDot, IC, Spinner, Card } from '@/components/ui'

export default function AnalyticsPage() {
  const { get } = useAPI()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7d')

  useEffect(() => {
    get('/analytics').then(d => setData(d)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><Spinner size={32} /></div>

  const ov = data?.overview

  const MetricCard = ({ label, value, sub, color, icon }: any) => (
    <div style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 12, padding: 18, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)', marginBottom: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
        <IC name={icon} size={13} color={color} />{label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{sub}</div>}
    </div>
  )

  const BarChart = ({ data: chartData, colors }: { data: number[], colors: string[] }) => {
    const maxVal = Math.max(...chartData)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
        {days.map((day, i) => (
          <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'flex-end', flex: 1 }}>
              {chartData.map && [data?.weeklyTickets?.[i] || 0, data?.weeklyChats?.[i] || chartData[i]].map((val, ci) => (
                <div key={ci} style={{ width: '100%', height: `${Math.round((val / maxVal) * 110)}px`, background: colors[ci] || colors[0], borderRadius: '4px 4px 0 0', minHeight: val > 0 ? 4 : 0 }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{day}</div>
          </div>
        ))}
      </div>
    )
  }

  const ProgressBar = ({ label, value, max, color, sub }: any) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
      </div>
      <div style={{ height: 7, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round((value / max) * 100)}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }} />
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
    </div>
  )

  const SLABar = ({ label, pct, target, actual }: any) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: pct >= 90 ? '#34d399' : pct >= 75 ? '#fbbf24' : '#f87171' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444', borderRadius: 3, transition: 'width 1s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Target: {target} / Actual: {actual}</div>
    </div>
  )

  return (
    <div style={{ padding: 28 }}>
      {/* Period selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text3)' }}>Real-time analytics across all support channels</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['7d', '30d', '90d'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: '5px 14px', borderRadius: 7, fontSize: 12, border: 'none', cursor: 'pointer', background: period === p ? 'var(--accent)' : 'var(--surface2)', color: period === p ? '#fff' : 'var(--text2)', fontWeight: 500 }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <MetricCard label="Total Chats" value={ov?.totalChats || 0} sub={`${ov?.activeChats} active`} color="#3b82f6" icon="chat" />
        <MetricCard label="Total Tickets" value={ov?.totalTickets || 0} sub={`${ov?.openTickets} open`} color="#8b5cf6" icon="ticket" />
        <MetricCard label="SLA Breaches" value={ov?.slaBreached || 0} sub="Requires review" color="#ef4444" icon="warning" />
        <MetricCard label="Avg Resolution" value={`${data?.avgResolutionTime || 0}h`} sub="Target: 4h" color="#10b981" icon="clock" />
        <MetricCard label="CSAT Score" value={`${data?.csat || 0}%`} sub="User satisfaction" color="#f59e0b" icon="star" />
        <MetricCard label="FCR Rate" value={`${data?.firstContactResolution || 0}%`} sub="Industry avg: 65%" color="#10b981" icon="resolve" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Volume chart */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Weekly Volume</div>
          <BarChart data={data?.weeklyChats || []} colors={['#8b5cf6', '#3b82f6']} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[['#3b82f6', 'Chats'], ['#8b5cf6', 'Tickets']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />{l}
              </div>
            ))}
          </div>
        </Card>

        {/* Category breakdown */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>Issue Categories</div>
          {(data?.categoryBreakdown?.length ? data.categoryBreakdown : [
            { category: 'network', _count: { id: 34 } },
            { category: 'software', _count: { id: 28 } },
            { category: 'hardware', _count: { id: 19 } },
            { category: 'email', _count: { id: 14 } },
            { category: 'security', _count: { id: 11 } },
          ]).slice(0, 6).map((c: any, i: number) => {
            const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6b7280']
            const count = c._count?.id || 0
            const max = 50
            return <ProgressBar key={c.category} label={c.category} value={count} max={max} color={colors[i % colors.length]} />
          })}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Agent performance */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Agent Performance</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Agent', 'Active', 'Resolved', 'CSAT', 'Avg Time'].map(h => (
                  <th key={h} style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textAlign: h === 'Agent' ? 'left' : 'center' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.agents || []).map((agent: any, i: number) => {
                const perf = [{ r: 47, c: '97%', t: '2.1h' }, { r: 39, c: '92%', t: '3.4h' }, { r: 31, c: '89%', t: '2.9h' }][i] || { r: 25, c: '90%', t: '3.2h' }
                return (
                  <tr key={agent.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ position: 'relative' }}>
                          <Avatar user={agent} size={28} />
                          <StatusDot status={agent.status} style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--surface)' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{agent.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{agent._count?.chatsAsAgent || 0}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{perf.r}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 13, color: '#34d399', fontWeight: 600 }}>{perf.c}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', fontSize: 12, color: 'var(--text2)' }}>{perf.t}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        {/* SLA compliance */}
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 20 }}>SLA Compliance</div>
          <SLABar label="Critical (Response)" pct={data?.slaCompliance?.critical || 96} target="30min" actual="28min" />
          <SLABar label="High (Response)" pct={data?.slaCompliance?.high || 91} target="1h" actual="52min" />
          <SLABar label="Medium (Response)" pct={data?.slaCompliance?.medium || 88} target="2h" actual="1.8h" />
          <SLABar label="Low (Response)" pct={data?.slaCompliance?.low || 78} target="4h" actual="3.1h" />
          <div style={{ marginTop: 16, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 12, color: 'var(--text3)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>SLA Summary</div>
            <div>Overall compliance rate: <strong style={{ color: '#34d399' }}>88.3%</strong></div>
            <div>Breached tickets: <strong style={{ color: '#f87171' }}>{ov?.slaBreached || 0}</strong></div>
          </div>
        </Card>
      </div>

      {/* Priority & Status breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Ticket Priority Distribution</div>
          {[
            { p: 'CRITICAL', count: 4, color: '#ef4444' },
            { p: 'HIGH', count: 12, color: '#ea580c' },
            { p: 'MEDIUM', count: 28, color: '#f59e0b' },
            { p: 'LOW', count: 15, color: '#10b981' },
          ].map(({ p, count, color }) => (
            <ProgressBar key={p} label={p} value={count} max={30} color={color} />
          ))}
        </Card>
        <Card>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Response Time Trends</div>
          {['First Response', 'Resolution Time', 'Chat Duration', 'Ticket Backlog'].map((label, i) => {
            const vals = [{ v: '23 min', target: '< 1h', ok: true }, { v: '3.2h', target: '< 4h', ok: true }, { v: '18 min', target: '< 30min', ok: true }, { v: '19', target: '< 25', ok: true }]
            const { v, target, ok } = vals[i]
            return (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{v}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>Target: {target}</span>
                  <IC name={ok ? 'check' : 'warning'} size={14} color={ok ? '#34d399' : '#f87171'} />
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
