import type { MediaItem } from '../types'

interface Props {
  items: MediaItem[]
  onOpen: (index: number) => void
  emptyHint?: string
}

export function MediaGrid({ items, onOpen, emptyHint }: Props) {
  if (items.length === 0) {
    return (
      <p className="empty-hint">
        {emptyHint ??
          '尚無媒體。'}
      </p>
    )
  }

  return (
    <div className="media-grid">
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          className="media-tile"
          onClick={() => onOpen(i)}
        >
          {item.kind === 'image' ? (
            <img src={item.url} alt={item.name} loading="lazy" />
          ) : (
            <div className="media-tile__video">
              <video src={item.url} muted preload="metadata" />
              <span className="media-tile__badge">影片</span>
            </div>
          )}
          <span className="media-tile__name">{item.caption ? `${item.caption} · ` : ''}{item.name}</span>
          {item.near && item.near.length > 0 && (
            <span className="media-tile__near">
              {item.near.slice(0, 4).map((n, j) => (
                <span key={j} className="chip">
                  {n.delta === 0 ? '同日' : `${n.delta > 0 ? '+' : ''}${n.delta}天`} {n.d.slice(5)} {n.case ? n.case.toUpperCase() + ' ' : ''}{n.mrn} {n.label}
                </span>
              ))}
              {item.near.length > 4 && <span className="chip">+{item.near.length - 4}</span>}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
