'use client'

import { useState, useEffect, useRef } from 'react'
import { Pill, CheckCircle, XCircle, Search, X } from 'lucide-react'
import { DRUG_MASTER, searchDrugByName, checkSplitStrengthExists } from '@/data/drugMaster'
import { DrugMaster } from '@/types'
import { CopyButton } from '@/components/common/CopyButton'

type SplitRatio = 2 | 4
type CheckStatus = 'idle' | 'can_claim' | 'cannot_claim'

export default function WarijoPage() {
  const [nameQuery, setNameQuery] = useState('')
  const [suggestions, setSuggestions] = useState<DrugMaster[]>([])
  const [selectedDrug, setSelectedDrug] = useState<DrugMaster | null>(null)
  const [splitRatio, setSplitRatio] = useState<SplitRatio>(2)
  const [status, setStatus] = useState<CheckStatus>('idle')
  const [matchingDrugs, setMatchingDrugs] = useState<DrugMaster[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const afterSplitMg = selectedDrug ? selectedDrug.strengthMg / splitRatio : 0

  // インクリメンタルサーチ（300msデバウンス）
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (nameQuery.length < 2) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(() => {
      setSuggestions(searchDrugByName(nameQuery))
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [nameQuery])

  const handleSelectDrug = (drug: DrugMaster) => {
    setSelectedDrug(drug)
    setNameQuery(drug.genericName)
    setSuggestions([])
    setStatus('idle')
    setMatchingDrugs([])
  }

  const handleCheck = () => {
    if (!selectedDrug) return
    const matches = checkSplitStrengthExists(selectedDrug.genericName, afterSplitMg)
    setMatchingDrugs(matches)
    setStatus(matches.length > 0 ? 'cannot_claim' : 'can_claim')
  }

  const handleReset = () => {
    setNameQuery('')
    setSelectedDrug(null)
    setSuggestions([])
    setStatus('idle')
    setMatchingDrugs([])
    setSplitRatio(2)
  }

  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <h2 className="text-xl font-bold text-slate-900">割錠加算チェック</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          割錠後のmg規格品が薬価収載されているか確認し、算定可否を判定します。
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
          <Pill size={16} className="text-rose-500" />
          <h3 className="text-sm font-semibold text-rose-700">割錠加算 算定可否チェック</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* 薬品名入力 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">薬品名（成分名・商品名）</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={nameQuery}
                onChange={(e) => {
                  setNameQuery(e.target.value)
                  setSelectedDrug(null)
                  setStatus('idle')
                }}
                placeholder="例：アムロジピン、ワーファリン"
                className="w-full border border-slate-300 rounded-lg pl-8 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {nameQuery && (
                <button onClick={handleReset} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={15} />
                </button>
              )}
            </div>
            {/* サジェスト */}
            {suggestions.length > 0 && (
              <div className="border border-slate-200 rounded-lg shadow-md bg-white divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {suggestions.map((drug) => (
                  <button
                    key={drug.id}
                    onClick={() => handleSelectDrug(drug)}
                    className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-800">{drug.genericName}</p>
                    <p className="text-xs text-slate-400">{drug.brandName}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 規格・割り方の選択 */}
          {selectedDrug && (
            <>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                <p className="text-xs text-slate-500 mb-0.5">選択中の薬</p>
                <p className="text-sm font-semibold text-slate-800">{selectedDrug.genericName}</p>
                <p className="text-xs text-slate-500">{selectedDrug.brandName}（{selectedDrug.strengthMg}{selectedDrug.unit}）</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">割り方</label>
                <div className="flex gap-3">
                  {([2, 4] as SplitRatio[]).map((ratio) => (
                    <label key={ratio} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="splitRatio"
                        value={ratio}
                        checked={splitRatio === ratio}
                        onChange={() => setSplitRatio(ratio)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{ratio}分割</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  割錠後：<span className="font-semibold text-slate-700">{afterSplitMg.toFixed(4).replace(/\.?0+$/, '')}{selectedDrug.unit}</span>
                </p>
              </div>

              <button
                onClick={handleCheck}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
              >
                判定する
              </button>
            </>
          )}
        </div>
      </div>

      {/* 判定結果 */}
      {status !== 'idle' && selectedDrug && (
        <div className={`rounded-xl border overflow-hidden ${status === 'can_claim' ? 'border-emerald-200' : 'border-red-200'}`}>
          <div className={`px-4 py-3 flex items-center gap-2 ${status === 'can_claim' ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {status === 'can_claim' ? (
              <>
                <CheckCircle size={18} className="text-emerald-600" />
                <span className="font-bold text-emerald-700">割錠加算 算定可能</span>
              </>
            ) : (
              <>
                <XCircle size={18} className="text-red-600" />
                <span className="font-bold text-red-700">割錠加算 算定不可</span>
              </>
            )}
          </div>

          <div className="p-4 bg-white space-y-3">
            {status === 'cannot_claim' ? (
              <>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{afterSplitMg.toFixed(4).replace(/\.?0+$/, '')}{selectedDrug.unit}</span>
                  の規格品が薬価収載されているため、割錠加算は算定できません。
                </p>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-2">該当規格品：</p>
                  <div className="space-y-1.5">
                    {matchingDrugs.map((drug) => (
                      <div key={drug.id} className="bg-red-50 rounded-lg px-3 py-2 text-sm text-red-800">
                        <span className="font-medium">{drug.brandName}</span>
                        <span className="text-red-500 ml-2">（{drug.strengthMg}{drug.unit}）</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-500">💬 算定不可のためレセプトコメントは不要です</p>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">{afterSplitMg.toFixed(4).replace(/\.?0+$/, '')}{selectedDrug.unit}</span>
                  の規格品は薬価収載されていません。割錠加算（10点）を算定できます。
                </p>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
                  <p className="text-xs font-semibold text-emerald-700 mb-1.5">💬 レセプトコメント例</p>
                  <p className="text-sm text-emerald-800 font-medium">
                    「{selectedDrug.genericName}（{selectedDrug.strengthMg}{selectedDrug.unit}）を{splitRatio}割（{afterSplitMg.toFixed(4).replace(/\.?0+$/, '')}{selectedDrug.unit}の規格なし）」
                  </p>
                  <div className="mt-2">
                    <CopyButton
                      text={`${selectedDrug.genericName}（${selectedDrug.strengthMg}${selectedDrug.unit}）を${splitRatio}割（${afterSplitMg.toFixed(4).replace(/\.?0+$/, '')}${selectedDrug.unit}の規格なし）`}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 注意事項 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ ご注意</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          このチェックはサンプルデータに基づいています。実際の算定可否は最新の薬価基準を必ずご確認ください。
          管理者はCSVアップロードで薬価マスタを最新化できます。
        </p>
      </div>
    </div>
  )
}
