import { useMemo, useState } from 'react'

export type PRow = {
  date: string; mrn: string; code: string; procedure: string; note: string
  attending: string; category: 'TAE' | '其他'; image: string; source: string; cases: string[]
  disease: string; linkCase: string | null; linkBy: 'MRN' | 'date' | 'inferred'; inferNote?: string
}
const BY: Record<string, string> = { MRN: '病歷號', date: '同日', inferred: '推定' }

export function PlistTable({ rows, onOpenCase }: { rows: PRow[]; onOpenCase: (id: string) => void }) {
  return (
    <table className="plist__table">
      <thead><tr><th>日期</th><th>病歷號</th><th>項目</th><th>分類</th><th>病例</th></tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.date}</td><td className="mono">{r.mrn}</td>
            <td>{r.code} {r.procedure}{r.category === 'TAE' && <span className="dchip">TAE</span>}{r.note && <small> {r.note}</small>}</td>
            <td>{r.disease}{r.linkBy === 'inferred' && <span className="tag tag--near" title={r.inferNote}>推定</span>}{r.inferNote && <small> {r.inferNote}</small>}</td>
            <td>{r.linkCase ? <button className="dchip link" onClick={() => onOpenCase(r.linkCase!)}>{r.linkCase}・{BY[r.linkBy]}</button> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function PatientList({ rows, query, dis, setDis, diseases, onOpenCase }: {
  rows: PRow[]; query: string; dis: string; setDis: (d: string) => void
  diseases: { id: string; label: string }[]; onOpenCase: (id: string) => void
}) {
  const [tae, setTae] = useState<'all' | 'TAE' | '其他'>('all')
  const q = query.trim().toLowerCase()
  const label = (id: string) => diseases.find((d) => d.id === id)?.label ?? id
  const shown = useMemo(() => rows.filter((r) =>
    (dis === 'all' || r.disease === dis) && (tae === 'all' || r.category === tae) &&
    (!q || [r.date, r.mrn, r.code, r.procedure, r.note, r.linkCase ?? ''].join(' ').toLowerCase().includes(q))
  ).map((r) => ({ ...r, disease: label(r.disease) })), [rows, dis, tae, q])
  return (
    <div className="plist">
      <div className="chips">
        <button className={`dchip${dis === 'all' ? ' on' : ''}`} onClick={() => setDis('all')}>全部 {rows.length}</button>
        {diseases.map((d) => <button key={d.id} className={`dchip${dis === d.id ? ' on' : ''}`} onClick={() => setDis(d.id)}>{d.label} {rows.filter((r) => r.disease === d.id).length}</button>)}
      </div>
      <div className="chips">
        {(['all', 'TAE', '其他'] as const).map((g) => <button key={g} className={`dchip${tae === g ? ' on' : ''}`} onClick={() => setTae(g)}>{g === 'all' ? 'TAE＋其他' : g}</button>)}
        <small>（{shown.length} 筆；「推定」= 未對到病例，依項目/備註推定分類）</small>
      </div>
      <PlistTable rows={shown} onOpenCase={onOpenCase} />
      {shown.length === 0 && <p className="hint">沒有符合的資料。</p>}
    </div>
  )
}
