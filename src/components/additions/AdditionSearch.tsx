'use client'

import { useState, useMemo, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { ADDITIONS, searchAdditions, getAdditionsByCategory } from '@/data/additions'
import { CATEGORIES } from '@/data/categories'
import { CategoryId } from '@/types'
import { AdditionCard } from './AdditionCard'
import { EmptyState } from '@/components/common/EmptyState'
import { Skeleton } from '@/components/ui/skeleton'

export function AdditionSearch() {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setIsSearching(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value)
      setIsSearching(false)
    }, 250)
  }

  const results = useMemo(() => {
    let list = debouncedQuery ? searchAdditions(debouncedQuery) : ADDITIONS
    if (selectedCategory) {
      list = list.filter((a) => a.categoryId === selectedCategory)
    }
    return list
  }, [debouncedQuery, selectedCategory])

  const handleCategoryToggle = (catId: CategoryId) => {
    setSelectedCategory((prev) => (prev === catId ? null : catId))
  }

  const clearSearch = () => {
    setQuery('')
    setDebouncedQuery('')
    setIsSearching(false)
  }

  return (
    <div className="space-y-4">
      {/* ページタイトル（デスクトップのみ） */}
      <div className="hidden lg:block">
        <h2 className="text-xl font-bold text-slate-900">加算検索</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          加算名・キーワードで検索できます。タップして詳細・算定要件・レセプトコメントを確認。
        </p>
      </div>

      {/* 検索ボックス */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="加算名・キーワードで検索（例：手帳、残薬、一包化）"
          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          aria-label="加算検索"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            aria-label="検索をクリア"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* カテゴリフィルター（グリッド2列） */}
      <div className="grid grid-cols-3 gap-1.5 lg:flex lg:flex-wrap lg:gap-2">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryToggle(cat.id as CategoryId)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isSelected
                  ? `${cat.bgColor} ${cat.color} ${cat.borderColor} shadow-sm`
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              aria-pressed={isSelected}
            >
              <span>{cat.icon}</span>
              <span className="leading-tight">{cat.name}</span>
            </button>
          )
        })}
      </div>

      {/* 件数表示 */}
      {(debouncedQuery || selectedCategory) && (
        <p className="text-xs text-slate-500">
          {results.length > 0 ? (
            <>
              <span className="font-semibold text-slate-700">{results.length}件</span> 見つかりました
            </>
          ) : null}
        </p>
      )}

      {/* 検索中スケルトン */}
      {isSearching && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-4 w-full rounded" />
            </div>
          ))}
        </div>
      )}

      {/* 結果リスト */}
      {!isSearching && (
        <>
          {results.length === 0 ? (
            <EmptyState
              title="加算が見つかりません"
              description={`「${debouncedQuery}」に一致する加算はありませんでした。キーワードを変えてお試しください。`}
            />
          ) : (
            <div className="space-y-3">
              {results.map((addition) => (
                <AdditionCard key={addition.id} addition={addition} />
              ))}
            </div>
          )}
        </>
      )}

      {/* 初期表示の全件数 */}
      {!debouncedQuery && !selectedCategory && !isSearching && (
        <p className="text-center text-xs text-slate-400 pt-2">
          全 {ADDITIONS.length} 件の加算を掲載（令和8年度対応）
        </p>
      )}
    </div>
  )
}
