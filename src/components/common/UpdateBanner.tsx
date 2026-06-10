'use client'

import { useState } from 'react'
import { X, Info } from 'lucide-react'

// 実際のデータはDBから取得する（Phase1では静的）
const LATEST_UPDATE = {
  date: '2026年6月1日',
  message: '令和8年度調剤報酬改定データを反映しました',
  isNew: true,
}

export function UpdateBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (!LATEST_UPDATE.isNew || dismissed) return null

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2.5">
      <Info size={16} className="text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800 flex-1">
        <span className="font-semibold">{LATEST_UPDATE.date}</span>
        {'　'}
        {LATEST_UPDATE.message}
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0 p-0.5 rounded"
        aria-label="バナーを閉じる"
      >
        <X size={16} />
      </button>
    </div>
  )
}
