import { Addition } from '@/types'
import { ADDITIONS } from './additions'

// 令和8年度調剤報酬改定（2026年6月1日施行）ベース

// ─── 型定義 ──────────────────────────────────────────────────

export type KihonRyo =
  | 'kihon-1'
  | 'kihon-2'
  | 'kihon-3i'
  | 'kihon-3ro'
  | 'kihon-3ha'
  | 'tokubetsu-a'
  | 'tokubetsu-b'

export type ChiiikiKasan = '0' | '1' | '2' | '3' | '4' | '5'

// ─── 薬局設定（固定・localStorage 保存） ────────────────────────
// 全患者共通の薬局単位設定。変更は「薬局設定」から行う。

export interface PharmacySettings {
  kihonRyo: KihonRyo
  chiiikiKasan: ChiiikiKasan
  renkeiKyo: boolean           // 連携強化加算 届出あり
  biosimilarDelivered: boolean // バイオ後続品調剤体制加算 届出あり
  denshiRenkei: boolean        // 電子的調剤情報連携体制整備加算（電子処方箋+電子薬歴+マイナ保険証30%以上）
  yakkanKyujitsu: boolean      // 夜間・休日等加算 施設基準届出あり
}

export const DEFAULT_PHARMACY: PharmacySettings = {
  kihonRyo: 'kihon-1',
  chiiikiKasan: '1',
  renkeiKyo: true,
  biosimilarDelivered: false,
  denshiRenkei: false,
  yakkanKyujitsu: false,
}

export const PHARMACY_STORAGE_KEY = 'kaisan-navi-pharmacy-v1'

// ─── 患者条件（1患者ごとに入力） ────────────────────────────────

export interface PatientConditions {
  // 服薬管理指導料（条件の組み合わせで点数が決まる）
  techoAri: boolean      // お薬手帳を持参した
  sangatsuInai: boolean  // 前回調剤から3月以内（かつ同一薬局）
  // techoAri && sangatsuInai → 服薬管理指導料①（45点）
  // それ以外                → 服薬管理指導料②（59点）
  onlineShido: boolean   // オンライン服薬指導 → 服薬管理指導料③（59点）※①②と排他

  // 調剤物価対応料（3月1回・届出不要）
  bukkaToday: boolean          // 今回算定する（直近3ヶ月以内に同一患者への算定がない場合のみ可）

  // 処方内容（調剤管理料算定に使用）
  prescriptionDays: number    // 処方日数（0=内服薬なし）
  medicineCount: number       // 内服薬の剤数（最大3剤まで算定）

  // 服薬管理指導料 加算群
  mayakuOk: boolean           // 麻薬管理指導加算（麻薬処方あり）
  hairisuType: 'none' | 'new' | 'change'
  // none: ハイリスク薬なし
  // new:  ハイリスク薬 新規処方    → 特定薬剤管理指導加算1イ 10点
  // change: ハイリスク薬 用量変更等 → 特定薬剤管理指導加算1ロ 5点
  gaikagakuryoho: boolean     // 特定薬剤管理指導加算2（外来化学療法・月1回・100点）
  rmpShido: boolean           // 特定薬剤管理指導加算3イ（RMP資材使用・5点）
  tokutei3roType: 'none' | 'biosimilar' | 'shutsukachosei'
  // none:          3ロ対象外
  // biosimilar:    バイオ後続品選択説明    → 特定薬剤管理指導加算3ロ 10点
  // shutsukachosei: 出荷調整等による薬剤変更説明 → 特定薬剤管理指導加算3ロ 10点（令和8年度追加）
  nyuyoji: boolean            // 乳幼児服薬指導加算（6歳未満・12点）
  kyunyu: boolean             // 吸入薬管理指導加算（吸入薬使用患者・30点・3〜6月1回）

  // かかりつけ薬剤師加算（令和8年度新設）
  kakariFollowup: boolean     // かかりつけ薬剤師フォローアップ加算（50点・3月1回）
  kakariHoumon: boolean       // かかりつけ薬剤師訪問加算（230点・6月1回）

  // 技術加算
  ippozukaDays: number        // 外来服薬支援料2（一包化）日数（0=なし）
  warijoOk: boolean           // 自家製剤加算（割錠）4点/7日
  engeKonnan: boolean         // 自家製剤加算（嚥下困難・粉砕等）20点/7日

  // 照会・処方変更対応
  jofukuResult: 'none' | 'changed' | 'zanzai'
  // none:    照会なし
  // zanzai:  残薬照会 → 7日分以上日数変更   → 調剤時残薬調整加算 30点（在宅/かかりつけ50点）
  // changed: 処方内容照会 → 処方変更あり     → 薬学的有害事象等防止加算 30点（在宅/かかりつけ50点）
  isZaitakuPatient: boolean   // 在宅患者またはかかりつけ薬剤師担当患者（50点加算）

  // その他対応
  serviceShien: boolean       // 外来服薬支援料1（服薬困難支援・185点・月1回）
  infoProvision: boolean      // 服薬情報等提供料1（保険医療機関の求め・30点・月1回）
  infoProvision2: boolean     // 服薬情報等提供料2（薬剤師の判断・20点・月1回）
  infoProvision3: boolean     // 服薬情報等提供料3（入院前患者・保険医療機関の求め・50点・3月1回）
  genyakuOk: boolean          // 服用薬剤調整支援料1（6種類以上→2種類以上減薬・125点）

  // バイオ後続品（患者ごとに変動）
  biosimilarDispensed: boolean // 今回バイオ後続品（インスリン除く）を実際に調剤した（届出あり薬局のみ算定可）

  // 在宅薬学総合体制加算（在宅患者訪問薬剤管理指導料算定時のみ）
  zaitakuVisit: 'none' | 'taisei1' | 'taisei2i' | 'taisei2ro'
  // none:      在宅訪問なし（通常の来局処方箋受付）
  // taisei1:   体制加算1（30点）
  // taisei2i:  体制加算2イ（単一建物1人・100点）
  // taisei2ro: 体制加算2ロ（施設・複数人・50点）

  // 電子的調剤情報連携体制整備加算（月1回・届出あり薬局のみ）
  denshiRenkeiToday: boolean   // 今回算定する（月1回・当月初回来局時など）

  // 調剤ベースアップ評価料（処方箋1枚ごとに算定・届出あり薬局のみ）
  basupToday: boolean          // 調剤ベースアップ評価料（4点）を今回算定する

  // 令和8年度新設・高優先度加算
  shoniTokutei: boolean        // 小児特定加算（350点・月1回）- 医療的ケア児（18歳未満）
  chozaigoKanri: 'none' | 'diabetes' | 'heartfailure'
  // none:         調剤後薬剤管理指導料対象外
  // diabetes:     糖尿病患者（糖尿病用剤の新規処方/変更）→ 60点
  // heartfailure: 慢性心不全患者（心疾患による入院経験あり）→ 60点
  shisetsuRenkei: boolean      // 施設連携加算（50点・月1回）- 施設入所患者・施設職員と連携
  yakkanToday: boolean         // 夜間・休日等加算（40点）- 今回夜間・休日に受付した
}

export const DEFAULT_CONDITIONS: PatientConditions = {
  techoAri: true,
  sangatsuInai: true,
  onlineShido: false,
  bukkaToday: true,
  prescriptionDays: 14,
  medicineCount: 2,
  mayakuOk: false,
  hairisuType: 'none',
  gaikagakuryoho: false,
  rmpShido: false,
  tokutei3roType: 'none',
  nyuyoji: false,
  kyunyu: false,
  kakariFollowup: false,
  kakariHoumon: false,
  ippozukaDays: 0,
  warijoOk: false,
  engeKonnan: false,
  jofukuResult: 'none',
  isZaitakuPatient: false,
  serviceShien: false,
  infoProvision: false,
  infoProvision2: false,
  infoProvision3: false,
  genyakuOk: false,
  biosimilarDispensed: false,
  zaitakuVisit: 'none',
  denshiRenkeiToday: true,
  basupToday: true,
  shoniTokutei: false,
  chozaigoKanri: 'none',
  shisetsuRenkei: false,
  yakkanToday: false,
}

// ─── 結果型 ──────────────────────────────────────────────────

export interface ClaimableAddition {
  addition: Addition
  points: number
  note?: string
}

export interface NonClaimableAddition {
  addition: Addition
  reason: string
}

export interface EvaluationResult {
  canClaim: ClaimableAddition[]
  cannotClaim: NonClaimableAddition[]
  totalPoints: number
}

// ─── ユーティリティ ───────────────────────────────────────────

function calcIppozukaPoints(days: number): number {
  if (days <= 0) return 0
  if (days >= 43) return 240
  return Math.ceil(days / 7) * 34
}

function findAddition(id: string): Addition {
  const a = ADDITIONS.find((a) => a.id === id)
  if (!a) throw new Error(`Addition not found: ${id}`)
  return a
}

// ─── 算定評価ロジック ─────────────────────────────────────────

export function evaluateConditions(
  pharmacy: PharmacySettings,
  cond: PatientConditions,
): EvaluationResult {
  const canClaim: ClaimableAddition[] = []
  const cannotClaim: NonClaimableAddition[] = []

  const isKihon1     = pharmacy.kihonRyo === 'kihon-1'
  const isTokubetsuB = pharmacy.kihonRyo === 'tokubetsu-b'
  const isTokubetsuA = pharmacy.kihonRyo === 'tokubetsu-a'

  // ═══════════════════════════════════════════════════════════
  // A. 調剤基本料
  // ═══════════════════════════════════════════════════════════
  {
    const kihon = findAddition(pharmacy.kihonRyo)
    canClaim.push({ addition: kihon, points: kihon.points })
  }

  // ═══════════════════════════════════════════════════════════
  // B. 地域支援・医薬品供給対応体制加算
  // ═══════════════════════════════════════════════════════════
  if (pharmacy.chiiikiKasan !== '0') {
    const kasanNum = parseInt(pharmacy.chiiikiKasan)
    const chiiiki  = findAddition(`chiiiki-${pharmacy.chiiikiKasan}`)

    if (isTokubetsuB) {
      cannotClaim.push({ addition: chiiiki, reason: '特別調剤基本料Bを算定する薬局は算定不可' })
    } else if ((kasanNum === 2 || kasanNum === 3) && !isKihon1) {
      cannotClaim.push({ addition: chiiiki, reason: '加算2・3は調剤基本料1の薬局のみ算定可（加算4または5を算定してください）' })
    } else if ((kasanNum === 4 || kasanNum === 5) && isKihon1) {
      cannotClaim.push({ addition: chiiiki, reason: '加算4・5は調剤基本料1以外の薬局のみ算定可（加算2または3を算定してください）' })
    } else if (isTokubetsuA) {
      const reduced = Math.floor(chiiiki.points * 0.1)
      canClaim.push({
        addition: chiiiki,
        points: reduced,
        note: `特別調剤基本料A算定薬局のため▲90%減算（${chiiiki.points}点×10%≒${reduced}点）`,
      })
    } else {
      canClaim.push({ addition: chiiiki, points: chiiiki.points })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // C. 連携強化加算
  // ═══════════════════════════════════════════════════════════
  {
    const renkei = findAddition('renkeikyo')
    if (isTokubetsuB) {
      cannotClaim.push({ addition: renkei, reason: '特別調剤基本料Bを算定する薬局は算定不可' })
    } else if (pharmacy.renkeiKyo) {
      const note = isTokubetsuA
        ? '⚠ 感染対策向上加算届出医療機関からの処方箋の場合は算定不可（特別調剤基本料A算定薬局）'
        : undefined
      canClaim.push({ addition: renkei, points: renkei.points, note })
    } else {
      cannotClaim.push({ addition: renkei, reason: '連携強化加算の施設基準届出なし（災害・感染症時の連携体制等が必要）' })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // D. 調剤ベースアップ評価料（処方箋ごとに算定・患者条件で制御）
  // ═══════════════════════════════════════════════════════════
  {
    const basup = findAddition('basup-hyoka')
    if (cond.basupToday) {
      canClaim.push({ addition: basup, points: basup.points })
    } else {
      cannotClaim.push({ addition: basup, reason: '今回算定しない（届出なし・または算定対象外）' })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // D2. 調剤物価対応料（3月1回・届出不要）
  // ═══════════════════════════════════════════════════════════
  {
    const bukka = findAddition('bukka-tairyo')
    if (cond.bukkaToday) {
      canClaim.push({
        addition: bukka,
        points: bukka.points,
        note: '3月1回・届出不要',
      })
    } else {
      cannotClaim.push({
        addition: bukka,
        reason: '今回算定しない（直近3ヶ月以内に同一患者への算定済）',
      })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // E. バイオ後続品調剤体制加算
  // ═══════════════════════════════════════════════════════════
  {
    const bio = findAddition('biosimilar-taisei')
    if (isTokubetsuB) {
      cannotClaim.push({ addition: bio, reason: '特別調剤基本料Bを算定する薬局は算定不可' })
    } else if (!pharmacy.biosimilarDelivered) {
      cannotClaim.push({
        addition: bio,
        reason: 'バイオ後続品調剤体制加算の施設基準届出なし（バイオ医薬品の保管・患者説明体制の整備が必要。後発品調剤割合とは別の要件）',
      })
    } else if (!cond.biosimilarDispensed) {
      cannotClaim.push({
        addition: bio,
        reason: '今回の処方でバイオ後続品（インスリン製剤を除く）を調剤していない（届出あり薬局でも、実際に調剤した場合のみ算定可）',
      })
    } else if (isTokubetsuA) {
      const reduced = Math.floor(bio.points * 0.1)
      canClaim.push({
        addition: bio,
        points: reduced,
        note: `特別調剤基本料A算定薬局のため▲90%減算（50点×10%≒${reduced}点）`,
      })
    } else {
      canClaim.push({ addition: bio, points: bio.points })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // E2. 電子的調剤情報連携体制整備加算（月1回・令和8年度新設）
  // ═══════════════════════════════════════════════════════════
  {
    const denshi = findAddition('denshi-renkei-taisei')
    if (isTokubetsuB) {
      cannotClaim.push({ addition: denshi, reason: '特別調剤基本料B算定薬局は算定不可' })
    } else if (!pharmacy.denshiRenkei) {
      cannotClaim.push({
        addition: denshi,
        reason: '要件未達（電子処方箋対応・電子薬歴導入・マイナ保険証利用率30%以上の3要件を全て満たす必要あり）',
      })
    } else if (!cond.denshiRenkeiToday) {
      cannotClaim.push({ addition: denshi, reason: '今月すでに算定済（月1回・当月初回来局時のみ算定可）' })
    } else {
      canClaim.push({
        addition: denshi,
        points: denshi.points,
        note: '月1回・電子処方箋＋電子薬歴＋マイナ保険証利用率30%以上の3要件を全て満たす',
      })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // D3. 夜間・休日等加算（施設基準届出あり・夜間休日受付時）
  // ═══════════════════════════════════════════════════════════
  {
    const yakkan = findAddition('yakkan-kyujitsu')
    if (!pharmacy.yakkanKyujitsu) {
      cannotClaim.push({ addition: yakkan, reason: '夜間・休日等加算の施設基準届出なし（夜間・休日等の受付体制整備が必要）' })
    } else if (!cond.yakkanToday) {
      cannotClaim.push({ addition: yakkan, reason: '今回の処方箋受付が夜間・休日等ではない（平日19時以降・土曜13時以降・日祝等が対象）' })
    } else {
      canClaim.push({ addition: yakkan, points: yakkan.points })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // F. 服薬管理指導料
  // ═══════════════════════════════════════════════════════════
  {
    const shido1 = findAddition('fukuyaku-kihon')
    const shido2 = findAddition('fukuyaku-techo-nashi')
    const shido4 = findAddition('fukuyaku-online-shido')

    if (cond.onlineShido) {
      // オンライン服薬指導 → 服薬管理指導料③（対面指導料①②は不可）
      cannotClaim.push({ addition: shido1, reason: 'オンライン服薬指導のため → 服薬管理指導料③（59点）を算定' })
      cannotClaim.push({ addition: shido2, reason: 'オンライン服薬指導のため → 服薬管理指導料③（59点）を算定' })
      canClaim.push({ addition: shido4, points: shido4.points, note: '情報通信機器を用いたオンライン服薬指導' })
    } else {
      const isShido1 = cond.techoAri && cond.sangatsuInai
      if (isShido1) {
        canClaim.push({ addition: shido1, points: shido1.points })
        cannotClaim.push({ addition: shido2, reason: '3月以内再調剤かつ手帳あり → 服薬管理指導料①（45点）を算定' })
      } else {
        cannotClaim.push({ addition: shido1, reason: `${!cond.techoAri ? '手帳なし' : '3月超または初回'}のため → 服薬管理指導料②（59点）を算定` })
        canClaim.push({ addition: shido2, points: shido2.points })
      }
      cannotClaim.push({ addition: shido4, reason: '対面服薬指導のため服薬管理指導料③（オンライン）は算定不可' })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // G. 調剤管理料
  // ═══════════════════════════════════════════════════════════
  if (!isTokubetsuB) {
    const tanki = findAddition('chozai-kanri-tan')
    const choki = findAddition('chozai-kanri-cho')
    if (cond.prescriptionDays === 0) {
      cannotClaim.push({ addition: tanki, reason: '内服薬の調剤なし' })
      cannotClaim.push({ addition: choki, reason: '内服薬の調剤なし' })
    } else if (cond.prescriptionDays < 28) {
      const count = Math.min(cond.medicineCount, 3)
      const total = count * tanki.points
      canClaim.push({ addition: tanki, points: total, note: `${count}剤×${tanki.points}点=${total}点` })
      cannotClaim.push({ addition: choki, reason: `${cond.prescriptionDays}日分 → 27日以下のため10点/剤を算定` })
    } else {
      const count = Math.min(cond.medicineCount, 3)
      const total = count * choki.points
      cannotClaim.push({ addition: tanki, reason: `${cond.prescriptionDays}日分 → 28日以上のため60点/剤を算定` })
      canClaim.push({ addition: choki, points: total, note: `${count}剤×${choki.points}点=${total}点` })
    }
  } else {
    cannotClaim.push({ addition: findAddition('chozai-kanri-tan'), reason: '特別調剤基本料B算定薬局は調剤管理料算定不可' })
    cannotClaim.push({ addition: findAddition('chozai-kanri-cho'), reason: '特別調剤基本料B算定薬局は調剤管理料算定不可' })
  }

  // ═══════════════════════════════════════════════════════════
  // H. 服薬管理指導料 加算群
  // ═══════════════════════════════════════════════════════════

  // 麻薬管理指導加算
  {
    const mayaku = findAddition('mayaku-shido')
    if (cond.mayakuOk) {
      canClaim.push({ addition: mayaku, points: mayaku.points })
    } else {
      cannotClaim.push({ addition: mayaku, reason: '麻薬処方なし（麻薬が処方されている患者のみ算定可）' })
    }
  }

  // 特定薬剤管理指導加算1（1イ・1ロ 相互排他）
  {
    const t1i  = findAddition('tokutei-1i')
    const t1ro = findAddition('tokutei-1ro')
    if (cond.hairisuType === 'new') {
      canClaim.push({ addition: t1i, points: t1i.points })
      cannotClaim.push({ addition: t1ro, reason: 'ハイリスク薬新規処方 → 加算1イ（10点）を算定（1イと1ロは同時算定不可）' })
    } else if (cond.hairisuType === 'change') {
      cannotClaim.push({ addition: t1i, reason: 'ハイリスク薬用量変更等 → 加算1ロ（5点）を算定（1イと1ロは同時算定不可）' })
      canClaim.push({ addition: t1ro, points: t1ro.points })
    } else {
      cannotClaim.push({ addition: t1i,  reason: 'ハイリスク薬の新規処方なし（ワーファリン・インスリン・抗てんかん薬等）' })
      cannotClaim.push({ addition: t1ro, reason: 'ハイリスク薬の用量変更・副作用発現等なし' })
    }
  }

  // 特定薬剤管理指導加算2（外来化学療法・月1回）
  {
    const t2 = findAddition('tokutei-2')
    if (cond.gaikagakuryoho) {
      canClaim.push({ addition: t2, points: t2.points, note: '月1回・外来化学療法患者への副作用確認・医師への情報提供' })
    } else {
      cannotClaim.push({ addition: t2, reason: '外来化学療法（抗悪性腫瘍薬等）を受けている患者でない' })
    }
  }

  // 特定薬剤管理指導加算3（3イ・3ロ 相互排他）
  {
    const t3i  = findAddition('tokutei-3i')
    const t3ro = findAddition('tokutei-3ro')
    const t3roEligible = cond.tokutei3roType !== 'none'
    const t3roNote = cond.tokutei3roType === 'shutsukachosei'
      ? '出荷調整等による薬剤変更説明（令和8年度追加）'
      : 'バイオ後続品選択説明'
    if (cond.rmpShido && t3roEligible) {
      cannotClaim.push({ addition: t3i,  reason: '3イと3ロは同時算定不可 → 高点数の3ロを算定' })
      canClaim.push({ addition: t3ro, points: t3ro.points, note: t3roNote })
    } else if (cond.rmpShido) {
      canClaim.push({ addition: t3i, points: t3i.points })
      cannotClaim.push({ addition: t3ro, reason: '3ロ対象外（バイオ後続品選択説明・出荷調整変更説明いずれもなし）' })
    } else if (t3roEligible) {
      cannotClaim.push({ addition: t3i,  reason: 'RMP資材使用（3イ）の対象外' })
      canClaim.push({ addition: t3ro, points: t3ro.points, note: t3roNote })
    } else {
      cannotClaim.push({ addition: t3i,  reason: 'RMP資材を使用した説明指導なし' })
      cannotClaim.push({ addition: t3ro, reason: 'バイオ後続品選択説明・出荷調整等による薬剤変更説明のいずれも実施なし' })
    }
  }

  // 乳幼児服薬指導加算
  {
    const nyu = findAddition('nyuyoji-fukuyaku')
    if (cond.nyuyoji) {
      canClaim.push({ addition: nyu, points: nyu.points })
    } else {
      cannotClaim.push({ addition: nyu, reason: '患者が6歳以上（6歳未満の乳幼児のみ算定可）' })
    }
  }

  // 小児特定加算（医療的ケア児・18歳未満・月1回）
  {
    const shoni = findAddition('shoni-tokutei')
    if (cond.shoniTokutei) {
      canClaim.push({ addition: shoni, points: shoni.points, note: '医療的ケア児（18歳未満）・月1回' })
    } else {
      cannotClaim.push({ addition: shoni, reason: '医療的ケアを必要とする18歳未満の患者でない（人工呼吸器装着・気管カニューレ等が条件）' })
    }
  }

  // 吸入薬管理指導加算
  {
    const kyu = findAddition('kyunyu-shido')
    if (cond.kyunyu) {
      canClaim.push({ addition: kyu, points: kyu.points, note: '3〜6月に1回・吸入手技確認指導・医師への情報提供' })
    } else {
      cannotClaim.push({ addition: kyu, reason: '吸入薬処方なし（喘息・COPD・インフルエンザ等の吸入薬使用患者に算定）' })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // H2. 調剤後薬剤管理指導料（地域支援体制加算届出薬局・月1回）
  // ═══════════════════════════════════════════════════════════
  {
    const kdDiabetes = findAddition('chozaigo-kanri-diabetes')
    const kdHeart    = findAddition('chozaigo-kanri-heart')
    const chiiikiOk  = pharmacy.chiiikiKasan !== '0'

    if (!chiiikiOk) {
      cannotClaim.push({ addition: kdDiabetes, reason: '地域支援・医薬品供給対応体制加算の届出なし（加算1以上が必要）' })
      cannotClaim.push({ addition: kdHeart,    reason: '地域支援・医薬品供給対応体制加算の届出なし（加算1以上が必要）' })
    } else if (cond.chozaigoKanri === 'diabetes') {
      canClaim.push({ addition: kdDiabetes, points: kdDiabetes.points, note: '糖尿病用剤の新規処方/変更・月1回' })
      cannotClaim.push({ addition: kdHeart, reason: '糖尿病患者として算定（同月に糖尿病・心不全両方は算定不可）' })
    } else if (cond.chozaigoKanri === 'heartfailure') {
      cannotClaim.push({ addition: kdDiabetes, reason: '慢性心不全患者として算定（同月に糖尿病・心不全両方は算定不可）' })
      canClaim.push({ addition: kdHeart, points: kdHeart.points, note: '慢性心不全患者（心疾患による入院経験あり）・月1回' })
    } else {
      cannotClaim.push({ addition: kdDiabetes, reason: '糖尿病患者でないまたは糖尿病用剤の新規処方/変更がない' })
      cannotClaim.push({ addition: kdHeart,    reason: '慢性心不全患者（心疾患による入院経験あり）でない' })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // I. かかりつけ薬剤師加算（令和8年度新設）
  // ═══════════════════════════════════════════════════════════
  {
    const followup = findAddition('kakari-followup')
    if (cond.kakariFollowup) {
      canClaim.push({ addition: followup, points: followup.points, note: '3月1回・令和8年度新設' })
    } else {
      cannotClaim.push({ addition: followup, reason: 'かかりつけ薬剤師担当患者でない・または前回算定から3月未満' })
    }
  }
  {
    const houmon = findAddition('kakari-houmon')
    if (cond.kakariHoumon) {
      if (cond.zaitakuVisit !== 'none') {
        cannotClaim.push({
          addition: houmon,
          reason: '在宅患者訪問薬剤管理指導料を算定している患者は算定不可（かかりつけ薬剤師訪問加算との排他）',
        })
      } else {
        canClaim.push({ addition: houmon, points: houmon.points, note: '6月1回・令和8年度新設・患家訪問・医師への情報提供' })
      }
    } else {
      cannotClaim.push({ addition: houmon, reason: 'かかりつけ薬剤師担当患者でない・または前回算定から6月未満' })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // J. 技術加算
  // ═══════════════════════════════════════════════════════════
  if (!isTokubetsuB) {
    // 外来服薬支援料2（一包化）
    const ippozuka = findAddition('gairaifukuyaku-shien-2')
    if (cond.ippozukaDays > 0) {
      const pts  = calcIppozukaPoints(cond.ippozukaDays)
      const note = cond.ippozukaDays >= 43
        ? `${cond.ippozukaDays}日分 → 上限240点`
        : `${cond.ippozukaDays}日分 → ${Math.ceil(cond.ippozukaDays / 7)}週×34点=${pts}点`
      canClaim.push({ addition: ippozuka, points: pts, note })
    } else {
      cannotClaim.push({ addition: ippozuka, reason: '一包化指示なし' })
    }

    // 施設連携加算（外来服薬支援料2の加算・月1回）
    const shisetsu = findAddition('shisetsu-renkei')
    if (cond.ippozukaDays > 0 && cond.shisetsuRenkei) {
      if (cond.zaitakuVisit !== 'none') {
        cannotClaim.push({ addition: shisetsu, reason: '在宅患者訪問薬剤管理指導料を算定している患者は対象外' })
      } else {
        canClaim.push({ addition: shisetsu, points: shisetsu.points, note: '施設入所患者・施設職員と連携した服薬管理支援（月1回）' })
      }
    } else if (cond.ippozukaDays > 0) {
      cannotClaim.push({ addition: shisetsu, reason: '施設入所患者への施設職員と連携した服薬管理支援なし' })
    } else {
      cannotClaim.push({ addition: shisetsu, reason: '外来服薬支援料2（一包化）を算定していない（施設連携加算は一包化の加算）' })
    }

    // 自家製剤加算（割錠）: 7日分につき4点
    const warijo = findAddition('warijokazan')
    if (cond.warijoOk) {
      if (cond.prescriptionDays > 0) {
        const weeks  = Math.ceil(cond.prescriptionDays / 7)
        const points = weeks * 4
        canClaim.push({
          addition: warijo,
          points,
          note: `${cond.prescriptionDays}日分 → ${weeks}週×4点=${points}点（割錠後規格品なし確認済）`,
        })
      } else {
        cannotClaim.push({ addition: warijo, reason: '内服薬の処方なし（割錠は内服薬処方が必要）' })
      }
    } else {
      cannotClaim.push({ addition: warijo, reason: '割錠指示なし、または割錠後規格品あり' })
    }

    // 自家製剤加算（嚥下困難・粉砕）: 7日分につき20点
    const enge = findAddition('enge-konnan')
    if (cond.engeKonnan) {
      if (cond.prescriptionDays > 0) {
        const weeks  = Math.ceil(cond.prescriptionDays / 7)
        const points = weeks * 20
        canClaim.push({
          addition: enge,
          points,
          note: `${cond.prescriptionDays}日分 → ${weeks}週×20点=${points}点`,
        })
      } else {
        cannotClaim.push({ addition: enge, reason: '内服薬の処方なし（嚥下困難者用製剤は内服薬処方が必要）' })
      }
    } else {
      cannotClaim.push({ addition: enge, reason: '嚥下困難者用製剤（粉砕・懸濁等）の指示なし' })
    }
  } else {
    cannotClaim.push({ addition: findAddition('gairaifukuyaku-shien-2'), reason: '特別調剤基本料B算定薬局は算定不可' })
    cannotClaim.push({ addition: findAddition('warijokazan'),            reason: '特別調剤基本料B算定薬局は算定不可' })
    cannotClaim.push({ addition: findAddition('enge-konnan'),            reason: '特別調剤基本料B算定薬局は算定不可' })
  }

  // ═══════════════════════════════════════════════════════════
  // K. 照会・処方変更対応
  // ═══════════════════════════════════════════════════════════
  {
    const zanzai = findAddition('zanzai-chosei')
    const yugai  = findAddition('yugai-jiko-boshi')
    // 在宅患者またはかかりつけ薬剤師担当患者は50点（それ以外は30点）
    const pts50  = cond.isZaitakuPatient
    const note50 = pts50 ? '在宅患者/かかりつけ薬剤師担当患者のため50点' : undefined

    if (cond.jofukuResult === 'zanzai') {
      canClaim.push({ addition: zanzai, points: pts50 ? 50 : 30, note: note50 })
      cannotClaim.push({ addition: yugai, reason: '残薬調整照会の場合 → 調剤時残薬調整加算を算定' })
    } else if (cond.jofukuResult === 'changed') {
      cannotClaim.push({ addition: zanzai, reason: '処方内容照会（残薬調整以外）の場合 → 薬学的有害事象等防止加算を算定' })
      canClaim.push({ addition: yugai, points: pts50 ? 50 : 30, note: note50 })
    } else {
      cannotClaim.push({ addition: zanzai, reason: '処方医への照会なし（残薬照会→7日分以上日数変更が条件）' })
      cannotClaim.push({ addition: yugai,  reason: '処方医への照会なし（照会→処方変更が条件）' })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // K2. 在宅薬学総合体制加算（在宅患者訪問薬剤管理指導料算定時）
  // ═══════════════════════════════════════════════════════════
  {
    const zt1   = findAddition('zaitaku-taisei-1')
    const zt2i  = findAddition('zaitaku-taisei-2i')
    const zt2ro = findAddition('zaitaku-taisei-2ro')

    if (cond.zaitakuVisit === 'taisei1') {
      canClaim.push({ addition: zt1,   points: zt1.points,   note: '在宅訪問算定時・体制加算1（在宅訪問指導料等の算定実績 直近1年48回以上が必要）' })
      cannotClaim.push({ addition: zt2i,  reason: '体制加算1を算定（加算2イの高実績要件なし）' })
      cannotClaim.push({ addition: zt2ro, reason: '体制加算1を算定（加算2ロの高実績要件なし）' })
    } else if (cond.zaitakuVisit === 'taisei2i') {
      cannotClaim.push({ addition: zt1,   reason: '体制加算2イを算定（加算1と加算2は同時算定不可）' })
      canClaim.push({ addition: zt2i,  points: zt2i.points,  note: '単一建物診療患者1人・令和8年度新設' })
      cannotClaim.push({ addition: zt2ro, reason: '体制加算2イを算定中（2イと2ロは同時算定不可）' })
    } else if (cond.zaitakuVisit === 'taisei2ro') {
      cannotClaim.push({ addition: zt1,   reason: '体制加算2ロを算定（加算1と加算2は同時算定不可）' })
      cannotClaim.push({ addition: zt2i,  reason: '体制加算2ロを算定中（2イと2ロは同時算定不可）' })
      canClaim.push({ addition: zt2ro, points: zt2ro.points, note: '単一建物複数人または施設・令和8年度新設' })
    } else {
      cannotClaim.push({ addition: zt1,   reason: '在宅患者訪問薬剤管理指導料を今回算定しない（在宅訪問時のみ加算可）' })
      cannotClaim.push({ addition: zt2i,  reason: '在宅患者訪問薬剤管理指導料を今回算定しない（在宅訪問時のみ加算可）' })
      cannotClaim.push({ addition: zt2ro, reason: '在宅患者訪問薬剤管理指導料を今回算定しない（在宅訪問時のみ加算可）' })
    }
  }

  // ═══════════════════════════════════════════════════════════
  // L. その他対応
  // ═══════════════════════════════════════════════════════════

  // 外来服薬支援料1 と 服用薬剤調整支援料1 は同月算定不可
  {
    const gairaishien = findAddition('gairaifukuyaku-shien')
    const genyaku     = findAddition('fukuyaku-chosei-shien')

    if (cond.serviceShien && cond.genyakuOk && !isTokubetsuB) {
      // 両方チェック → 高点数の外来服薬支援料1（185点）を優先
      canClaim.push({
        addition: gairaishien,
        points: gairaishien.points,
        note: '服用薬剤調整支援料1と同月算定不可 → 高点数の外来服薬支援料1（185点）を算定',
      })
      cannotClaim.push({ addition: genyaku, reason: '外来服薬支援料1と同月は算定不可（高点数の外来服薬支援料1を算定）' })
    } else {
      if (cond.serviceShien) {
        canClaim.push({ addition: gairaishien, points: gairaishien.points })
      } else {
        cannotClaim.push({ addition: gairaishien, reason: '服薬困難患者への支援（残薬整理・服薬管理支援等）を行っていない' })
      }
      if (isTokubetsuB) {
        cannotClaim.push({ addition: genyaku, reason: '特別調剤基本料B算定薬局は算定不可' })
      } else if (cond.genyakuOk) {
        canClaim.push({ addition: genyaku, points: genyaku.points })
      } else {
        cannotClaim.push({ addition: genyaku, reason: '内服薬6種類以上→2種類以上の減薬（文書提案・変更済）なし' })
      }
    }
  }

  // 服用薬剤調整支援料2: 令和8年度改定で旧定義（100点・重複投薬情報提供→処方変更）は廃止。
  // 新定義（かかりつけ薬剤師による服用薬剤総合評価・1,000点）は令和9年6月1日から施行予定。
  // 令和8年度（2026年6月〜2027年5月）は算定対象外のため実装なし。

  // 服薬情報等提供料1・2（同月算定不可 → 両方チェック時は高点数の料1を優先）
  {
    const joho  = findAddition('fukuyaku-joho-teikyoryo')
    const joho2 = findAddition('fukuyaku-joho-teikyoryo-2')
    if (cond.infoProvision && cond.infoProvision2) {
      canClaim.push({ addition: joho, points: joho.points, note: '料1と料2の同月算定不可 → 高点数の料1を算定' })
      cannotClaim.push({ addition: joho2, reason: '服薬情報等提供料1と同月は算定不可（料1を算定）' })
    } else if (cond.infoProvision) {
      canClaim.push({ addition: joho, points: joho.points })
      cannotClaim.push({ addition: joho2, reason: '薬剤師の判断による服薬情報の文書提供なし' })
    } else if (cond.infoProvision2) {
      cannotClaim.push({ addition: joho, reason: '保険医療機関からの求めによる文書情報提供なし' })
      canClaim.push({ addition: joho2, points: joho2.points, note: '薬剤師の判断による情報提供（月1回）' })
    } else {
      cannotClaim.push({ addition: joho,  reason: '保険医療機関からの求めによる文書情報提供なし' })
      cannotClaim.push({ addition: joho2, reason: '薬剤師の判断による服薬情報の文書提供なし' })
    }
  }

  // 服薬情報等提供料3（入院前患者・3月1回）
  {
    const joho3 = findAddition('fukuyaku-joho-teikyoryo-3')
    if (cond.infoProvision3) {
      canClaim.push({ addition: joho3, points: joho3.points, note: '入院前患者への情報提供（3月1回・料1/2とは独立）' })
    } else {
      cannotClaim.push({ addition: joho3, reason: '入院予定患者への服薬情報文書提供なし（保険医療機関からの求め・3月1回）' })
    }
  }

  const totalPoints = canClaim.reduce((sum, r) => sum + r.points, 0)
  return { canClaim, cannotClaim, totalPoints }
}

// ─── 選択肢データ ─────────────────────────────────────────────

export const KIHON_RYO_OPTIONS: {
  value: KihonRyo; label: string; points: number; cond: string
}[] = [
  { value: 'kihon-1',     label: '調剤基本料1',      points: 47, cond: '集中率低・大規模グループ非該当（一般的な薬局）' },
  { value: 'kihon-2',     label: '調剤基本料2',      points: 30, cond: '集中率85%超かつ月1,800回超、または月4,000回超など（門前薬局等）' },
  { value: 'kihon-3i',    label: '調剤基本料3イ',    points: 25, cond: '同一グループ月3.5万〜40万回かつ集中率85%超（中規模チェーン）' },
  { value: 'kihon-3ro',   label: '調剤基本料3ロ',    points: 20, cond: '同一グループ月40万回超かつ集中率85%超（大規模チェーン門前）' },
  { value: 'kihon-3ha',   label: '調剤基本料3ハ',    points: 37, cond: '同一グループ月40万回超かつ集中率85%以下（大規模チェーン面分業）' },
  { value: 'tokubetsu-a', label: '特別調剤基本料A',  points:  5, cond: '医療機関と同一敷地内・不動産取引等の特別な関係（地域支援加算▲90%）' },
  { value: 'tokubetsu-b', label: '特別調剤基本料B',  points:  3, cond: '施設基準届出なし等（調剤管理料・連携強化加算等が算定不可）' },
]

export const CHIIIKI_OPTIONS_KIHON1: {
  value: ChiiikiKasan; label: string; points: number; cond: string
}[] = [
  { value: '0', label: '届出なし',       points:  0, cond: '' },
  { value: '1', label: '加算1',          points: 27, cond: '後発品85%以上・医薬品安定供給体制（1,200品目備蓄等）・在宅24回以上 等' },
  { value: '2', label: '加算2',          points: 59, cond: '加算1要件 ＋ 実績9項目のうち④かかりつけを含む3項目以上' },
  { value: '3', label: '加算3（最高）',   points: 67, cond: '加算1要件 ＋ 実績9項目のうち7項目以上（夜間400回・麻薬10回・かかりつけ40回 等）' },
]

export const CHIIIKI_OPTIONS_OTHER: {
  value: ChiiikiKasan; label: string; points: number; cond: string
}[] = [
  { value: '0', label: '届出なし',       points:  0, cond: '' },
  { value: '1', label: '加算1',          points: 27, cond: '後発品85%以上・医薬品安定供給体制（1,200品目備蓄等）・在宅24回以上 等' },
  { value: '4', label: '加算4',          points: 37, cond: '加算1要件 ＋ 実績9項目のうち④かかりつけ＋⑥在宅を含む3項目以上' },
  { value: '5', label: '加算5（最高）',   points: 59, cond: '加算1要件 ＋ 実績9項目のうち7項目以上' },
]

