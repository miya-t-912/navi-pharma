import { Store } from '@/types'

// 初期サンプル店舗データ（管理画面から編集可能）
// 令和8年度改定ベース（2026年6月1日施行）
export const DEFAULT_STORES: Store[] = [
  {
    id: 'store-1',
    name: '○○薬局 本店',
    settings: [
      // ── 調剤基本料系 ──
      { additionId: 'kihon-1', isEnabled: true, customPoints: 47 },
      { additionId: 'chiiiki-1', isEnabled: true, customPoints: 27 },
      { additionId: 'renkeikyo', isEnabled: true, customPoints: 5 },
      // ── 薬学管理系 ──
      { additionId: 'fukuyaku-kihon', isEnabled: true, customPoints: 45 },
      { additionId: 'fukuyaku-techo-nashi', isEnabled: true, customPoints: 59 },
      { additionId: 'chozai-kanri-tan', isEnabled: true, customPoints: 10 },
      { additionId: 'chozai-kanri-cho', isEnabled: true, customPoints: 60 },
      { additionId: 'fukuyaku-joho-teikyoryo', isEnabled: true, customPoints: 30 },
      // ── 残薬・有害事象 ──
      { additionId: 'zanzai-chosei', isEnabled: true, customPoints: 30 },
      { additionId: 'yugai-jiko-boshi', isEnabled: true, customPoints: 30 },
      // ── 特定業務系 ──
      { additionId: 'gairaifukuyaku-shien', isEnabled: true, customPoints: 185 },
      { additionId: 'fukuyaku-chosei-shien', isEnabled: true, customPoints: 125 },
      // ── 調剤技術系 ──
      { additionId: 'gairaifukuyaku-shien-2', isEnabled: true, customPoints: 34 },
      { additionId: 'warijokazan', isEnabled: true, customPoints: 4 },
      { additionId: 'enge-konnan', isEnabled: true, customPoints: 20 },
    ],
  },
]

export const getStoreById = (id: string): Store | undefined =>
  DEFAULT_STORES.find((s) => s.id === id)

export const getStorePoints = (store: Store, additionId: string): number | undefined => {
  const setting = store.settings.find((s) => s.additionId === additionId)
  return setting?.isEnabled ? setting.customPoints : undefined
}
