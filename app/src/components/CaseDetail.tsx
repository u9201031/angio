import { useCallback, useRef, useState } from 'react'
import type { CaseRecord, MediaItem } from '../types'
import { categoryShort } from '../data/categories'
import { mediaKind } from '../data/load'
import { MediaGrid } from './MediaGrid'

interface Props {
  caseRecord: CaseRecord
  media: MediaItem[]
  onOpenMedia: (items: MediaItem[], index: number) => void
  onAddMedia: (caseId: string, items: MediaItem[]) => void
  onClose: () => void
}

const FIELDS: { key: keyof CaseRecord; label: string }[] = [
  { key: 'date', label: '日期' },
  { key: 'mrn', label: '病歷號' },
  { key: 'patient', label: '病人' },
  { key: 'diagnosis', label: '診斷' },
  { key: 'treatment', label: '治療' },
  { key: 'devices', label: '器材' },
  { key: 'outcome', label: '結果' },
  { key: 'sourceNote', label: '來源筆記' },
]

export function CaseDetail({
  caseRecord,
  media,
  onOpenMedia,
  onAddMedia,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const ingestFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files)
      const next: MediaItem[] = []
      for (const file of list) {
        const kind = mediaKind(file.name)
        if (!kind) continue
        next.push({
          id: `${caseRecord.id}:local:${file.name}:${file.lastModified}`,
          caseId: caseRecord.id,
          name: file.name,
          url: URL.createObjectURL(file),
          kind,
          ephemeral: true,
        })
      }
      if (next.length) onAddMedia(caseRecord.id, next)
    },
    [caseRecord.id, onAddMedia],
  )

  return (
    <aside className="detail">
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
          const value = caseRecord[key]
          if (typeof value !== 'string' || !value) return null
          return (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          )
        })}
      </dl>

      <section className="detail__media">
        <div className="detail__media-head">
          <h3>圖片 / 影片</h3>
          <button
            type="button"
            className="btn"
            onClick={() => inputRef.current?.click()}
          >
            加入本機檔案
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) ingestFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <div
          className={`dropzone${dragging ? ' is-drag' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            if (e.dataTransfer.files.length) ingestFiles(e.dataTransfer.files)
          }}
        >
          拖放圖片或影片到這裡（僅本次瀏覽有效）
        </div>

        <MediaGrid
          items={media}
          onOpen={(i) => onOpenMedia(media, i)}
          emptyHint="此病例尚無媒體。可拖放檔案，或放到 public/media 後更新 manifest。"
        />
      </section>
    </aside>
  )
}
