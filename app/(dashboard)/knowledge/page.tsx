'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAPI } from '@/hooks/useAPI'
import { KBArticle } from '@/types'
import { Btn, IC, Input, Select, Textarea, Modal, Empty, formatTime, Spinner, Tag, Card } from '@/components/ui'

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('## ')) return <div key={i} style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '20px 0 8px' }}>{line.slice(3)}</div>
    if (line.startsWith('### ')) return <div key={i} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '16px 0 6px' }}>{line.slice(4)}</div>
    if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 20, margin: '4px 0', color: 'var(--text2)', display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>{line.slice(2)}</div>
    if (line.match(/^\d+\./)) return <div key={i} style={{ paddingLeft: 20, margin: '4px 0', color: 'var(--text2)' }}>{line}</div>
    if (line.startsWith('**') && line.endsWith('**')) return <div key={i} style={{ fontWeight: 600, color: 'var(--text)', margin: '12px 0 4px' }}>{line.slice(2, -2)}</div>
    if (line === '') return <div key={i} style={{ height: 8 }} />
    return <div key={i} style={{ color: 'var(--text2)', lineHeight: 1.7 }}>{line}</div>
  })
}

export default function KnowledgePage() {
  const { user } = useAuth()
  const { get, post, patch, del } = useAPI()
  const [articles, setArticles] = useState<KBArticle[]>([])
  const [selected, setSelected] = useState<KBArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [helpful, setHelpful] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', category: 'General', tags: '', published: true })

  const isStaff = user?.role !== 'USER'

  const categories = ['all', ...new Set(articles.map(a => a.category))]

  const fetchArticles = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'all') params.set('category', category)
      const data = await get(`/knowledge?${params}`)
      setArticles(data.articles || [])
    } catch {} finally { setLoading(false) }
  }, [search, category])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  const selectArticle = async (id: string) => {
    const data = await get(`/knowledge/${id}`)
    setSelected(data.article)
    setHelpful(false)
  }

  const createArticle = async () => {
    setSaving(true)
    try {
      const data = await post('/knowledge', { ...form, tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) })
      setArticles(prev => [data.article, ...prev])
      setSelected(data.article)
      setShowNew(false)
      setForm({ title: '', content: '', category: 'General', tags: '', published: true })
    } catch {} finally { setSaving(false) }
  }

  const saveEdit = async () => {
    if (!selected) return
    setSaving(true)
    try {
      await patch(`/knowledge/${selected.id}`, { ...form, tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) })
      fetchArticles()
      selectArticle(selected.id)
      setShowEdit(false)
    } catch {} finally { setSaving(false) }
  }

  const markHelpful = async () => {
    if (!selected || helpful) return
    await patch(`/knowledge/${selected.id}`, { helpful: selected.helpful + 1 })
    setSelected(prev => prev ? { ...prev, helpful: prev.helpful + 1 } : prev)
    setHelpful(true)
  }

  const openEdit = () => {
    if (!selected) return
    setForm({ title: selected.title, content: selected.content, category: selected.category, tags: selected.tags.join(', '), published: selected.published })
    setShowEdit(true)
  }

  const ArticleForm = ({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input label="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Article title" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Network, Software, Security..." />
        <Input label="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="vpn, remote, ..." />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>Content (Markdown supported)</label>
        <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
          rows={14} placeholder="## Section&#10;Content here..." style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 13, resize: 'vertical', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7 }} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
        <input type="checkbox" checked={form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
        Published (visible to all users)
      </label>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" loading={saving} onClick={onSave} disabled={!form.title.trim()}>Save Article</Btn>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Article list */}
      <div style={{ width: 340, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><IC name="search" size={14} color="var(--text3)" /></div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search knowledge base..."
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px 8px 34px', color: 'var(--text)', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', background: category === c ? 'var(--accent)' : 'var(--surface2)', color: category === c ? '#fff' : 'var(--text2)' }}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        </div>
        {isStaff && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <Btn variant="primary" size="sm" onClick={() => setShowNew(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <IC name="plus" size={14} color="#fff" />New Article
            </Btn>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><Spinner /></div>}
          {!loading && articles.length === 0 && <Empty icon="kb" title="No articles found" subtitle="Try a different search term" />}
          {articles.map(a => (
            <button key={a.id} onClick={() => selectArticle(a.id)}
              style={{ width: '100%', padding: '12px 14px', textAlign: 'left', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: selected?.id === a.id ? 'var(--surface2)' : 'transparent', borderLeft: `3px solid ${selected?.id === a.id ? 'var(--accent)' : 'transparent'}`, transition: 'all .12s' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 11, background: 'var(--surface2)', color: 'var(--text2)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)' }}>{a.category}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{a.views} views</span>
                <span style={{ fontSize: 11, color: '#34d399' }}>{a.helpful} helpful</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {a.tags.slice(0, 3).map(t => <Tag key={t} label={t} />)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Article content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selected ? (
          <div style={{ padding: 36, maxWidth: 800, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 10px', borderRadius: 6 }}>{selected.category}</span>
              {selected.tags.map(t => <Tag key={t} label={t} />)}
              {!selected.published && <span style={{ fontSize: 11, background: 'rgba(239,68,68,0.12)', color: '#f87171', padding: '3px 10px', borderRadius: 6 }}>Draft</span>}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.25 }}>{selected.title}</h1>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 32, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <span>By {selected.author?.name}</span>
              <span>Updated {formatTime(selected.updatedAt)}</span>
              <span>{selected.views} views</span>
            </div>
            <div style={{ marginBottom: 32, lineHeight: 1.75 }}>
              {renderMarkdown(selected.content)}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, color: 'var(--text2)' }}>Was this article helpful?</span>
              <Btn size="sm" variant={helpful ? 'success' : 'ghost'} onClick={markHelpful} disabled={helpful}>
                <IC name="thumbsup" size={13} color={helpful ? '#34d399' : 'currentColor'} />
                Yes ({selected.helpful})
              </Btn>
              {isStaff && (
                <>
                  <div style={{ flex: 1 }} />
                  <Btn size="sm" variant="ghost" onClick={openEdit}><IC name="edit" size={13} />Edit Article</Btn>
                </>
              )}
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty icon="kb" title="Select an article" subtitle="Browse the knowledge base to find answers" action={
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text3)' }}>
                {articles.length} articles available
              </div>
            } />
          </div>
        )}
      </div>

      {showNew && (
        <Modal title="Create Knowledge Base Article" onClose={() => setShowNew(false)} width={700}>
          <ArticleForm onSave={createArticle} onCancel={() => setShowNew(false)} />
        </Modal>
      )}
      {showEdit && (
        <Modal title="Edit Article" onClose={() => setShowEdit(false)} width={700}>
          <ArticleForm onSave={saveEdit} onCancel={() => setShowEdit(false)} />
        </Modal>
      )}
    </div>
  )
}
