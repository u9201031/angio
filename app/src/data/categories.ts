import type { CategoryId } from '../types'

export const CATEGORIES: { id: CategoryId; label: string; short: string }[] = [
  { id: '01_aneurysm', label: '腦動脈瘤 Aneurysm', short: '動脈瘤' },
  { id: '02_stroke_thrombectomy', label: '急性中風 / 取栓', short: '取栓' },
  { id: '03_stenosis_ICAD_carotid', label: '狹窄 ICAD / Carotid', short: '狹窄' },
  { id: '04_dAVF_CCF', label: 'dAVF / CCF', short: 'dAVF' },
  { id: '05_MMA_embolization', label: 'MMA embolization', short: 'MMA' },
  { id: '06_pediatric', label: '小兒 Pediatric', short: '小兒' },
  { id: '07_unclassified_general', label: '未分類 / 通用技術', short: '通用' },
]

export const categoryLabel = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id

export const categoryShort = (id: CategoryId) =>
  CATEGORIES.find((c) => c.id === id)?.short ?? id
