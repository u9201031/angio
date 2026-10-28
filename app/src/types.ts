export type CategoryId =
  | '01_aneurysm'
  | '02_stroke_thrombectomy'
  | '03_stenosis_ICAD_carotid'
  | '04_dAVF_CCF'
  | '05_MMA_embolization'
  | '06_pediatric'
  | '07_unclassified_general'
  | '08_AVM'
  | '09_tumor'

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
  date?: string
  key?: string
  near?: { d: string; delta: number; case?: string; mrn?: string; label: string }[]
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

export type DiseaseId = 'aneurysm' | 'davf' | 'avm' | 'tumor' | 'stroke' | 'stenosis' | 'ia' | 'stenting' | 'mma' | 'other'
export interface SuppRef { id?: string; key?: string; group: 'MRN' | 'same' | 'near'; label: string; delta: number | null }
export interface Case2 {
  stack?: Record<string, string[] | string>; loc?: string; ap2?: string
  id: string; kind: 'pdf' | 'note'; disease: DiseaseId; category: CategoryId
  date: string; mrn: string; dx: string; impression: string; treatment: string
  modality: string[]; devices: string[]; approach: string[]; flags: string[]
  text: string; pages: number; outcome?: string
  merged: { id: string; date: string; mrn: string; mrnRaw: string; dx: string; tx: string; devices: string; outcome: string }[]
  supp: { notes: SuppRef[]; images: SuppRef[] }
  links: { id: string; label: string }[]
  plist: number[]
}
