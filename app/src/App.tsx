import { useEffect, useMemo, useState } from 'react'
import { CATEGORIES } from './data/categories'
import { loadCases2, loadManifestMedia, loadNotes, loadPearls, loadRules } from './data/load'
import type { Case2, DiseaseId, MediaItem, NoteText, Pearl } from './types'
import { MediaGrid } from './components/MediaGrid'
import { MediaLightbox } from './components/MediaLightbox'
import { PatientList, PlistTable, type PRow } from './components/PatientList'
import './App.css'
import './v2.css'

const DISEASES: { id: DiseaseId; label: string; rule?: string }[] = [
  { id: 'aneurysm', label: 'Aneurysm FD/coil', rule: 'Aneurysm' },
  { id: 'davf', label: 'Dural AVF', rule: 'Dural AVF' },
  { id: 'avm', label: 'AVM', rule: 'AVM' },
  { id: 'tumor', label: 'Tumor', rule: 'Tumor' },
  { id: 'ia', label: 'IA 取栓', rule: 'IA' },
  { id: 'stenting', label: 'Stenting', rule: 'Stenting' },
  { id: 'stroke', label: 'Stroke/MT' },
  { id: 'stenosis', label: 'Stenosis' },
  { id: 'mma', label: 'MMA' },
  { id: 'other', label: 'Other' },
]
type Tab = DiseaseId | 'search' | 'pearls' | 'media' | 'plist'
const GROUPS: [string, string][] = [['MRN', '病歷號相符'], ['same', '同日'], ['near', '鄰近日（±7天）']]
const short = (d: string) => d.replace(/^(Microcath|Guide|Closure|Hemostasis|FD|Stent): /, (_m, p) => (p === 'FD' ? 'FD ' : ''))

function Md({ text }: { text: string }) {
  return (
    <div className="md">
      {text.split('\n').filter((l) => l.trim()).map((l, i) => {
        const ind = /^\s{2,}-/.test(l)
        const t = l.replace(/^\s*-\s*/, '').replace(/^>\s*/, '')
        const parts = t.split(/\*\*(.+?)\*\*/g).map((p, j) => (j % 2 ? <b key={j}>{p}</b> : p))
        return <p key={i} className={/^\s*-/.test(l) ? (ind ? 'li li2' : 'li') : ''}>{parts}</p>
      })}
    </div>
  )
}

const STK: Record<string, string> = { sheath: '鞘', guide: '導引/中間', aspiration: '抽吸導管', retriever: '取栓支架', micro: '微導管', wire: '導絲', implant: '植入', embolic: '栓塞', balloon: '球囊', drug: '藥物', closure: '止血' }

function Summary({ c }: { c: Case2 }) {
  const out = c.impression || c.outcome || c.merged[0]?.outcome || ''
  return (
    <div className="sum">
      <div className="sum__row">
        <b>{c.date || '日期不明'}</b>
        <span className="mono">MRN {c.mrn || '未記載'}</span>
        <span className="sum__id">{c.id}</span>
        {c.flags.length > 0 && <span className="warn" title={c.flags.join('；')}>⚠️ {c.flags.length}</span>}
      </div>
      <div className="sum__dx">{c.dx || c.impression.split('\n')[0] || '（未記載診斷）'}</div>
      <div className="sum__row small">
        {c.treatment && <span>治療：{c.treatment}</span>}
        {c.approach.length > 0 && <span>途徑：{c.approach.join('、')}</span>}
      </div>
      {c.devices.length > 0 && <div className="chips">{c.devices.map((d) => <span key={d} className="dchip">{short(d)}</span>)}</div>}
      {c.stack && <div className="stack">{c.loc && <span className="small">位置：{c.loc}{c.ap2 ? '｜' + c.ap2 : ''}</span>}
        {Object.entries(STK).map(([k, lab]) => { const v = c.stack![k]; return Array.isArray(v) && v.length > 0 ? <span key={k} className="stk"><i>{lab}</i>{v.map((d) => <button key={d} className="dchip link" title="篩選使用此器材的病例" onClick={() => window.dispatchEvent(new CustomEvent('angio-dev', { detail: d }))}>{d}</button>)}</span> : null })}
        {c.stack.size && <span className="small">尺寸：{c.stack.size}</span>}</div>}
      {out && <div className="sum__out"><b>結果/IMP：</b>{out}</div>}
    </div>
  )
}

function CaseView({ c, media, notes, onMedia, prev, next, go, compact, plist }: {
  plist: PRow[]
  c: Case2; media: Map<string, MediaItem>; notes: Map<string, NoteText>
  onMedia: (items: MediaItem[], i: number) => void
  prev?: Case2; next?: Case2; go: (id: string) => void; compact?: boolean
}) {
  const imgs = c.supp.images.map((r) => ({ r, m: media.get(r.key!) })).filter((x) => x.m) as { r: Case2['supp']['images'][0]; m: MediaItem }[]
  const items = imgs.map((x) => x.m)
  return (
    <article className="cv">
      <div className="cv__sticky"><Summary c={c} />
          {!compact && (
        <div className="cv__nav">
          <button disabled={!prev} onClick={() => prev && go(prev.id)}>‹ 上一例{prev ? ` ${prev.date}` : ''}</button>
          <button disabled={!next} onClick={() => next && go(next.id)}>{next ? `${next.date} ` : ''}下一例 ›</button>
        </div>
      )}
      </div>
      {imgs.length > 0 && (
        <div className="strip">
          {imgs.map(({ r, m }, i) => (
            <button key={m.id} className="strip__it" onClick={() => onMedia(items, i)}>
              {m.kind === 'image' ? <img src={m.url} loading="lazy" alt="" /> : <video src={m.url} muted preload="metadata" />}
              <span className={`tag tag--${r.group}`}>{r.group === 'MRN' ? 'MRN' : r.label}</span>
            </button>
          ))}
        </div>
      )}
      {c.text ? (
        <section className="cv__text"><h4>掃描報告（OCR{c.pages > 1 ? `，${c.pages} 頁` : ''}）</h4><pre>{c.text}</pre></section>
      ) : (
        <section className="cv__text"><h4>筆記病例（無掃描報告）</h4></section>
      )}
      {c.merged.length > 0 && (
        <details className="cv__fold" open={c.kind === 'note'}>
          <summary>舊筆記病例 {c.merged.map((m) => m.id.toUpperCase()).join('、')}</summary>
          {c.merged.map((m) => <div key={m.id} className="mg"><b>{m.id.toUpperCase()}</b> {m.date} MRN {m.mrnRaw}<br />診斷：{m.dx}<br />治療：{m.tx}{m.devices && <><br />器材：{m.devices}</>}{m.outcome && <><br />結果：{m.outcome}</>}</div>)}
        </details>
      )}
      {GROUPS.map(([g, label]) => {
        const ns = c.supp.notes.filter((r) => r.group === g)
        if (!ns.length) return null
        return (
          <details key={g} className="cv__fold" open={g === 'MRN'}>
            <summary>補充筆記・{label}（{ns.length}）</summary>
            {ns.map((r) => { const n = notes.get(r.id!); return n && (
              <details key={r.id} className="note"><summary><span className={`tag tag--${r.group}`}>{r.label}</span> {n.title}（{n.date}）</summary><pre>{n.text}</pre></details>) })}
          </details>
        )
      })}
      {c.plist.length > 0 && <details className="cv__fold" open><summary>病人清單紀錄（{c.plist.length}）</summary><PlistTable rows={c.plist.map((i) => plist[i]).filter(Boolean)} onOpenCase={go} /></details>}
      {c.links.length > 0 && <div className="chips">相關病例：{c.links.map((l) => <button key={l.id} className="dchip link" onClick={() => go(l.id)}>{l.id} {l.label}</button>)}</div>}
    </article>
  )
}

export default function App() {
  const [cases, setCases] = useState<Case2[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [notes, setNotes] = useState<NoteText[]>([])
  const [pearls, setPearls] = useState<Pearl[]>([])
  const [rules, setRules] = useState('')
  const [plist, setPlist] = useState<PRow[]>([])
  const [plDis, setPlDis] = useState('all')
  const [tab, setTab] = useState<Tab>('aneurysm')
  const [sel, setSel] = useState<string | null>(null)
  const [cmp, setCmp] = useState<string[]>([])
  const [cmpMode, setCmpMode] = useState(false)
  const [q, setQ] = useState('')
  const [combos, setCombos] = useState<Record<string, { top: { stack: string; n: number; ids: string }[]; rows: { loc: string; n: number; ap: string; stack: string; ids: string }[]; pairs: string[] }>>({})
  const [lb, setLb] = useState<{ items: MediaItem[]; index: number } | null>(null)

  useEffect(() => {
    loadCases2().then((c) => { setCases(c); const h = decodeURIComponent(location.hash.slice(1)); if (h.startsWith('case=')) { const x = c.find((y) => y.id === h.slice(5)); if (x) { setSel(x.id); setTab(x.disease) } } }); loadManifestMedia().then(setMedia); loadNotes().then(setNotes); loadPearls().then(setPearls); loadRules().then(setRules); fetch(import.meta.env.BASE_URL + 'angio_index/device_cards.json').then((r) => r.json()).then(setCombos)
    const onDev = (e: Event) => { setQ('dev:' + (e as CustomEvent).detail); setTab('search'); setSel(null); window.scrollTo(0, 0) }
    window.addEventListener('angio-dev', onDev)
    fetch(`${import.meta.env.BASE_URL}angio_index/patient_list.json`).then((r) => r.json()).then((d) => setPlist(d.rows))
  }, [])
  const mediaMap = useMemo(() => new Map(media.map((m) => [m.key ?? m.id, m])), [media])
  const noteMap = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes])
  const ruleSecs = useMemo(() => Object.fromEntries(rules.split('\n## ').slice(1).map((s) => [s.split('\n')[0], s.slice(s.indexOf('\n') + 1)])), [rules])
  const byDis = (d: DiseaseId) => cases.filter((c) => c.disease === d)
  const ql = q.trim().toLowerCase()
  const hits = useMemo(() => !ql ? [] : ql.startsWith('dev:') ? cases.filter((c) => c.stack && Object.values(c.stack).some((v) => Array.isArray(v) && v.some((d) => d.toLowerCase() === ql.slice(4)))) : cases.filter((c) => [c.id, c.mrn, c.date, c.dx, c.impression, c.treatment, c.devices.join(' '), c.text, ...c.merged.map((m) => m.dx + m.tx + m.devices + m.mrnRaw)].join(' ').toLowerCase().includes(ql)), [cases, ql])
  const noteHits = useMemo(() => !ql || ql.startsWith('dev:') ? [] : notes.filter((n) => (n.title + ' ' + n.date + ' ' + n.text).toLowerCase().includes(ql)), [notes, ql])
  const mediaHits = useMemo(() => !ql || ql.startsWith('dev:') ? [] : media.filter((m) => (m.name + ' ' + (m.caption ?? '')).toLowerCase().includes(ql)), [media, ql])
  const isDis = DISEASES.some((d) => d.id === tab)
  const list = tab === 'search' ? hits : isDis ? byDis(tab as DiseaseId) : []
  const selected = cases.find((c) => c.id === sel) ?? null
  const sibs = selected ? byDis(selected.disease) : []
  const si = selected ? sibs.findIndex((c) => c.id === selected.id) : -1
  const go = (id: string) => { const c = cases.find((x) => x.id === id); if (c) { setSel(id); setTab(c.disease); history.replaceState(null, '', '#case=' + id); window.scrollTo({ top: 0 }) } }
  const legacyMap = useMemo(() => { const m = new Map<string, string>(); cases.forEach((c) => c.merged.forEach((l) => m.set(l.id, c.id))); return m }, [cases])
  const toggleCmp = (id: string) => setCmp((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]))
  const switchTab = (t: Tab) => { if (DISEASES.some((d) => d.id === t)) setPlDis(t); else if (t === 'plist' && tab === 'plist') setPlDis('all'); setTab(t); setSel(null); setCmpMode(false); setCmp([]) }
  const dRule = DISEASES.find((d) => d.id === tab)?.rule
  const ruleKey = dRule ? Object.keys(ruleSecs).find((k) => k.startsWith(dRule)) : undefined
  const learn = notes.filter((n) => !n.case)

  return (
    <div className="v2">
      <header className="top">
        <div className="top__row">
          <b className="logo">Angio Notes</b>
          <input type="search" placeholder="全域搜尋：病歷號、器材、報告內文…" value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value) { setTab('search'); setSel(null) } }} />
        </div>
        <nav className="dnav">
          {DISEASES.map((d) => <button key={d.id} className={tab === d.id ? 'on' : ''} onClick={() => switchTab(d.id)}>{d.label} <small>{byDis(d.id).length}{plist.length > 0 && `・清單${plist.filter((r) => r.disease === d.id).length}`}</small></button>)}
          <span className="sep" />
          <button className={tab === 'pearls' ? 'on' : ''} onClick={() => switchTab('pearls')}>學習技巧</button>
          <button className={tab === 'media' ? 'on' : ''} onClick={() => switchTab('media')}>媒體 <small>{media.length}</small></button>
          <button className={tab === 'plist' ? 'on' : ''} onClick={() => switchTab('plist')}>病人清單 <small>{plist.length}</small></button>
        </nav>
      </header>

      <main className="body">
        {selected ? (
          <>
            <button className="back" onClick={() => setSel(null)}>← 回列表</button>
            <CaseView plist={plist} c={selected} media={mediaMap} notes={noteMap} onMedia={(items, index) => setLb({ items, index })}
              prev={sibs[si - 1]} next={sibs[si + 1]} go={go} />
          </>
        ) : cmpMode && cmp.length > 1 ? (
          <>
            <button className="back" onClick={() => setCmpMode(false)}>← 結束比較</button>
            <div className={`cmp cmp--${cmp.length}`}>
              {cmp.map((id) => { const c = cases.find((x) => x.id === id)!; return <CaseView plist={plist} key={id} c={c} compact media={mediaMap} notes={noteMap} onMedia={(items, index) => setLb({ items, index })} go={go} /> })}
            </div>
          </>
        ) : (tab === 'search' || isDis) ? (
          <>
            {ruleKey && <details className="rules" open><summary>規則歸納：{ruleKey}</summary><Md text={ruleSecs[ruleKey]} /></details>}
            {isDis && combos[tab] && <details className="rules combos"><summary>器材組合：{ruleKey || tab}</summary>
              <b>最常見核心組合</b><ul>{combos[tab].top.map((t) => <li key={t.stack}><b>{t.stack}</b> — {t.n} 例（{t.ids.split('、').map((id, i) => <span key={id}>{i ? '、' : ''}<a href={'#case=' + id} onClick={(e) => { e.preventDefault(); go(id) }}>{id}</a></span>)}）</li>)}</ul>
              <b>位置 × 典型組合</b><div className="tblwrap"><table className="ctbl"><thead><tr><th>位置</th><th>n</th><th>途徑</th><th>典型組合</th><th>病例</th></tr></thead><tbody>{combos[tab].rows.map((r) => <tr key={r.loc}><td>{r.loc}</td><td>{r.n}</td><td>{r.ap}</td><td>{r.stack}</td><td className="mono small">{r.ids}</td></tr>)}</tbody></table></div>
              {combos[tab].pairs.length > 0 && <><b>配對（n/N）</b><ul>{combos[tab].pairs.map((p) => <li key={p}>{p.replace(/\*\*/g, '')}</li>)}</ul></>}
              <p className="hint">n 小，僅反映本批病例習慣；決策式規則見「學習技巧」。點病例頁器材 chip 可篩選。</p></details>}
            {isDis && !ruleKey && <p className="hint">此類別目前只有舊筆記病例，沒有掃描報告，所以沒有規則歸納。</p>}
            {tab === 'search' && <p className="hint">{q.startsWith('dev:') ? `使用器材「${q.slice(4)}」` : `搜尋「${q}」`}：病例 {hits.length}・筆記 {noteHits.length}・圖片 {mediaHits.length}</p>}
            {isDis && <p className="hint">病人清單中此類 {plist.filter((r) => r.disease === tab).length} 筆 <button className="dchip link" onClick={() => { setTab('plist'); setPlDis(tab) }}>查看</button></p>}
            {isDis && list.length > 1 && (
              <div className="cmpbar">比較模式：勾選 2–3 例（已選 {cmp.length}）
                <button disabled={cmp.length < 2} onClick={() => setCmpMode(true)}>並排比較</button>
                {cmp.length > 0 && <button onClick={() => setCmp([])}>清除</button>}
              </div>
            )}
            <ol className="tl">
              {list.map((c) => (
                <li key={c.id} className={cmp.includes(c.id) ? 'picked' : ''}>
                  {isDis && <input type="checkbox" aria-label="比較" checked={cmp.includes(c.id)} onChange={() => toggleCmp(c.id)} />}
                  <button className="card" onClick={() => go(c.id)}>
                    <div className="card__top"><b>{c.date || '—'}</b><span className="mono">{c.mrn || 'MRN?'}</span><span className="sum__id">{c.id}</span>
                      {c.supp.notes.length > 0 && <span className="badge">📝{c.supp.notes.length}</span>}
                      {c.supp.images.length > 0 && <span className="badge">🖼{c.supp.images.length}</span>}
                      {c.flags.length > 0 && <span className="badge warn">⚠️</span>}
                    </div>
                    <div className="card__dx">{c.dx || c.impression || '（未記載）'}</div>
                    <div className="card__tx">{c.treatment}</div>
                    <div className="chips">{c.devices.slice(0, 6).map((d) => <span key={d} className="dchip">{short(d)}</span>)}</div>
                  </button>
                </li>
              ))}
            </ol>
            {list.length === 0 && tab !== 'search' && <p className="hint">沒有病例。</p>}
            {tab === 'search' && noteHits.length > 0 && <div className="learn"><h3>筆記與學習技巧</h3>{noteHits.map((n) => { const i = n.text.toLowerCase().indexOf(ql); return (
              <details key={n.id} className="pearl-card"><summary>{n.title}（{n.date}）— …{n.text.slice(Math.max(0, i - 40), i + 80)}…</summary><pre className="note-text">{n.text}</pre></details>) })}</div>}
            {tab === 'search' && mediaHits.length > 0 && <div><h3>圖片</h3><div className="media-grid">{mediaHits.map((m, i) => (
              <button key={m.id} type="button" className="media-tile" onClick={() => setLb({ items: mediaHits, index: i })}><img src={m.url} alt={m.name} loading="lazy" /><span className="media-tile__name">{m.caption}</span></button>))}</div></div>}
            {tab === 'search' && hits.length + noteHits.length + mediaHits.length === 0 && <p className="hint">找不到結果。</p>}
          </>
        ) : tab === 'pearls' ? (
          <div className="learn">
            {CATEGORIES.map((cat) => {
              const ps = pearls.filter((p) => p.category === cat.id); const ns = learn.filter((n) => n.category === cat.id)
              if (!ps.length && !ns.length) return null
              return (
                <section key={cat.id}><h3>{cat.label}</h3>
                  {ns.filter((n) => (n.id.startsWith('R') || n.id.startsWith('D'))).map((n) => <details key={n.id} className="rules" open><summary>{n.title}</summary><Md text={n.text} /></details>)}
                  {ps.map((p) => <p key={p.id} className="pearl">• {p.text}</p>)}
                  {ns.filter((n) => !(n.id.startsWith('R') || n.id.startsWith('D'))).map((n) => <details key={n.id} className="note"><summary>{n.title}（{n.date}）</summary><pre>{n.text}</pre></details>)}
                </section>)
            })}
          </div>
        ) : tab === 'media' ? (
          <MediaGrid items={media} onOpen={(i) => setLb({ items: media, index: i })} />
        ) : (
          <PatientList rows={plist} query={q} dis={plDis} setDis={setPlDis} diseases={DISEASES} onOpenCase={(id) => go(legacyMap.get(id) ?? id)} />
        )}
      </main>
      {lb && <MediaLightbox items={lb.items} index={lb.index} onClose={() => setLb(null)} onIndex={(index) => setLb((p) => (p ? { ...p, index } : p))} />}
    </div>
  )
}
