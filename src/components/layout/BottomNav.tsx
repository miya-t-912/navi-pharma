'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, CheckCircle, FileText, MessageSquare, Pill, BookOpen } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: '加算検索', icon: Search },
  { href: '/check', label: '算定Check', icon: CheckCircle },
  { href: '/kouhi', label: '公費', icon: FileText },
  { href: '/comments', label: 'コメント', icon: MessageSquare },
  { href: '/warijokazan', label: '割錠', icon: Pill },
  { href: '/other', label: 'その他', icon: BookOpen },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-bottom">
      <div className="flex">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={isActive ? 'text-blue-600' : 'text-slate-400'}
              />
              <span
                className={`text-[10px] font-medium leading-tight ${
                  isActive ? 'text-blue-600' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-t" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
