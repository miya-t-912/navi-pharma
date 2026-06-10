'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, AlertCircle, MessageSquare, Lightbulb } from 'lucide-react'
import { Addition } from '@/types'
import { CategoryBadge } from '@/components/common/CategoryBadge'
import { PointsBadge } from '@/components/common/PointsBadge'
import { CopyButton } from '@/components/common/CopyButton'

interface AdditionCardProps {
  addition: Addition
  storePoints?: number  // 店舗設定の点数
}

export function AdditionCard({ addition, storePoints }: AdditionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const displayPoints = storePoints ?? addition.points

  return (
    <article className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      {/* カードヘッダー */}
      <button
        className="w-full text-left px-4 py-3.5"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <CategoryBadge categoryId={addition.categoryId} size="sm" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 leading-snug mb-1">
              {addition.name}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
              {addition.plainDescription}
            </p>
          </div>
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <PointsBadge points={displayPoints} />
            <span className="text-slate-300">
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </div>
        </div>
      </button>

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="border-t border-slate-100">
          {/* かみ砕き説明 */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start gap-2">
              <Lightbulb size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1">わかりやすい説明</p>
                <p className="text-sm text-blue-800 leading-relaxed">{addition.plainDescription}</p>
              </div>
            </div>
          </div>

          {/* 算定要件 */}
          {addition.requirements.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={15} className="text-emerald-500" />
                <p className="text-xs font-semibold text-slate-700">算定要件</p>
              </div>
              <ul className="space-y-1.5">
                {addition.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 注意事項 */}
          {addition.notes && addition.notes.length > 0 && (
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle size={15} className="text-amber-500" />
                <p className="text-xs font-semibold text-slate-700">注意事項</p>
              </div>
              <ul className="space-y-1.5">
                {addition.notes.map((note, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                    <span className="flex-shrink-0 text-amber-500 font-bold">!</span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* レセプトコメント */}
          {addition.receiptComments && addition.receiptComments.length > 0 && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare size={15} className="text-violet-500" />
                <p className="text-xs font-semibold text-slate-700">レセプトコメント</p>
              </div>
              <div className="space-y-2">
                {addition.receiptComments.map((comment, i) => (
                  <div
                    key={i}
                    className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <code className="text-xs font-mono text-violet-700 font-semibold bg-violet-100 px-1.5 py-0.5 rounded">
                        {comment.code}
                      </code>
                      <CopyButton text={comment.example} />
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{comment.description}</p>
                    <p className="text-sm text-slate-800 font-medium">
                      例：「{comment.example}」
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 店舗設定の表示 */}
          {storePoints !== undefined && (
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                ⚙️ 当店設定：<span className="font-semibold text-slate-700">{storePoints}点</span>
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
