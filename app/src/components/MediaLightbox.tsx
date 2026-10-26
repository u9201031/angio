import { useEffect } from 'react'
import type { MediaItem } from '../types'

interface Props {
  items: MediaItem[]
  index: number
  onClose: () => void
  onIndex: (i: number) => void
}

export function MediaLightbox({ items, index, onClose, onIndex }: Props) {
  const item = items[index]

  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onIndex((index + 1) % items.length)
      if (e.key === 'ArrowLeft') onIndex((index - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [item, index, items.length, onClose, onIndex])

  if (!item) return null

  return (
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lightbox__stage" onClick={(e) => e.stopPropagation()}>
        <header className="lightbox__bar">
          <span>
            {item.name}
            <small>
              {index + 1} / {items.length}
            </small>
          </span>
          <button type="button" className="btn ghost" onClick={onClose}>
            關閉
          </button>
        </header>
        {item.kind === 'image' ? (
          <img src={item.url} alt={item.name} className="lightbox__media" />
        ) : (
          <video
            key={item.url}
            src={item.url}
            className="lightbox__media"
            controls
            autoPlay
            playsInline
          />
        )}
        {items.length > 1 && (
          <div className="lightbox__nav">
            <button
              type="button"
              className="btn"
              onClick={() => onIndex((index - 1 + items.length) % items.length)}
            >
              上一則
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onIndex((index + 1) % items.length)}
            >
              下一則
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
