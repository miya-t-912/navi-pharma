import { DrugMaster } from '@/types'

// 主要な割錠対象薬の薬価マスタ（サンプル）
// 実際の薬価CSVから取込することを想定
export const DRUG_MASTER: DrugMaster[] = [
  // アムロジピン
  { id: 'd-001', genericName: 'アムロジピンベシル酸塩', brandName: 'アムロジン錠2.5mg', dosageForm: '錠', strengthMg: 2.5, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-002', genericName: 'アムロジピンベシル酸塩', brandName: 'アムロジン錠5mg', dosageForm: '錠', strengthMg: 5, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-003', genericName: 'アムロジピンベシル酸塩', brandName: 'アムロジン錠10mg', dosageForm: '錠', strengthMg: 10, unit: 'mg', updatedAt: '2026-06-01' },
  // エナラプリル
  { id: 'd-004', genericName: 'エナラプリルマレイン酸塩', brandName: 'レニベース錠2.5', dosageForm: '錠', strengthMg: 2.5, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-005', genericName: 'エナラプリルマレイン酸塩', brandName: 'レニベース錠5', dosageForm: '錠', strengthMg: 5, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-006', genericName: 'エナラプリルマレイン酸塩', brandName: 'レニベース錠10', dosageForm: '錠', strengthMg: 10, unit: 'mg', updatedAt: '2026-06-01' },
  // ワーファリン
  { id: 'd-007', genericName: 'ワルファリンカリウム', brandName: 'ワーファリン錠0.5mg', dosageForm: '錠', strengthMg: 0.5, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-008', genericName: 'ワルファリンカリウム', brandName: 'ワーファリン錠1mg', dosageForm: '錠', strengthMg: 1, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-009', genericName: 'ワルファリンカリウム', brandName: 'ワーファリン錠2mg', dosageForm: '錠', strengthMg: 2, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-010', genericName: 'ワルファリンカリウム', brandName: 'ワーファリン錠5mg', dosageForm: '錠', strengthMg: 5, unit: 'mg', updatedAt: '2026-06-01' },
  // レボチロキシン
  { id: 'd-011', genericName: 'レボチロキシンナトリウム水和物', brandName: 'チラーヂンS錠12.5μg', dosageForm: '錠', strengthMg: 0.0125, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-012', genericName: 'レボチロキシンナトリウム水和物', brandName: 'チラーヂンS錠25μg', dosageForm: '錠', strengthMg: 0.025, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-013', genericName: 'レボチロキシンナトリウム水和物', brandName: 'チラーヂンS錠50μg', dosageForm: '錠', strengthMg: 0.05, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-014', genericName: 'レボチロキシンナトリウム水和物', brandName: 'チラーヂンS錠100μg', dosageForm: '錠', strengthMg: 0.1, unit: 'mg', updatedAt: '2026-06-01' },
  // フロセミド
  { id: 'd-015', genericName: 'フロセミド', brandName: 'ラシックス錠10mg', dosageForm: '錠', strengthMg: 10, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-016', genericName: 'フロセミド', brandName: 'ラシックス錠20mg', dosageForm: '錠', strengthMg: 20, unit: 'mg', updatedAt: '2026-06-01' },
  { id: 'd-017', genericName: 'フロセミド', brandName: 'ラシックス錠40mg', dosageForm: '錠', strengthMg: 40, unit: 'mg', updatedAt: '2026-06-01' },
]

export const DRUG_MASTER_STORAGE_KEY = 'kaisan-navi-drug-master-v1'
export const DRUG_MASTER_META_KEY   = 'kaisan-navi-drug-master-meta'

// localStorage に保存されたカスタムマスタを返す（なければ null）
export function loadCustomMaster(): DrugMaster[] | null {
  if (typeof window === 'undefined') return null
  try {
    const s = localStorage.getItem(DRUG_MASTER_STORAGE_KEY)
    if (!s) return null
    const parsed = JSON.parse(s)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

// 成分名または品名にマッチする規格を返す（成分名+mg単位で重複排除）
export const searchDrugByName = (query: string, drugs: DrugMaster[] = DRUG_MASTER): DrugMaster[] => {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  const seen = new Set<string>()
  return drugs.filter((d) => {
    const matches =
      d.genericName.toLowerCase().includes(q) ||
      d.brandName.toLowerCase().includes(q)
    const key = `${d.genericName}_${d.strengthMg}`
    if (matches && !seen.has(key)) {
      seen.add(key)
      return true
    }
    return false
  })
}

// 割錠後のmg規格が存在するか
export const checkSplitStrengthExists = (
  genericName: string,
  afterSplitMg: number,
  drugs: DrugMaster[] = DRUG_MASTER,
): DrugMaster[] => {
  return drugs.filter(
    (d) =>
      d.genericName === genericName &&
      Math.abs(d.strengthMg - afterSplitMg) < 0.001
  )
}
