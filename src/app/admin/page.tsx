'use client'

import { useState, useEffect, useRef } from 'react'
import { Database, Download, Upload, CheckCircle, Trash2, ExternalLink, AlertCircle } from 'lucide-react'
import { DrugMaster } from '@/types'
import { DRUG_MASTER, DRUG_MASTER_STORAGE_KEY, DRUG_MASTER_META_KEY } from '@/data/drugMaster'

const TEMPLATE_CSV = `成分名,品名
アムロジピンベシル酸塩,アムロジン錠2.5mg
アムロジピンベシル酸塩,アムロジン錠5mg
アムロジピンベシル酸塩,アムロジン錠10mg
エナラプリルマレイン酸塩,レニベース錠2.5
エナラプリルマレイン酸塩,レニベース錠5
エナラプリルマレイン酸塩,レニベース錠10
ワルファリンカリウム,ワーファリン錠0.5mg
ワルファリンカリウム,ワーファリン錠1mg
ワルファリンカリウム,ワーファリン錠2mg
ワルファリンカリウム,ワーファリン錠5mg
フロセミド,ラシックス錠10mg
フロセミド,ラシックス錠20mg
フロセミド,ラシックス錠40mg
レボチロキシンナトリウム水和物,チラーヂンS錠12.5μg
レボチロキシンナトリウム水和物,チラーヂンS錠25μg
レボチロキシンナトリウム水和物,チラーヂンS錠50μg
レボチロキシンナトリウム水和物,チラーヂンS錠100μg`

// 品名の文字列からmg値を抽出（μg→mg変換あり）
function extractStrengthMg(name: string): number | null {
  const ugMatch = name.match(/(\d+(?:\.\d+)?)\s*μg/i)
  if (ugMatch) return parseFloat(ugMatch[1]) / 1000

  const mgMatch = name.match(/(\d+(?:\.\d+)?)\s*mg/i)
  if (mgMatch) return parseFloat(mgMatch[1])

  // 単位なし数字（例: レニベース錠2.5）
  const numMatch = name.match(/錠(\d+(?:\.\d+)?)(?:[^.\d]|$)/)
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
    if (cols.length < 2) {
      errors.push(`${i + 2}行目: 列数不足（${cols.length}列、最低2列必要）`)
      return
    }
    const [genericName, brandName] = cols

    if (!genericName) { errors.push(`${i + 2}行目: 成分名が空`); return }
    if (!brandName)   { errors.push(`${i + 2}行目: 品名が空`); return }
    if (!brandName.includes('錠')) return // 錠剤以外は無視（警告なし）

    const strengthMg = extractStrengthMg(brandName)
    if (strengthMg === null || strengthMg <= 0) {
      errors.push(`${i + 2}行目: 品名から規格mg抽出できず（${brandName}）`)
      return
    }

    drugs.push({
      id: `custom-${i + 1}`,
      genericName,
      brandName,
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
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saved' | 'error'>('idle')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const meta = localStorage.getItem(DRUG_MASTER_META_KEY)
      if (meta) {
        const { count, savedAt: at } = JSON.parse(meta)
        setSavedCount(count)
        setSavedAt(at)
      }
    } catch {}
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setSaveStatus('idle')
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { drugs, errors } = parseCSV(text)
      setPreview(drugs)
      setParseErrors(errors)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleSave = () => {
    try {
      localStorage.setItem(DRUG_MASTER_STORAGE_KEY, JSON.stringify(preview))
      const now = new Date().toISOString().split('T')[0]
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

  const handleReset = () => {
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
                ページ内の「内用薬」または「全品目」のExcelを選択してください。
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
                以下の<strong>2列・この順番</strong>になるように列を整理し、「名前を付けて保存」→「CSV UTF-8（コンマ区切り）」で保存します。
                <br />規格（mg/μg）は品名の文字列から<strong>自動で抽出</strong>されます。錠剤以外の行は自動的に読み飛ばされます。
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
                      ['A', '成分名', 'アムロジピンベシル酸塩'],
                      ['B', '品名（規格込み）', 'アムロジン錠5mg'],
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
                💡 厚労省Excelの「成分名」列と「品名」列の2列をそのままコピーすればOKです。規格mgの手入力は不要です。
              </p>

              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors border border-blue-200"
              >
                <Download size={13} />
                テンプレートCSVをダウンロード（整形の見本）
              </button>
              <p className="text-xs text-slate-400">
                ※ テンプレートにはヘッダーとサンプル行が入っています。厚労省ExcelのA・B列をこの形式に合わせてください。
              </p>
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
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
                >
                  <CheckCircle size={16} />
                  {preview.length.toLocaleString()}件を保存して割錠チェックに反映
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
          <p className="text-sm text-emerald-700 font-medium">保存しました。割錠チェックページに反映されています。</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600">保存に失敗しました。ブラウザのストレージ容量が不足している可能性があります。</p>
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
