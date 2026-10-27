export type CategoryId =
  | '01_aneurysm'
  | '02_stroke_thrombectomy'
  | '03_stenosis_ICAD_carotid'
  | '04_dAVF_CCF'
  | '05_MMA_embolization'
  | '06_pediatric'
  | '07_unclassified_general'

export interface CaseRecord {
  id: string
  date: string
  mrn: string
  patient: string
  diagnosis: string
  treatment: string
  devices: string
  outcome: string
  sourceNote: string
  categories: CategoryId[]
}

export interface Pearl {
  id: string
  category: CategoryId
  categoryLabel: string
  text: string
  source?: string
}

export interface MediaItem {
  id: string
  caseId: string
  name: string
  url: string
  kind: 'image' | 'video'
  ephemeral?: boolean
  caption?: string
}

export type ViewTab = 'cases' | 'pearls' | 'media' | 'plist'

export interface NoteText {
  id: string
  title: string
  date: string
  case: string | null
  category: CategoryId
  text: string
}
