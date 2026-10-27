import type { CaseRecord, CategoryId, MediaItem, NoteText, Pearl } from '../types'
import { categoryLabel } from './categories'

/** Works on local `/` and GitHub Pages `/angio/` */
const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  cells.push(cur)
  return cells
}

export async function loadCases(): Promise<CaseRecord[]> {
  const res = await fetch(assetUrl('angio_index/cases.csv'))
  if (!res.ok) throw new Error(`無法載入病例資料（${res.status}）`)
  const text = await res.text()
  const lines = text.trim().split(/\r?\n/)
  const rows = lines.slice(1)
  return rows.map((line, idx) => {
    const [
      date = '',
      mrn = '',
      patient = '',
      diagnosis = '',
      treatment = '',
      devices = '',
      outcome = '',
      sourceNote = '',
      categories = '',
    ] = parseCsvLine(line)
    const id = `c${String(idx + 1).padStart(2, '0')}`
    return {
      id,
      date: date.trim(),
      mrn: mrn.trim(),
      patient: patient.trim(),
      diagnosis: diagnosis.trim(),
      treatment: treatment.trim(),
      devices: devices.trim(),
      outcome: outcome.trim(),
      sourceNote: sourceNote.trim(),
      categories: categories
        .split(';')
        .map((c) => c.trim())
        .filter(Boolean) as CategoryId[],
    }
  })
}

function stripMdBold(s: string) {
  return s.replace(/\*\*(.+?)\*\*/g, '$1')
}

export async function loadPearls(): Promise<Pearl[]> {
  const files = [
    '01_aneurysm',
    '02_stroke_thrombectomy',
    '03_stenosis_ICAD_carotid',
    '04_dAVF_CCF',
    '05_MMA_embolization',
    '06_pediatric',
    '07_unclassified_general',
  ] as const

  const pearls: Pearl[] = []
  for (const file of files) {
    const res = await fetch(assetUrl(`angio_index/${file}.md`))
    if (!res.ok) throw new Error(`無法載入 ${file}.md（${res.status}）`)
    const md = await res.text()
    const section = md.split(/##\s*教學筆記\s*\/\s*Pearls/)[1] ?? ''
    const bullets = section
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- '))
      .map((l) => l.slice(2).trim())

    bullets.forEach((raw, i) => {
      const text = stripMdBold(raw)
      const sourceMatch = text.match(/[（(]([^）)]*#?angio[^）)]*)[）)]\s*$/i)
      pearls.push({
        id: `${file}-p${i + 1}`,
        category: file,
        categoryLabel: categoryLabel(file),
        text,
        source: sourceMatch?.[1],
      })
    })
  }
  return pearls
}

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic)$/i
const VIDEO_EXT = /\.(mp4|mov|webm|m4v|avi)$/i

export function mediaKind(name: string): 'image' | 'video' | null {
  if (IMAGE_EXT.test(name)) return 'image'
  if (VIDEO_EXT.test(name)) return 'video'
  return null
}

interface Manifest {
  cases: Record<string, { folder: string; files: string[] }>
  captions?: Record<string, string>
}

export async function loadManifestMedia(): Promise<MediaItem[]> {
  const res = await fetch(assetUrl('media/manifest.json'))
  if (!res.ok) return []
  const manifest = (await res.json()) as Manifest
  const items: MediaItem[] = []
  for (const [caseId, entry] of Object.entries(manifest.cases ?? {})) {
    for (const file of entry.files ?? []) {
      const kind = mediaKind(file)
      if (!kind) continue
      items.push({
        id: `${caseId}:${file}`,
        caseId,
        name: file,
        url: assetUrl(`media/${entry.folder}/${encodeURIComponent(file)}`),
        kind,
        caption: manifest.captions?.[`${entry.folder}/${file}`],
      })
    }
  }
  return items
}

export function caseSearchBlob(c: CaseRecord) {
  return [
    c.date,
    c.mrn,
    c.patient,
    c.diagnosis,
    c.treatment,
    c.devices,
    c.outcome,
    c.sourceNote,
    ...c.categories,
  ]
    .join(' ')
    .toLowerCase()
}

export async function loadNotes(): Promise<NoteText[]> {
  const res = await fetch(assetUrl('angio_index/notes.json'))
  if (!res.ok) return []
  return (await res.json()) as NoteText[]
}
