import type { ComponentType } from 'react'

// ─── カテゴリ ────────────────────────────────────────────────
export type CategoryId = 'kihon' | 'yakugaku' | 'generic' | 'tokutei' | 'gijutsu' | 'other'

export interface Category {
  id: CategoryId
  name: string
  color: string        // Tailwind text color class
  bgColor: string      // Tailwind bg color class
  borderColor: string  // Tailwind border color class
  hex: string          // 実際のHEXカラー（アイコン等に使用）
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  sortOrder: number
}

// ─── 算定要件の条件定義（動的チェック用）───────────────────────
export interface ConditionField {
  id: string
  label: string
  type: 'radio' | 'select' | 'number' | 'checkbox'
  options?: { value: string; label: string }[]
  required: boolean
  hint?: string
}

export interface ConditionRule {
  fieldId: string
  operator: 'eq' | 'gte' | 'lte' | 'neq' | 'in'
  value: string | number | string[]
}

export interface AdditionConditions {
  fields: ConditionField[]
  rules: ConditionRule[]   // AND条件で評価
  explanation?: string     // 算定不可時の説明文
}

// ─── 加算マスタ ─────────────────────────────────────────────
export interface ReceiptComment {
  code: string
  description: string
  example: string
}

export interface Addition {
  id: string
  categoryId: CategoryId
  name: string
  points: number
  description: string          // 正式な説明
  plainDescription: string     // かみ砕き説明
  requirements: string[]       // 算定要件の箇条書き
  conditions?: AdditionConditions  // 動的チェック条件
  notes?: string[]             // 注意事項
  receiptComments?: ReceiptComment[]
  effectiveDate: string        // 例: '2026-06-01'
  tags?: string[]              // 検索用タグ
}

// ─── 店舗設定 ────────────────────────────────────────────────
export interface StoreSetting {
  additionId: string
  isEnabled: boolean
  customPoints?: number       // 店舗独自の点数（基本は加算マスタの点数）
}

export interface Store {
  id: string
  name: string
  settings: StoreSetting[]
}

// ─── 公費 ────────────────────────────────────────────────────
export type Region = 'national' | 'hyogo' | 'osaka'

export interface PublicExpense {
  id: string
  region: Region
  code: string
  name: string
  targetPerson: string
  copaymentRate: string
  copaymentLimit?: string
  dispensingNotes: string      // 調剤での取扱い
  caution: string[]            // 注意事項
  adminMemo?: string           // 管理者メモ
  updatedAt: string
}

// ─── レセプトコメント単体マスタ ──────────────────────────────
export interface CommentMaster {
  id: string
  code: string
  description: string
  example: string
  additionIds?: string[]       // 関連する加算ID
  tags?: string[]
}

// ─── 薬価マスタ ─────────────────────────────────────────────
export interface DrugMaster {
  id: string
  genericName: string
  brandName: string
  dosageForm: string
  strengthMg: number
  unit: string
  updatedAt: string
}

// ─── 割錠チェック結果 ────────────────────────────────────────
export interface TabletSplitResult {
  canClaim: boolean
  targetStrengthMg: number
  existingDrugs: DrugMaster[]
  reasonText: string
  commentExample?: string
}

// ─── FAQ / マニュアル ────────────────────────────────────────
export type KnowledgeType = 'faq' | 'manual'

export interface KnowledgeItem {
  id: string
  type: KnowledgeType
  category: string
  question: string
  answer: string
  sortOrder: number
  isGlobal: boolean
  storeId?: string
}

// ─── 更新履歴 ────────────────────────────────────────────────
export interface UpdateLog {
  id: string
  title: string
  description: string
  updatedBy: string
  createdAt: string
}

// ─── 算定チェック結果 ────────────────────────────────────────
export interface CheckResult {
  canClaim: Addition[]
  cannotClaim: { addition: Addition; reason: string }[]
  totalPoints: number
  storeId: string
  storeName: string
}
