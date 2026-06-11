'use client'

import { useState, useEffect, useRef } from 'react'
import { Database, Download, Upload, CheckCircle, Trash2, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { DrugMaster } from '@/types'
import { DRUG_MASTER, DRUG_MASTER_STORAGE_KEY, DRUG_MASTER_META_KEY } from '@/data/drugMaster'
import { saveMasterToFirebase, loadMetaFromFirebase, deleteMasterFromFirebase } from '@/lib/drugMasterDB'

const TEMPLATE_CSV = `成分名,規格,品名
アムロジピンベシル酸塩,２．５ｍｇ１錠,アムロジン錠２．５ｍｇ
アムロジピンベシル酸塩,５ｍｇ１錠,アムロジン錠５ｍｇ
アムロジピンベシル酸塩,１０ｍｇ１錠,アムロジン錠１０ｍｇ
エナラプリルマレイン酸塩,２．５ｍｇ１錠,レニベース錠２．５
エナラプリルマレイン酸塩,５ｍｇ１錠,レニベース錠５
エナラプリルマレイン酸塩,１０ｍｇ１錠,レニベース錠１０
ワルファリンカリウム,０．５ｍｇ１錠,ワーファリン錠０．５ｍｇ
ワルファリンカリウム,１ｍｇ１錠,ワーファリン錠１ｍｇ
ワルファリンカリウム,２ｍｇ１錠,ワーファリン錠２ｍｇ
ワルファリンカリウム,５ｍｇ１錠,ワーファリン錠５ｍｇ
フロセミド,１０ｍｇ１錠,ラシックス錠１０ｍｇ
フロセミド,２０ｍｇ１錠,ラシックス錠２０ｍｇ
フロセミド,４０ｍｇ１錠,ラシックス錠４０ｍｇ
レボチロキシンナトリウム水和物,１２．５μｇ１錠,チラーヂンS錠１２．５μｇ
レボチロキシンナトリウム水和物,２５μｇ１錠,チラーヂンS錠２５μｇ
レボチロキシンナトリウム水和物,５０μｇ１錠,チラーヂンS錠５０μｇ
レボチロキシンナトリウム水和物,１００μｇ１錠,チラーヂンS錠１００μｇ`

// 全角英数字・記号を半角に正規化
function normalizeWidth(s: string): string {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[ａ-ｚＡ-Ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/．/g, '.')
}

// 規格・品名の文字列からmg値を抽出（全角対応、μg→mg変換あり）
function extractStrengthMg(name: string): number | null {
  const n = normalizeWidth(name)

  const ugMatch = n.match(/(\d+(?:\.\d+)?)\s*μg/i)
  if (ugMatch) return parseFloat(ugMatch[1]) / 1000

  const mgMatch = n.match(/(\d+(?:\.\d+)?)\s*mg/i)
  if (mgMatch) return parseFloat(mgMatch[1])

  // 単位なし数字（例: ベンザリン錠2、レニベース錠2.5）
  const numMatch = n.match(/錠(\d+(?:\.\d+)?)(?:[^.\d]|$)/)
  if (numMatch) return parseFloat(numMatch[1])

  return null
}

function parseCSV(text: string): { drugs: DrugMaster[]; errors: string[] } {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  const errors: string[] = []
  const drugs: DrugMaster[] = []

  if (lines.length < 2) {
    errors.push('データ行がありません（ヘッダー行のみ）')
    return { drugs, errors }
  }

  const today = new Date().toISOString().split('T')[0]
  const dataLines = lines.slice(1)
  dataLines.forEach((line, i) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 3) return // 列数不足の行は無視（空行・特殊行など）
    // A=成分名, B=規格, C=品名（厚労省Excel形式）
    const genericName = cols[0]
    const kisoku      = cols[1]
    const brandName   = cols[2]

    if (!genericName) { errors.push(`${i + 2}行目: 成分名が空`); return }
    if (!brandName)   { errors.push(`${i + 2}行目: 品名が空`); return }
    if (!brandName.includes('錠')) return // 錠剤以外は無視（警告なし）

    // 規格列(B)優先、なければ品名(C)から抽出
    const strengthMg = extractStrengthMg(kisoku) ?? extractStrengthMg(brandName)
    if (strengthMg === null || strengthMg <= 0) return // 配合錠など規格不明は無視（警告なし）

    drugs.push({
      id: `custom-${i + 1}`,
      genericName,
      brandName: normalizeWidth(brandName), // 全角→半角（表示の統一）
      dosageForm: '錠',
      strengthMg,
      unit: 'mg',
      updatedAt: today,
    })
  })

  return { drugs, errors }
}

export default function AdminPage() {
  const [savedCount, setSavedCount]   = useState<number | null>(null)
  const [savedAt, setSavedAt]         = useState<string | null>(null)
  const [preview, setPreview]         = useState<DrugMaster[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [fileName, setFileName]       = useState<string | null>(null)
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Firebase優先、失敗時はlocalStorageにフォールバック
    loadMetaFromFirebase()
      .then((meta) => {
        if (meta) {
          setSavedCount(meta.count)
          setSavedAt(meta.updatedAt)
        } else {
          const s = localStorage.getItem(DRUG_MASTER_META_KEY)
          if (s) {
            const { count, savedAt: at } = JSON.parse(s)
            setSavedCount(count)
            setSavedAt(at)
          }
        }
      })
      .catch(() => {
        try {
          const s = localStorage.getItem(DRUG_MASTER_META_KEY)
          if (s) {
            const { count, savedAt: at } = JSON.parse(s)
            setSavedCount(count)
            setSavedAt(at)
          }
        } catch {}
      })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSaveStatus('idle')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      // UTF-8（BOMあり・なし両対応）で試み、文字化けがあればShift-JISで再試行
      let text = new TextDecoder('UTF-8').decode(buffer).replace(/^﻿/, '')
      if (text.includes('�')) {
        text = new TextDecoder('Shift_JIS').decode(buffer)
      }
      const { drugs, errors } = parseCSV(text)
      setPreview(drugs)
      setParseErrors(errors)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      await saveMasterToFirebase(preview)
      // オフライン時のフォールバック用にローカルにもキャッシュ
      const now = new Date().toISOString().split('T')[0]
      localStorage.setItem(DRUG_MASTER_STORAGE_KEY, JSON.stringify(preview))
      localStorage.setItem(DRUG_MASTER_META_KEY, JSON.stringify({ count: preview.length, savedAt: now }))
      setSavedCount(preview.length)
      setSavedAt(now)
      setSaveStatus('saved')
      setPreview([])
      setParseErrors([])
      setFileName(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch {
      setSaveStatus('error')
    }
  }

  const handleReset = async () => {
    try {
      await deleteMasterFromFirebase()
    } catch {}
    localStorage.removeItem(DRUG_MASTER_STORAGE_KEY)
    localStorage.removeItem(DRUG_MASTER_META_KEY)
    setSavedCount(null)
    setSavedAt(null)
    setSaveStatus('idle')
    setPreview([])
    setParseErrors([])
    setFileName(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const downloadTemplate = () => {
    const bom = '﻿'
    const blob = new Blob([bom + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '薬価マスタテンプレート.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const isUsingCustom = savedCount !== null && savedCount > 0

  return (
    <div className="space-y-4 pb-8">
      <div className="hidden lg:block">
        <h2 className="text-xl font-bold text-slate-900">マスタ管理</h2>
        <p className="text-sm text-slate-500 mt-0.5">薬価マスタの更新を行います。割錠チェックページに反映されます。</p>
      </div>

      {/* 現在のマスタ状況 */}
      <div className={`rounded-xl border p-4 ${isUsingCustom ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <Database size={15} className={isUsingCustom ? 'text-emerald-600' : 'text-slate-400'} />
          <span className={`text-sm font-semibold ${isUsingCustom ? 'text-emerald-700' : 'text-slate-600'}`}>
            現在の薬価マスタ
          </span>
        </div>
        {isUsingCustom ? (
          <>
            <p className="text-sm text-emerald-700">
              <span className="font-bold">{savedCount!.toLocaleString()}件</span>
              {savedAt && <span className="text-xs ml-2 text-emerald-600">（{savedAt} 更新）</span>}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">アップロードされたカスタムマスタを使用中</p>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              <span className="font-bold">{DRUG_MASTER.length}件</span>
              <span className="text-xs ml-2 text-slate-400">（組み込みサンプルデータ）</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">CSVをアップロードすると本番データに切り替わります</p>
          </>
        )}
      </div>

      {/* 手順 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-sm font-semibold text-slate-700">薬価マスタ更新手順</span>
          <span className="text-xs text-slate-400 ml-2">薬価改定のたびに実施（年2回：4月・10月）</span>
        </div>

        <div className="divide-y divide-slate-100">

          {/* Step 1 */}
          <div className="p-4 flex gap-3">
            <StepBadge n={1} />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-slate-800">厚労省から薬価基準リスト（Excel）をダウンロード</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                厚生労働省の薬価基準収載医薬品コードリストを取得します。
                薬効分類ごとにファイルが分かれているため、<strong>「全品目」</strong>または<strong>「内用薬（全カテゴリ）」</strong>のExcelを選択してください。
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                ⚠ 「01_01」などカテゴリ別ファイルは一部の薬しか含まれません。アムロジピン・ワルファリン等の割錠対象薬を検索するには全品目ファイルが必要です。
              </p>
              <a
                href="https://www.mhlw.go.jp/topics/2024/04/tp20240401-01.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
              >
                <ExternalLink size={12} />
                厚生労働省 薬価基準収載医薬品コード（外部サイト）
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 flex gap-3">
            <StepBadge n={2} />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-slate-800">ExcelをCSV形式に整形して保存</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                厚労省Excelを<strong>列の並び替えなしに</strong>そのままCSV保存して使えます。
                A列（成分名）とC列（品名）を使用し、品名に「錠」が含まれる行のみ自動取込みします。
              </p>

              {/* 列説明 */}
              <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200 text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">列</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">内容</th>
                      <th className="text-left px-3 py-1.5 font-semibold text-slate-600">例</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      ['A', '成分名 ✅使用', 'アムロジピンベシル酸塩'],
                      ['B', '規格 ✅mg抽出に使用', '５ｍｇ１錠'],
                      ['C', '品名 ✅使用・錠剤判定', 'アムロジン錠５ｍｇ'],
                    ].map(([col, label, ex]) => (
                      <tr key={col}>
                        <td className="px-3 py-1.5 font-mono text-slate-500">{col}</td>
                        <td className="px-3 py-1.5 text-slate-700">{label}</td>
                        <td className="px-3 py-1.5 text-slate-400">{ex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                💡 Excelを開いて「名前を付けて保存」→「CSV UTF-8（コンマ区切り）」を選ぶだけでOKです。列の加工は不要です。
              </p>

              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors border border-blue-200"
              >
                <Download size={13} />
                テンプレートCSVをダウンロード（フォーマット確認用）
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 flex gap-3">
            <StepBadge n={3} />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-slate-800">CSVをアップロード</p>
              <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl py-5 cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload size={18} className="text-slate-400" />
                <span className="text-sm">
                  {fileName
                    ? <span className="text-blue-700 font-medium">{fileName}</span>
                    : <span className="text-slate-500">クリックしてCSVファイルを選択</span>}
                </span>
              </label>

              {parseErrors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle size={13} className="text-amber-600" />
                    <p className="text-xs font-semibold text-amber-700">{parseErrors.length}件の警告（錠剤以外の行は自動スキップ）</p>
                  </div>
                  {parseErrors.slice(0, 5).map((e, i) => (
                    <p key={i} className="text-xs text-amber-600 pl-4">{e}</p>
                  ))}
                  {parseErrors.length > 5 && (
                    <p className="text-xs text-amber-500 pl-4">他 {parseErrors.length - 5} 件...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 4：プレビュー＆保存 */}
          {preview.length > 0 && (
            <div className="p-4 flex gap-3">
              <StepBadge n={4} />
              <div className="flex-1 space-y-3">
                <p className="text-sm font-medium text-slate-800">内容を確認して保存</p>

                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-3 py-2 bg-slate-100 text-xs font-semibold text-slate-600">
                    {preview.length.toLocaleString()}件の錠剤データを読み込みました（先頭5件）
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-200">
                          <th className="text-left px-3 py-2 font-medium">成分名</th>
                          <th className="text-left px-3 py-2 font-medium">販売名</th>
                          <th className="text-right px-3 py-2 font-medium">規格</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {preview.slice(0, 5).map((d) => (
                          <tr key={d.id}>
                            <td className="px-3 py-2 text-slate-700 max-w-[130px] truncate">{d.genericName}</td>
                            <td className="px-3 py-2 text-slate-500 max-w-[130px] truncate">{d.brandName}</td>
                            <td className="px-3 py-2 text-right text-slate-600 whitespace-nowrap">{d.strengthMg}mg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Firebase に保存中...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {preview.length.toLocaleString()}件を保存して割錠チェックに反映
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 保存完了 */}
      {saveStatus === 'saved' && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle size={16} className="text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">保存しました。全端末の割錠チェックに自動反映されます。</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">保存に失敗しました。ネットワーク接続を確認してください。</p>
        </div>
      )}

      {/* リセット */}
      {isUsingCustom && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-medium text-slate-700 mb-1">カスタムマスタを削除</p>
          <p className="text-xs text-slate-500 mb-3">
            削除するとサンプルデータ（{DRUG_MASTER.length}件）に戻ります。次回アップロードまで反映されません。
          </p>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg text-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            カスタムマスタを削除してサンプルに戻す
          </button>
        </div>
      )}
    </div>
  )
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
      {n}
    </span>
  )
}
