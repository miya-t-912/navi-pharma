'use client'

import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import {
  CheckCircle, XCircle, AlertCircle, Calculator, Copy, RotateCcw,
  Check, ChevronDown, ChevronUp, Settings2, Pill, Wrench, MessageSquareWarning, Home,
} from 'lucide-react'
import {
  PharmacySettings,
  PatientConditions,
  EvaluationResult,
  evaluateConditions,
  DEFAULT_PHARMACY,
  DEFAULT_CONDITIONS,
  PHARMACY_STORAGE_KEY,
  KIHON_RYO_OPTIONS,
  CHIIIKI_OPTIONS_KIHON1,
  CHIIIKI_OPTIONS_OTHER,
  KihonRyo,
  ChiiikiKasan,
} from '@/data/checkConditions'

// ─────────────────────────────────────────────────────────────
// 薬局基本点数の計算（collapsed 時サマリーに使用）
// ─────────────────────────────────────────────────────────────
function calcPharmacyBasePoints(p: PharmacySettings): number {
  const kihon = KIHON_RYO_OPTIONS.find((o) => o.value === p.kihonRyo)
  const chiiikiOpts = p.kihonRyo === 'kihon-1' ? CHIIIKI_OPTIONS_KIHON1 : CHIIIKI_OPTIONS_OTHER
  const chiiiki = chiiikiOpts.find((o) => o.value === p.chiiikiKasan)
  const isTokubetsuA = p.kihonRyo === 'tokubetsu-a'
  const isTokubetsuB = p.kihonRyo === 'tokubetsu-b'
  let total = kihon?.points ?? 0
  if (chiiiki && chiiiki.points > 0 && !isTokubetsuB) {
    total += isTokubetsuA ? Math.floor(chiiiki.points * 0.1) : chiiiki.points
  }
  if (p.renkeiKyo && !isTokubetsuB) total += 5
  if (p.biosimilarDelivered && !isTokubetsuB) {
    total += isTokubetsuA ? Math.floor(50 * 0.1) : 50
  }
  if (p.denshiRenkei && !isTokubetsuB) total += 8
  return total
}

function pharmacySummaryParts(p: PharmacySettings): string[] {
  const kihon = KIHON_RYO_OPTIONS.find((o) => o.value === p.kihonRyo)
  const chiiikiOpts = p.kihonRyo === 'kihon-1' ? CHIIIKI_OPTIONS_KIHON1 : CHIIIKI_OPTIONS_OTHER
  const chiiiki = chiiikiOpts.find((o) => o.value === p.chiiikiKasan)
  const parts: string[] = []
  if (kihon) parts.push(`${kihon.label} ${kihon.points}点`)
  if (chiiiki && chiiiki.points > 0) parts.push(`地域支援${chiiiki.label} ${chiiiki.points}点`)
  if (p.renkeiKyo) parts.push('連携強化 5点')
  if (p.biosimilarDelivered) parts.push('バイオ後続品 50点')
  if (p.denshiRenkei) parts.push('電子連携 8点')
  return parts
}

// ─────────────────────────────────────────────────────────────
// メインコンポーネント
// ─────────────────────────────────────────────────────────────
export default function CheckPage() {
  const [pharmacy,   setPharmacyState] = useState<PharmacySettings>(DEFAULT_PHARMACY)
  const [conditions, setConditions]    = useState<PatientConditions>(DEFAULT_CONDITIONS)
  const [result,     setResult]        = useState<EvaluationResult | null>(null)
  const [copied,     setCopied]        = useState(false)
  const [storeOpen,  setStoreOpen]     = useState(false)

  // localStorage から薬局設定を読み込む（型ガード付き）
  useEffect(() => {
    try {
      const s = localStorage.getItem(PHARMACY_STORAGE_KEY)
      if (s) {
        const parsed = JSON.parse(s)
        if (parsed && typeof parsed === 'object') {
          setPharmacyState((p) => ({ ...p, ...parsed }))
        }
      }
    } catch {}
  }, [])

  // 薬局設定を更新して localStorage に保存
  const setPharmacy = useCallback((updates: Partial<PharmacySettings>) => {
    setPharmacyState((prev) => {
      const next = { ...prev, ...updates }
      try { localStorage.setItem(PHARMACY_STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    setResult(null)
  }, [])

  // 調剤基本料変更時は地域支援加算を自動補正
  const setKihon = useCallback((value: KihonRyo) => {
    const isKihon1 = value === 'kihon-1'
    setPharmacyState((prev) => {
      const cur = prev.chiiikiKasan
      let newChiiiki = cur
      if (isKihon1 && (cur === '4' || cur === '5')) newChiiiki = '1'
      if (!isKihon1 && (cur === '2' || cur === '3')) newChiiiki = '1'
      if (value === 'tokubetsu-b') newChiiiki = '0'
      const next = { ...prev, kihonRyo: value, chiiikiKasan: newChiiiki }
      try { localStorage.setItem(PHARMACY_STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
    setResult(null)
  }, [])

  function set<K extends keyof PatientConditions>(key: K, value: PatientConditions[K]) {
    setConditions((c) => ({ ...c, [key]: value }))
    setResult(null)
  }

  function handleCheck() {
    flushSync(() => {
      setResult(evaluateConditions(pharmacy, conditions))
    })
    document.getElementById('check-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleReset() {
    setConditions(DEFAULT_CONDITIONS)
    setResult(null)
  }

  function handleCopy() {
    if (!result) return
    const lines = [
      '【算定チェック】令和8年度改定',
      '',
      '■ 算定可能',
      ...result.canClaim.map((r) => `  ${r.addition.name}　${r.points}点${r.note ? `（${r.note}）` : ''}`),
      '',
      `合計　${result.totalPoints}点`,
    ]
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  const isKihon1     = pharmacy.kihonRyo === 'kihon-1'
  const isTokubetsuB = pharmacy.kihonRyo === 'tokubetsu-b'
  const chiiikiOptions = isKihon1 ? CHIIIKI_OPTIONS_KIHON1 : CHIIIKI_OPTIONS_OTHER

  return (
    <div className="space-y-3 pb-24">
      <div className="hidden lg:block">
        <h2 className="text-xl font-bold text-slate-900">算定チェック</h2>
        <p className="text-sm text-slate-500 mt-0.5">令和8年度改定ベース。患者ごとの条件を入力して算定できる加算を確認します。</p>
      </div>

      {/* ══════════════════════════════════════════════════════
          薬局基本設定（固定・localStorage保存）
      ══════════════════════════════════════════════════════ */}
      <div className="bg-violet-50 border border-violet-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setStoreOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-violet-100 transition-colors"
        >
          <Settings2 size={15} className="text-violet-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">薬局基本設定</span>
              <span className="text-xs text-violet-500 bg-violet-200 px-1.5 py-0.5 rounded font-medium">固定</span>
              {!storeOpen && (
                <span className="text-sm font-bold text-violet-700 ml-auto mr-1 shrink-0">
                  基本 {calcPharmacyBasePoints(pharmacy)}点
                </span>
              )}
            </div>
            {!storeOpen && (
              <p className="text-xs text-violet-500 mt-0.5 truncate">
                {pharmacySummaryParts(pharmacy).join('　')}
              </p>
            )}
          </div>
          {storeOpen
            ? <ChevronUp size={14} className="text-violet-400 shrink-0" />
            : <ChevronDown size={14} className="text-violet-400 shrink-0" />}
        </button>

        {storeOpen && (
          <div className="divide-y divide-violet-100 border-t border-violet-200">

            {/* 初学者向け説明 */}
            <div className="px-4 py-3 bg-violet-100/60">
              <p className="text-xs text-violet-700 leading-relaxed">
                <span className="font-semibold">調剤基本料</span>とは、処方箋1枚を受け付けるたびに必ず算定する薬局の基本料金です。<br />
                薬局の規模・集中率によって区分が決まり、全患者に共通して適用されます。<br />
                <span className="font-semibold">地域支援加算・連携強化加算・届出加算</span>も薬局単位で固定されます。
              </p>
            </div>

            {/* 調剤基本料区分 */}
            <section className="p-4">
              <SectionLabel>調剤基本料区分</SectionLabel>
              <div className="space-y-1.5">
                {KIHON_RYO_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      pharmacy.kihonRyo === opt.value
                        ? 'border-violet-400 bg-violet-100'
                        : 'border-violet-200 bg-white hover:bg-violet-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="kihonRyo"
                      checked={pharmacy.kihonRyo === opt.value}
                      onChange={() => setKihon(opt.value)}
                      className="mt-0.5 accent-violet-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-semibold text-slate-800">{opt.label}</span>
                        <span className="text-sm font-bold text-violet-700 ml-auto shrink-0">{opt.points}点</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.cond}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 地域支援加算 */}
            <section className="p-4">
              <SectionLabel>地域支援・医薬品供給対応体制加算</SectionLabel>
              {isKihon1 ? (
                <p className="text-xs text-violet-600 mb-2 bg-violet-100 rounded px-2 py-1">調剤基本料1 → 加算1・2・3 が対象</p>
              ) : isTokubetsuB ? (
                <p className="text-xs text-red-500 mb-2 bg-red-50 rounded px-2 py-1">特別調剤基本料B → 地域支援加算は算定不可</p>
              ) : (
                <p className="text-xs text-violet-600 mb-2 bg-violet-100 rounded px-2 py-1">調剤基本料1以外 → 加算1・4・5 が対象</p>
              )}
              <div className="space-y-1.5">
                {chiiikiOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isTokubetsuB ? 'opacity-40 pointer-events-none border-violet-200 bg-white' :
                      pharmacy.chiiikiKasan === opt.value
                        ? 'border-violet-400 bg-violet-100'
                        : 'border-violet-200 bg-white hover:bg-violet-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="chiiikiKasan"
                      checked={pharmacy.chiiikiKasan === opt.value}
                      onChange={() => setPharmacy({ chiiikiKasan: opt.value as ChiiikiKasan })}
                      disabled={isTokubetsuB}
                      className="mt-0.5 accent-violet-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-800">{opt.label}</span>
                        {opt.points > 0 && (
                          <span className="text-sm font-bold text-violet-700 ml-auto shrink-0">{opt.points}点</span>
                        )}
                      </div>
                      {opt.cond && <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.cond}</div>}
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* 届出系チェック */}
            <section className="p-4">
              <SectionLabel>届出系加算（施設基準）</SectionLabel>
              <div className="space-y-2.5">
                <CheckboxRow
                  checked={pharmacy.renkeiKyo && !isTokubetsuB}
                  onChange={(v) => setPharmacy({ renkeiKyo: v })}
                  disabled={isTokubetsuB}
                  label="連携強化加算 届出あり（5点）"
                  sub="災害・感染症発生時の医療機関連携体制・協定締結済（特別調剤基本料A算定薬局は感染対策向上加算届出医療機関からの処方箋では算定不可）"
                />
                <CheckboxRow
                  checked={pharmacy.biosimilarDelivered}
                  onChange={(v) => setPharmacy({ biosimilarDelivered: v })}
                  disabled={isTokubetsuB}
                  label="バイオ後続品調剤体制加算 届出あり（50点）"
                  sub="バイオ医薬品の適切な保管・患者説明体制の整備・届出済（令和8年度新設）"
                />
                <CheckboxRow
                  checked={pharmacy.denshiRenkei}
                  onChange={(v) => setPharmacy({ denshiRenkei: v })}
                  disabled={isTokubetsuB}
                  label="電子的調剤情報連携体制整備加算（8点・月1回）"
                  sub="電子処方箋対応・電子薬歴導入・マイナ保険証利用率30%以上の3要件を全て満たす（令和8年度新設）"
                />
                <CheckboxRow
                  checked={pharmacy.yakkanKyujitsu}
                  onChange={(v) => setPharmacy({ yakkanKyujitsu: v })}
                  label="夜間・休日等加算 届出あり（40点）"
                  sub="夜間・休日等の受付体制を整備・届出済。今回の受付が夜間・休日の場合のみ患者条件で算定"
                />
              </div>
            </section>

          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          お薬手帳・受診間隔（患者ごとに変動）
      ══════════════════════════════════════════════════════ */}
      <Card>
        <SectionLabel icon={<Pill size={13} className="text-blue-500" />} color="blue">
          服薬管理指導料
        </SectionLabel>
        <p className="text-xs text-slate-500 mt-1 mb-3">
          処方箋1枚ごとに算定する服薬指導の基本料です。お薬手帳の有無と受診間隔によって点数が変わります。
        </p>

        <div className="space-y-2.5">
          {/* 手帳 */}
          <CheckboxRow
            checked={conditions.techoAri}
            onChange={(v) => set('techoAri', v)}
            label="お薬手帳を持参した"
            sub="手帳なし・初回交付の場合はチェックを外す"
          />

          {/* 3月以内 */}
          <CheckboxRow
            checked={conditions.sangatsuInai}
            onChange={(v) => set('sangatsuInai', v)}
            label="前回の調剤から3月（90日）以内"
            sub="初回来局・3月超の場合はチェックを外す"
          />

          {/* オンライン服薬指導 */}
          <CheckboxRow
            checked={conditions.onlineShido}
            onChange={(v) => set('onlineShido', v)}
            label="オンライン服薬指導（服薬管理指導料③・59点）"
            sub="ビデオ通話等の情報通信機器を用いた服薬指導。対面①②とは排他"
          />
        </div>

        {/* 判定結果バッジ */}
        <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${
          conditions.onlineShido
            ? 'bg-indigo-50 border border-indigo-200'
            : conditions.techoAri && conditions.sangatsuInai
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-slate-50 border border-slate-200'
        }`}>
          <span className="text-xs text-slate-500">算定:</span>
          {conditions.onlineShido ? (
            <span className="text-sm font-bold text-indigo-700">服薬管理指導料③（オンライン）　59点</span>
          ) : conditions.techoAri && conditions.sangatsuInai ? (
            <span className="text-sm font-bold text-blue-700">服薬管理指導料①　45点</span>
          ) : (
            <>
              <span className="text-sm font-bold text-slate-700">服薬管理指導料②　59点</span>
              <span className="text-xs text-slate-400">
                （{!conditions.techoAri ? '手帳なし' : '3月超/初回'}）
              </span>
            </>
          )}
        </div>

        {/* 調剤ベースアップ評価料 */}
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="text-xs font-semibold text-slate-500 mb-1.5">調剤ベースアップ評価料（処方箋1枚ごと）</div>
          <CheckboxRow
            checked={conditions.basupToday}
            onChange={(v) => set('basupToday', v)}
            label="今回算定する（4点）"
            sub="届出あり薬局は処方箋1枚ごとに算定。届出なし・算定対象外の場合はチェックを外す"
          />
        </div>

        {/* 調剤物価対応料 */}
        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="text-xs font-semibold text-slate-500 mb-1.5">調剤物価対応料（3月1回・届出不要）</div>
          <CheckboxRow
            checked={conditions.bukkaToday}
            onChange={(v) => set('bukkaToday', v)}
            label="今回算定する（1点）"
            sub="直近3ヶ月以内に同一患者へ算定済みの場合はチェックを外す"
          />
        </div>

        {pharmacy.denshiRenkei && !isTokubetsuB && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="text-xs font-semibold text-slate-500 mb-1.5">電子的調剤情報連携体制整備加算（月1回・届出あり薬局）</div>
            <CheckboxRow
              checked={conditions.denshiRenkeiToday}
              onChange={(v) => set('denshiRenkeiToday', v)}
              label="今回算定する（8点）"
              sub="当月初回来局など、今月この患者にまだ算定していない場合のみ算定可"
            />
          </div>
        )}

        {pharmacy.yakkanKyujitsu && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="text-xs font-semibold text-slate-500 mb-1.5">夜間・休日等加算（届出あり薬局）</div>
            <CheckboxRow
              checked={conditions.yakkanToday}
              onChange={(v) => set('yakkanToday', v)}
              label="今回の処方箋受付が夜間・休日等（40点）"
              sub="平日19時以降・土曜13時以降・日曜・祝日等に受け付けた処方箋"
            />
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">
          ※令和8年度: かかりつけ薬剤師指導料は廃止。担当薬剤師でも同点数になりました（76点→59点）
        </p>
      </Card>

      {/* ══════════════════════════════════════════════════════
          管理加算
      ══════════════════════════════════════════════════════ */}
      <Card>
        <SectionLabel icon={<Pill size={13} className="text-teal-500" />} color="teal">
          管理加算
        </SectionLabel>
        <p className="text-xs text-slate-500 mt-1 mb-1">
          処方内容の確認・管理、患者への服薬指導に対して算定できる加算点数です。患者の状況によって算定できる項目が変わります。
        </p>

        {/* 処方内容（調剤管理料） */}
        <div className="mt-3 space-y-3">
          <SubLabel>処方内容 → 調剤管理料</SubLabel>
          <p className="text-xs text-slate-400 mb-2">
            内服薬の処方日数・剤数から調剤管理料が自動計算されます。
          </p>
          <StepperRow
            label="処方日数"
            sub={`調剤管理料: ${
              conditions.prescriptionDays === 0 ? '内服薬なし（算定不可）'
              : conditions.prescriptionDays < 28 ? '27日以下 → 10点/剤'
              : '28日以上 → 60点/剤'
            }`}
            value={conditions.prescriptionDays === 0 ? 'なし' : `${conditions.prescriptionDays}日`}
            onMinus={() => set('prescriptionDays', Math.max(0, conditions.prescriptionDays - 7))}
            onPlus={() => set('prescriptionDays', conditions.prescriptionDays === 0 ? 7 : Math.min(90, conditions.prescriptionDays + 7))}
            disabled={isTokubetsuB}
          />
          <StepperRow
            label="内服薬の剤数"
            sub="調剤管理料は1剤ごとに算定（最大3剤）"
            value={`${conditions.medicineCount}剤`}
            onMinus={() => set('medicineCount', Math.max(0, conditions.medicineCount - 1))}
            onPlus={() => set('medicineCount', Math.min(10, conditions.medicineCount + 1))}
            disabled={isTokubetsuB}
          />
        </div>

        <div className="border-t border-slate-100 mt-4 pt-4 space-y-2.5">
          <SubLabel>服薬管理指導料 加算</SubLabel>

          <CheckboxRow
            checked={conditions.mayakuOk}
            onChange={(v) => set('mayakuOk', v)}
            label="麻薬管理指導加算（22点）"
            sub="麻薬（オピオイド系鎮痛薬等）が処方。服用・保管・副作用を確認指導"
          />

          {/* ハイリスク薬 特定薬剤管理指導加算1 */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1.5">
              特定薬剤管理指導加算1（ハイリスク薬）
              <span className="text-slate-400 font-normal ml-1">—  1イ・1ロは同時算定不可</span>
            </div>
            <div className="space-y-1">
              {([
                { value: 'none',   label: 'ハイリスク薬なし', sub: '' },
                { value: 'new',    label: '新規処方あり → 加算1イ（10点）', sub: 'ワーファリン・インスリン・抗てんかん薬・免疫抑制薬 等' },
                { value: 'change', label: '用量変更等あり → 加算1ロ（5点）', sub: '用法用量の変更・副作用発現状況の変化' },
              ] as const).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors min-h-[44px] ${
                    conditions.hairisuType === opt.value
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="hairisuType"
                    checked={conditions.hairisuType === opt.value}
                    onChange={() => set('hairisuType', opt.value)}
                    className="mt-0.5 accent-orange-500 shrink-0"
                  />
                  <div>
                    <div className="text-sm text-slate-800">{opt.label}</div>
                    {opt.sub && <div className="text-xs text-slate-400 mt-0.5">{opt.sub}</div>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <CheckboxRow
            checked={conditions.gaikagakuryoho}
            onChange={(v) => set('gaikagakuryoho', v)}
            label="特定薬剤管理指導加算2（100点・月1回）"
            sub="外来化学療法（抗悪性腫瘍薬等）患者。副作用確認・継続フォロー・医師への情報提供"
          />

          {/* 特定薬剤管理指導加算3 */}
          <div>
            <div className="text-xs font-medium text-slate-600 mb-1.5">
              特定薬剤管理指導加算3
              <span className="text-slate-400 font-normal ml-1">— 3イ・3ロは同時算定不可</span>
            </div>
            <div className="space-y-1.5">
              <CheckboxRow
                checked={conditions.rmpShido}
                onChange={(v) => set('rmpShido', v)}
                label="3イ: RMP資材を使用した説明指導（5点）"
                sub="リスク管理計画（RMP）に基づく安全性資材を使い説明"
              />

              {/* 3ロ: バイオ後続品 OR 出荷調整 → ラジオ選択 */}
              <div>
                <div className="text-xs text-slate-500 mb-1.5 pl-0.5">
                  3ロ（10点）— バイオ後続品 または 出荷調整による薬剤変更
                </div>
                <div className="space-y-1">
                  {([
                    { value: 'none' as const, label: '3ロ 対象外', sub: '' },
                    { value: 'biosimilar' as const, label: 'バイオ後続品選択説明（10点）', sub: '先発バイオ→バイオシミラーへの変更等について調剤前に説明' },
                    { value: 'shutsukachosei' as const, label: '出荷調整等による薬剤変更説明（10点）', sub: '供給不足・在庫切れ等で代替薬へ変更する際の情報提供・説明（令和8年度追加）' },
                  ]).map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors min-h-[44px] ${
                        conditions.tokutei3roType === opt.value
                          ? 'border-teal-400 bg-teal-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tokutei3roType"
                        checked={conditions.tokutei3roType === opt.value}
                        onChange={() => set('tokutei3roType', opt.value)}
                        className="mt-0.5 accent-teal-500 shrink-0"
                      />
                      <div>
                        <div className="text-sm text-slate-800">{opt.label}</div>
                        {opt.sub && <div className="text-xs text-slate-400 mt-0.5">{opt.sub}</div>}
                      </div>
                    </label>
                  ))}
                </div>
                {conditions.rmpShido && conditions.tokutei3roType !== 'none' && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 mt-1.5">
                    ⚠ 3イと3ロは同時算定不可。高点数の3ロ（10点）が優先されます。
                  </p>
                )}
              </div>
            </div>
          </div>

          <CheckboxRow
            checked={conditions.nyuyoji}
            onChange={(v) => set('nyuyoji', v)}
            label="乳幼児服薬指導加算（12点）"
            sub="患者が6歳未満。薬の飲ませ方・保管方法等を保護者に指導"
          />
          <CheckboxRow
            checked={conditions.kyunyu}
            onChange={(v) => set('kyunyu', v)}
            label="吸入薬管理指導加算（30点・3〜6月1回）"
            sub="喘息・COPD・インフルエンザ等の吸入薬使用患者。吸入手技確認・指導・医師へ情報提供"
          />
          <CheckboxRow
            checked={conditions.shoniTokutei}
            onChange={(v) => set('shoniTokutei', v)}
            label="小児特定加算（350点・月1回）"
            sub="18歳未満の医療的ケア児（人工呼吸器装着・気管カニューレ・経鼻経管栄養等）への服薬指導。乳幼児服薬指導加算と同時算定可"
          />
        </div>

        {/* 調剤後薬剤管理指導料（地域支援体制加算届出薬局のみ） */}
        {pharmacy.chiiikiKasan !== '0' && (
          <div className="border-t border-slate-100 mt-4 pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <SubLabel>調剤後薬剤管理指導料</SubLabel>
              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">令和8年度新設</span>
              <span className="text-xs text-slate-400 ml-1">月1回・60点</span>
            </div>
            <p className="text-xs text-slate-400 mb-2">
              地域支援体制加算届出薬局が対象。調剤後に継続的な服薬フォロー・医師への情報提供を行った場合に算定。
            </p>
            <div className="space-y-1">
              {([
                { value: 'none'        as const, label: '対象外', sub: '' },
                { value: 'diabetes'    as const, label: '糖尿病患者（糖尿病用剤の新規処方/変更）→ 60点', sub: 'インスリン・GLP-1受容体作動薬等の新規処方または変更があった糖尿病患者' },
                { value: 'heartfailure' as const, label: '慢性心不全患者（心疾患による入院経験あり）→ 60点', sub: '心疾患による入院経験がある慢性心不全患者' },
              ]).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors min-h-[44px] ${
                    conditions.chozaigoKanri === opt.value
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="chozaigoKanri"
                    checked={conditions.chozaigoKanri === opt.value}
                    onChange={() => set('chozaigoKanri', opt.value)}
                    className="mt-0.5 accent-blue-500 shrink-0"
                  />
                  <div>
                    <div className="text-sm text-slate-800">{opt.label}</div>
                    {opt.sub && <div className="text-xs text-slate-400 mt-0.5">{opt.sub}</div>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* バイオ後続品調剤（届出あり薬局のみ表示） */}
        {pharmacy.biosimilarDelivered && !isTokubetsuB && (
          <div className="border-t border-slate-100 mt-4 pt-4 space-y-2.5">
            <SubLabel>バイオ後続品調剤</SubLabel>
            <CheckboxRow
              checked={conditions.biosimilarDispensed}
              onChange={(v) => set('biosimilarDispensed', v)}
              label="バイオ後続品（インスリン除く）を今回調剤した（50点）"
              sub="届出あり薬局でも、今回実際にバイオ後続品（バイオシミラー）を調剤した場合のみ算定可。インスリン製剤は対象外"
            />
          </div>
        )}

        {/* かかりつけ薬剤師加算 */}
        <div className="border-t border-slate-100 mt-4 pt-4 space-y-2.5">
          <div className="flex items-center gap-1.5">
            <SubLabel>かかりつけ薬剤師加算</SubLabel>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">令和8年度新設</span>
          </div>
          <CheckboxRow
            checked={conditions.kakariFollowup}
            onChange={(v) => set('kakariFollowup', v)}
            label="かかりつけ薬剤師フォローアップ加算（50点・3月1回）"
            sub="調剤後に電話等で服薬状況・残薬等を継続フォロー（外来服薬支援料1等算定後の患者）"
          />
          <CheckboxRow
            checked={conditions.kakariHoumon}
            onChange={(v) => set('kakariHoumon', v)}
            label="かかりつけ薬剤師訪問加算（230点・6月1回）"
            sub="患者宅を訪問し残薬整理・服薬管理支援を実施・医師へ情報提供"
          />
        </div>

        {/* その他管理系 */}
        <div className="border-t border-slate-100 mt-4 pt-4 space-y-2.5">
          <SubLabel>その他の管理・支援</SubLabel>
          <CheckboxRow
            checked={conditions.serviceShien}
            onChange={(v) => set('serviceShien', v)}
            label="外来服薬支援料1（185点・月1回）"
            sub="服薬困難患者への残薬整理・服薬管理支援。服用薬剤調整支援料1との同月算定不可"
          />
          <CheckboxRow
            checked={conditions.genyakuOk}
            onChange={(v) => set('genyakuOk', v)}
            disabled={isTokubetsuB}
            label="服用薬剤調整支援料1（125点・月1回）"
            sub="内服薬6種類以上→2種類以上減薬の文書提案・変更済。外来服薬支援料1・料2との同月算定不可"
          />
          {/* 服用薬剤調整支援料2: 令和8年度改定で旧定義廃止。新定義（1,000点）は令和9年6月1日から施行予定 */}
          {conditions.serviceShien && conditions.genyakuOk && !isTokubetsuB && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 -mt-1">
              ⚠ 外来服薬支援料1と服用薬剤調整支援料1は同月算定不可。高点数の外来服薬支援料1（185点）が優先されます。
            </p>
          )}
          <CheckboxRow
            checked={conditions.infoProvision}
            onChange={(v) => set('infoProvision', v)}
            label="服薬情報等提供料1（30点・月1回）"
            sub="保険医療機関の求めによる文書情報提供（改定: 3月1回→月1回）"
          />
          <CheckboxRow
            checked={conditions.infoProvision2}
            onChange={(v) => set('infoProvision2', v)}
            label="服薬情報等提供料2（20点・月1回）"
            sub="医師からの依頼なしに薬剤師の判断で情報提供（残薬・副作用疑い等）。料1との同月算定不可"
          />
          {conditions.infoProvision && conditions.infoProvision2 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 -mt-1">
              ⚠ 料1と料2は同月算定不可。高点数の料1（30点）が優先されます。
            </p>
          )}
          <CheckboxRow
            checked={conditions.infoProvision3}
            onChange={(v) => set('infoProvision3', v)}
            label="服薬情報等提供料3（50点・3月1回）"
            sub="入院予定患者への入院前情報提供（保険医療機関の求めによる）。料1・料2とは独立して算定可"
          />
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════
          技術加算（自家製剤・一包化）
      ══════════════════════════════════════════════════════ */}
      <Card>
        <SectionLabel icon={<Wrench size={13} className="text-indigo-500" />} color="indigo">
          技術加算
        </SectionLabel>
        <p className="text-xs text-slate-500 mt-1 mb-1">
          一包化・割錠・粉砕など、通常の調剤より手間のかかる特殊な調剤作業を行ったときに算定できます。
        </p>
        <div className="mt-3 space-y-3">
          <StepperRow
            label="一包化（外来服薬支援料2）"
            sub={`34点/7日・43日以上=上限240点（改定: 43点→34点）${isTokubetsuB ? '　※特別B算定不可' : ''}`}
            value={conditions.ippozukaDays === 0 ? 'なし' : `${conditions.ippozukaDays}日`}
            onMinus={() => set('ippozukaDays', Math.max(0, conditions.ippozukaDays - 7))}
            onPlus={() => set('ippozukaDays', conditions.ippozukaDays === 0 ? 7 : Math.min(90, conditions.ippozukaDays + 7))}
            disabled={isTokubetsuB}
          />
          {conditions.ippozukaDays > 0 && conditions.prescriptionDays > 0 && conditions.ippozukaDays > conditions.prescriptionDays && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
              ⚠ 一包化日数（{conditions.ippozukaDays}日）が処方日数（{conditions.prescriptionDays}日）を超えています。処方日数を確認してください。
            </p>
          )}
          {conditions.ippozukaDays > 0 && !isTokubetsuB && (
            <div className="mt-2">
              <CheckboxRow
                checked={conditions.shisetsuRenkei}
                onChange={(v) => set('shisetsuRenkei', v)}
                label="施設連携加算（50点・月1回）"
                sub="施設（特養・老健・有料老人ホーム等）入所患者で施設職員と連携した服薬管理支援。在宅患者訪問薬剤管理指導料算定患者は対象外"
              />
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 mt-3 pt-3">
          <div className="text-xs font-medium text-slate-600 mb-1">自家製剤加算</div>
          <p className="text-xs text-slate-400 mb-2">
            市販品では対応できず、薬剤師が特別に調製（割錠・粉砕・懸濁化等）したときの加算です。点数は処方日数ベースで計算されます（7日分につき割錠4点・粉砕20点）。
          </p>
          <div className="space-y-2.5">
            <CheckboxRow
              checked={conditions.warijoOk}
              onChange={(v) => set('warijoOk', v)}
              disabled={isTokubetsuB}
              label="割錠（4点/7日）"
              sub="割錠指示あり・かつ割錠後の規格品が存在しないことを確認済（改定: 10点廃止→4点/7日）"
            />
            <CheckboxRow
              checked={conditions.engeKonnan}
              onChange={(v) => set('engeKonnan', v)}
              disabled={isTokubetsuB}
              label="嚥下困難者用製剤・粉砕等（20点/7日）"
              sub="嚥下困難患者への粉砕・懸濁・崩壊化等の特別製剤指示あり（改定: 独立加算廃止→自家製剤加算）"
            />
          </div>
          {isTokubetsuB && (
            <p className="text-xs text-slate-400 mt-2">特別調剤基本料Bを算定する薬局は技術加算を算定できません</p>
          )}
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════
          在宅薬学総合体制加算（在宅訪問時）
      ══════════════════════════════════════════════════════ */}
      <Card>
        <SectionLabel icon={<Home size={13} className="text-green-500" />} color="green">
          在宅薬学総合体制加算
        </SectionLabel>
        <p className="text-xs text-slate-500 mt-1 mb-3">
          在宅患者訪問薬剤管理指導料を算定する訪問時のみ合算できる体制加算です。通常の来局処方箋受付では算定しません。
        </p>
        <div className="space-y-1.5">
          {([
            { value: 'none'      as const, label: '在宅訪問なし（通常の来局）',                  sub: '',                                                          pts: undefined },
            { value: 'taisei1'   as const, label: '体制加算1（30点）',                          sub: '在宅訪問実績 直近1年48回以上・緊急時対応等の体制届出',              pts: 30 },
            { value: 'taisei2i'  as const, label: '体制加算2イ（単一建物1人・100点）',            sub: '単一建物診療患者が1人（一戸建て・マンション1室等）・令和8年度新設', pts: 100 },
            { value: 'taisei2ro' as const, label: '体制加算2ロ（施設・複数人・50点）',            sub: '施設や同一建物への複数人訪問・令和8年度新設',                        pts: 50 },
          ]).map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors min-h-[44px] ${
                conditions.zaitakuVisit === opt.value
                  ? 'border-green-400 bg-green-50'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="zaitakuVisit"
                checked={conditions.zaitakuVisit === opt.value}
                onChange={() => set('zaitakuVisit', opt.value)}
                className="mt-0.5 accent-green-500 shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="text-sm text-slate-800">{opt.label}</span>
                  {opt.pts && <span className="text-sm font-bold text-green-700 ml-auto shrink-0">{opt.pts}点</span>}
                </div>
                {opt.sub && <div className="text-xs text-slate-400 mt-0.5">{opt.sub}</div>}
              </div>
            </label>
          ))}
        </div>
        {conditions.zaitakuVisit !== 'none' && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5 mt-2">
            ⚠ かかりつけ薬剤師訪問加算（230点）は在宅患者訪問薬剤管理指導料を算定している患者には算定不可
          </p>
        )}
      </Card>

      {/* ══════════════════════════════════════════════════════
          照会・処方変更対応（ハイライトセクション）
      ══════════════════════════════════════════════════════ */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquareWarning size={15} className="text-amber-600 shrink-0" />
          <span className="text-sm font-semibold text-amber-800">照会・処方変更の対応</span>
        </div>
        <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2 mb-3 leading-relaxed">
          今回、処方医への照会を行いましたか？<br />
          <span className="text-amber-600">照会の内容によって算定できる加算が変わります（2つ同時算定は不可）</span>
        </p>
        <div className="space-y-1.5">
          {([
            {
              value: 'none',
              label: '照会なし',
              sub: undefined,
              pts: undefined,
            },
            {
              value: 'zanzai',
              label: '残薬照会　→　7日分以上の日数を短縮した',
              sub: '残薬が7日分以上ある患者への残薬確認・照会・日数変更',
              pts: '調剤時残薬調整加算　30点（在宅/かかりつけ患者は50点）',
            },
            {
              value: 'changed',
              label: '処方内容照会　→　処方が変更された',
              sub: '重複投薬・相互作用・副作用等を発見し照会→処方変更（残薬調整以外）',
              pts: '薬学的有害事象等防止加算　30点（在宅/かかりつけ患者は50点）',
            },
          ] as const).map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors min-h-[44px] ${
                conditions.jofukuResult === opt.value
                  ? 'border-amber-400 bg-amber-100'
                  : 'border-amber-200 bg-white hover:bg-amber-50'
              }`}
            >
              <input
                type="radio"
                name="jofukuResult"
                checked={conditions.jofukuResult === opt.value}
                onChange={() => set('jofukuResult', opt.value)}
                className="mt-0.5 accent-amber-500 shrink-0"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{opt.label}</div>
                {opt.sub && <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>}
                {opt.pts && (
                  <div className="text-xs font-semibold text-amber-700 mt-1 bg-amber-200 inline-block px-2 py-0.5 rounded">
                    → {opt.pts}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        {conditions.jofukuResult !== 'none' && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            <CheckboxRow
              checked={conditions.isZaitakuPatient}
              onChange={(v) => set('isZaitakuPatient', v)}
              label="在宅患者またはかかりつけ薬剤師担当患者（50点）"
              sub="該当する場合は残薬調整加算・有害事象等防止加算が30点→50点になります"
            />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          チェック実行（sticky）
      ══════════════════════════════════════════════════════ */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 -mx-4 px-4 py-3 flex gap-3 z-10">
        <button
          onClick={handleCheck}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
        >
          <Calculator size={16} />
          算定チェック実行
        </button>
        {result && (
          <button
            onClick={handleReset}
            title="リセット"
            className="px-4 py-3 border border-slate-300 text-slate-500 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          結果
      ══════════════════════════════════════════════════════ */}
      {result && (
        <div id="check-results" className="space-y-4 pb-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 text-white flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs opacity-70">令和8年度改定</div>
              <div className="mt-0.5">
                <span className="text-3xl font-bold">{result.totalPoints}</span>
                <span className="text-base font-normal ml-1">点</span>
              </div>
              <div className="text-xs opacity-70 mt-0.5">算定可能合計</div>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'コピー済' : '結果コピー'}
            </button>
          </div>

          {result.canClaim.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" />
                算定可能
                <span className="text-xs font-normal text-slate-400 ml-1">{result.canClaim.length}件</span>
              </h3>
              <div className="space-y-2">
                {result.canClaim.map((r) => (
                  <div
                    key={r.addition.id}
                    className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800 leading-snug">{r.addition.name}</div>
                      {r.note && <div className="text-xs text-emerald-700 mt-0.5">{r.note}</div>}
                    </div>
                    <div className="text-sm font-bold text-emerald-700 shrink-0 mt-0.5">{r.points}点</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.cannotClaim.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <XCircle size={14} className="text-slate-400" />
                算定不可
                <span className="text-xs font-normal text-slate-400 ml-1">{result.cannotClaim.length}件</span>
              </h3>
              <div className="space-y-1.5">
                {result.cannotClaim.map((r) => (
                  <div key={r.addition.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm text-slate-500">{r.addition.name}</div>
                      <div className="text-xs text-slate-400 shrink-0">{r.addition.points}点</div>
                    </div>
                    <div className="flex items-start gap-1 mt-1">
                      <AlertCircle size={11} className="text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-400 leading-relaxed">{r.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// サブコンポーネント
// ─────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {children}
    </div>
  )
}

function SectionLabel({
  children, icon, color = 'slate',
}: {
  children: React.ReactNode
  icon?: React.ReactNode
  color?: 'blue' | 'teal' | 'indigo' | 'slate' | 'green'
}) {
  const colors = {
    blue:   'text-blue-700',
    teal:   'text-teal-700',
    indigo: 'text-indigo-700',
    slate:  'text-slate-600',
    green:  'text-green-700',
  }
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${colors[color]}`}>
      {icon}
      {children}
    </div>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-slate-500">{children}</div>
}

function StepperRow({
  label, sub, value, onMinus, onPlus, disabled,
}: {
  label: string; sub: string; value: string
  onMinus: () => void; onPlus: () => void; disabled?: boolean
}) {
  return (
    <div className={`flex items-center justify-between py-0.5 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex-1 min-w-0 mr-3">
        <div className="text-sm text-slate-700">{label}</div>
        <div className="text-xs text-slate-400 leading-relaxed">{sub}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onMinus}
          disabled={disabled}
          className="w-8 h-8 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center text-base hover:bg-slate-100 transition-colors disabled:pointer-events-none"
        >
          −
        </button>
        <span className="w-14 text-center text-sm font-bold text-slate-800">{value}</span>
        <button
          onClick={onPlus}
          disabled={disabled}
          className="w-8 h-8 rounded-full border border-slate-300 text-slate-600 flex items-center justify-center text-base hover:bg-slate-100 transition-colors disabled:pointer-events-none"
        >
          ＋
        </button>
      </div>
    </div>
  )
}

function CheckboxRow({
  checked, onChange, label, sub, disabled,
}: {
  checked: boolean; onChange: (v: boolean) => void
  label: string; sub?: string; disabled?: boolean
}) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer min-h-[44px] py-0.5 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 mt-1 accent-blue-500 shrink-0"
      />
      <div>
        <div className="text-sm text-slate-700">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{sub}</div>}
      </div>
    </label>
  )
}
