import { useCallback, useEffect, useMemo, useState } from 'react'
import { CATEGORIES, categoryShort } from './data/categories'
import {
  caseSearchBlob,
  loadCases,
  loadManifestMedia,
  loadPearls,
} from './data/load'
import type {
  CaseRecord,
  CategoryId,
  MediaItem,
  Pearl,
  ViewTab,
} from './types'
import { CaseDetail } from './components/CaseDetail'
import { MediaGrid } from './components/MediaGrid'
import { MediaLightbox } from './components/MediaLightbox'
import './App.css'

export default function App() {
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [pearls, setPearls] = useState<Pearl[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryId | 'all'>('all')
  const [tab, setTab] = useState<ViewTab>('cases')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [lightbox, setLightbox] = useState<{
    items: MediaItem[]
    index: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [c, p, m] = await Promise.all([
          loadCases(),
          loadPearls(),
          loadManifestMedia(),
        ])
        if (cancelled) return
        setCases(c)
        setPearls(p)
        setMedia(m)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '載入失敗')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const q = query.trim().toLowerCase()

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (category !== 'all' && !c.categories.includes(category)) return false
      if (!q) return true
      return caseSearchBlob(c).includes(q)
    })
  }, [cases, category, q])

  const filteredPearls = useMemo(() => {
    return pearls.filter((p) => {
      if (category !== 'all' && p.category !== category) return false
      if (!q) return true
      return p.text.toLowerCase().includes(q) || p.categoryLabel.toLowerCase().includes(q)
    })
  }, [pearls, category, q])

  const filteredMedia = useMemo(() => {
    const caseIds = new Set(filteredCases.map((c) => c.id))
    return media.filter((m) => {
      if (!caseIds.has(m.caseId)) return false
      if (!q) return true
      return m.name.toLowerCase().includes(q)
    })
  }, [media, filteredCases, q])

  const selected = cases.find((c) => c.id === selectedId) ?? null
  const selectedMedia = useMemo(
    () => (selected ? media.filter((m) => m.caseId === selected.id) : []),
    [media, selected],
  )

  const addMedia = useCallback((caseId: string, items: MediaItem[]) => {
    setMedia((prev) => {
      const ids = new Set(prev.map((m) => m.id))
      const fresh = items.filter((i) => !ids.has(i.id))
      return [...prev, ...fresh]
    })
    setSelectedId(caseId)
    setTab('cases')
  }, [])

  const openMedia = useCallback((items: MediaItem[], index: number) => {
    setLightbox({ items, index })
  }, [])

  return (
    <div className="app">
      <div className="bg-grid" aria-hidden />
      <header className="hero">
        <p className="brand">Angio Notes</p>
        <h1>神經介入學習筆記</h1>
        <p className="lede">
          搜尋病例、教學 pearls，並檢視對應圖片與影片。
        </p>
        <div className="search">
          <input
            type="search"
            placeholder="搜尋診斷、器材、病例代號、pearl…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
      </header>

      <nav className="toolbar" aria-label="篩選">
        <div className="tabs">
          {(
            [
              ['cases', `病例 ${filteredCases.length}`],
              ['pearls', `Pearls ${filteredPearls.length}`],
              ['media', `媒體 ${filteredMedia.length}`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`tab${tab === id ? ' is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filters">
          <button
            type="button"
            className={`chip filter${category === 'all' ? ' is-active' : ''}`}
            onClick={() => setCategory('all')}
          >
            全部
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip filter${category === c.id ? ' is-active' : ''}`}
              onClick={() => setCategory(c.id)}
            >
              {c.short}
            </button>
          ))}
        </div>
      </nav>

      <main className={`main${selected ? ' has-detail' : ''}`}>
        <section className="list-pane">
          {loading && <p className="empty-hint">載入中…</p>}
          {error && <p className="error">{error}</p>}

          {!loading && !error && tab === 'cases' && (
            <ul className="case-list">
              {filteredCases.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`case-card${selectedId === c.id ? ' is-selected' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <div className="case-card__meta">
                      <span>{c.date || '—'}</span>
                      <span>{c.id.toUpperCase()}</span>
                    </div>
                    <strong>{c.diagnosis || '（未記載診斷）'}</strong>
                    <p>{c.treatment || '—'}</p>
                    <div className="chip-row">
                      {c.categories.map((cat) => (
                        <span key={cat} className="chip">
                          {categoryShort(cat)}
                        </span>
                      ))}
                      {media.some((m) => m.caseId === c.id) && (
                        <span className="chip media-flag">有媒體</span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
              {filteredCases.length === 0 && (
                <p className="empty-hint">沒有符合的病例。</p>
              )}
            </ul>
          )}

          {!loading && !error && tab === 'pearls' && (
            <ul className="pearl-list">
              {filteredPearls.map((p) => (
                <li key={p.id} className="pearl-card">
                  <span className="chip">{categoryShort(p.category)}</span>
                  <p>{p.text}</p>
                </li>
              ))}
              {filteredPearls.length === 0 && (
                <p className="empty-hint">沒有符合的 pearls。</p>
              )}
            </ul>
          )}

          {!loading && !error && tab === 'media' && (
            <MediaGrid
              items={filteredMedia}
              onOpen={(i) => openMedia(filteredMedia, i)}
            />
          )}
        </section>

        {selected && tab === 'cases' && (
          <CaseDetail
            caseRecord={selected}
            media={selectedMedia}
            onOpenMedia={openMedia}
            onAddMedia={addMedia}
            onClose={() => setSelectedId(null)}
          />
        )}
      </main>

      {lightbox && (
        <MediaLightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndex={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
        />
      )}
    </div>
  )
}
