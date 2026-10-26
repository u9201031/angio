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
          '尚無媒體。可把檔案放進 public/media/{病例id}/ 並更新 manifest.json，或直接拖放到病例詳情。'}
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
          <span className="media-tile__name">{item.name}</span>
        </button>
      ))}
    </div>
  )
}
