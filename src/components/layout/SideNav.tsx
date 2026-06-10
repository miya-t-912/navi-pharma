'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, CheckCircle, FileText, MessageSquare, Pill, BookOpen, Database } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: '加算検索', icon: Search, description: '加算名・キーワードで検索' },
  { href: '/check', label: '算定チェック', icon: CheckCircle, description: '条件入力→算定可否判定' },
  { href: '/kouhi', label: '公費情報', icon: FileText, description: '国公費・兵庫・大阪' },
  { href: '/comments', label: 'コメント検索', icon: MessageSquare, description: 'レセプトコメント' },
  { href: '/warijokazan', label: '割錠チェック', icon: Pill, description: '規格品の存在確認' },
  { href: '/other', label: 'その他', icon: BookOpen, description: 'マニュアル・FAQ' },
]

export function SideNav() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* ロゴ */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 shadow-sm shrink-0">
            <Pill size={18} className="text-white" strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="text-base font-bold text-slate-900">加算ナビ</h1>
            <p className="text-[11px] text-slate-400">令和8年度対応</p>
          </div>
        </div>
      </div>

      {/* メインナビ */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? 'text-blue-600' : 'text-slate-400'}
              />
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* マスタ管理 */}
      <div className="px-2 py-3 border-t border-slate-100">
        <Link
          href="/admin"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
            pathname.startsWith('/admin')
              ? 'bg-slate-100 text-slate-900 font-semibold'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <Database size={18} strokeWidth={1.8} className={pathname.startsWith('/admin') ? 'text-slate-700' : 'text-slate-400'} />
          <span className="text-sm">マスタ管理</span>
        </Link>
      </div>
    </aside>
  )
}
