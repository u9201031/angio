import type { CaseRecord, MediaItem, Pearl } from '../types'
import { categoryShort } from '../data/categories'
import { MediaGrid } from './MediaGrid'

interface Props {
  caseRecord: CaseRecord
  media: MediaItem[]
  pearls: Pearl[]
  onOpenMedia: (items: MediaItem[], index: number) => void
  onClose: () => void
}

function formatMrn(raw: string) {
  const value = raw.replace(/^⚠️/, '').trim()
  if (!value || value.includes('（無）')) return '未記載'
  return value
}

const FIELDS: { key: keyof CaseRecord; label: string }[] = [
  { key: 'date', label: '日期' },
  { key: 'mrn', label: '病歷號' },
  { key: 'patient', label: '匿名備註' },
  { key: 'diagnosis', label: '診斷' },
  { key: 'treatment', label: '治療' },
  { key: 'devices', label: '器材' },
  { key: 'outcome', label: '結果' },
  { key: 'sourceNote', label: '來源筆記' },
]

export function CaseDetail({
  caseRecord,
  media,
  pearls,
  onOpenMedia,
  onClose,
}: Props) {
  const relatedPearls = pearls.filter((p) =>
    caseRecord.categories.includes(p.category),
  )

  const hasMedia = media.length > 0
  return (
    <aside className={`detail${hasMedia ? ' detail--split' : ''}`}>
      <div className="detail__notes-col">
      <header className="detail__head">
        <div>
          <p className="detail__id">{caseRecord.id.toUpperCase()}</p>
          <h2>{caseRecord.diagnosis || '（未記載診斷）'}</h2>
          <div className="chip-row">
            {caseRecord.categories.map((c) => (
              <span key={c} className="chip">
                {categoryShort(c)}
              </span>
            ))}
          </div>
        </div>
        <button type="button" className="btn ghost" onClick={onClose}>
          關閉
        </button>
      </header>

      <dl className="detail__fields">
        {FIELDS.map(({ key, label }) => {
          const raw = caseRecord[key]
          if (typeof raw !== 'string' || !raw) {
            if (key === 'mrn') {
              return (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd className="detail__mrn">未記載</dd>
                </div>
              )
            }
            return null
          }
          const value = key === 'mrn' ? formatMrn(raw) : raw
          return (
            <div key={key}>
              <dt>{label}</dt>
              <dd className={key === 'mrn' ? 'detail__mrn' : undefined}>{value}</dd>
            </div>
          )
        })}
      </dl>

      <section className="detail__notes">
        <h3>相關教學筆記（{relatedPearls.length}）</h3>
        {relatedPearls.length === 0 ? (
          <p className="empty-hint">此分類尚無 pearls。</p>
        ) : (
          <ul className="pearl-list detail__pearl-list">
            {relatedPearls.map((p) => (
              <li key={p.id} className="pearl-card">
                <span className="chip">{categoryShort(p.category)}</span>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>

      <section className="detail__media">
        <div className="detail__media-head">
          <h3>圖片 / 影片</h3>
        </div>

        <MediaGrid
          items={media}
          onOpen={(i) => onOpenMedia(media, i)}
          emptyHint="此病例尚無媒體。"
        />
      </section>
    </aside>
  )
}
