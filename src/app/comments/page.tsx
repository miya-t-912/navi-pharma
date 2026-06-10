'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { ADDITIONS } from '@/data/additions'
import { CopyButton } from '@/components/common/CopyButton'
import { EmptyState } from '@/components/common/EmptyState'
import { CategoryBadge } from '@/components/common/CategoryBadge'
import { Addition } from '@/types'

interface FlatComment {
  code: string
  description: string
  example: string
  addition: Addition
}

// 全加算のレセプトコメントをフラット化
const ALL_COMMENTS: FlatComment[] = ADDITIONS.flatMap((addition) =>
  (addition.receiptComments ?? []).map((comment) => ({
    ...comment,
    addition,
  }))
)

export default function CommentsPage() {
  const [query, setQuery] = useState('')

  const results = query
    ? ALL_COMMENTS.filter(
        (c) =>
          c.code.includes(query) ||
          c.description.toLowerCase().includes(query.toLowerCase()) ||
          c.example.toLowerCase().includes(query.toLowerCase()) ||
          c.addition.name.toLowerCase().includes(query.toLowerCase())
      )
    : ALL_COMMENTS

  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <h2 className="text-xl font-bold text-slate-900">コメント検索</h2>
        <p className="text-sm text-slate-500 mt-0.5">レセプトコメントをコードまたはキーワードで検索できます。</p>
      </div>

      {/* 検索ボックス */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="コード番号・キーワードで検索"
          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState title="コメントが見つかりません" description="コード番号やキーワードを変えてお試しください" />
      ) : (
        <div className="space-y-2">
          {results.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 px-4 py-3.5 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <code className="text-xs font-mono text-violet-700 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded font-semibold">
                      {item.code}
                    </code>
                    <CategoryBadge categoryId={item.addition.categoryId} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{item.description}</p>
                  <p className="text-sm font-medium text-slate-800">「{item.example}」</p>
                  <p className="text-xs text-slate-400 mt-1">関連加算：{item.addition.name}</p>
                </div>
                <CopyButton text={item.example} />
              </div>
            </div>
          ))}
        </div>
      )}

      {ALL_COMMENTS.length > 0 && (
        <p className="text-center text-xs text-slate-400 pt-2">
          全 {ALL_COMMENTS.length} 件のコメントを掲載
        </p>
      )}
    </div>
  )
}
