import { useEffect, useMemo, useState } from 'react'

type Row = {
  date: string; mrn: string; code: string; procedure: string; note: string
  attending: string; category: 'TAE' | '其他'; image: string; source: string; cases: string[]
}
const url = (p: string) => `${import.meta.env.BASE_URL}${p.replace(/^\//, '')}`

export function PatientList({ query, onOpenCase, onOpenImage }: {
  query: string
  onOpenCase: (id: string) => void
  onOpenImage: (src: string) => void
}) {
  const [rows, setRows] = useState<Row[]>([])
  const [group, setGroup] = useState<'all' | 'TAE' | '其他'>('all')
  useEffect(() => {
    fetch(url('angio_index/patient_list.json')).then((r) => r.json()).then((d) => setRows(d.rows))
  }, [])
  const q = query.trim().toLowerCase()
  const shown = useMemo(() => rows.filter((r) =>
    (group === 'all' || r.category === group) &&
    (!q || [r.date, r.mrn, r.code, r.procedure, r.note, r.source, ...r.cases].join(' ').toLowerCase().includes(q))
  ), [rows, group, q])
  const count = (g: string) => rows.filter((r) => r.category === g).length
  return (
    <div className="plist">
      <div className="chip-row">
        {(['all', 'TAE', '其他'] as const).map((g) => (
          <button key={g} type="button" className={`chip filter${group === g ? ' is-active' : ''}`} onClick={() => setGroup(g)}>
            {g === 'all' ? `全部 ${rows.length}` : `${g} ${count(g)}`}
          </button>
        ))}
      </div>
      <table className="plist__table">
        <thead><tr><th>日期</th><th>病歷號</th><th>分類</th><th>項目</th><th>備註</th><th>主治</th><th>來源</th><th>病例</th></tr></thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={i}>
              <td>{r.date}</td><td className="detail__mrn">{r.mrn}</td>
              <td><span className="chip">{r.category}</span></td>
              <td>{r.code} {r.procedure}</td><td>{r.note}</td><td>{r.attending}</td>
              <td>{r.image ? <button type="button" className="chip" onClick={() => onOpenImage(r.image)}>{r.source} 圖</button> : r.source}</td>
              <td>{r.cases.map((c) => <button key={c} type="button" className="chip" onClick={() => onOpenCase(c)}>{c.toUpperCase()}</button>)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {shown.length === 0 && <p className="empty-hint">沒有符合的資料。</p>}
    </div>
  )
}
