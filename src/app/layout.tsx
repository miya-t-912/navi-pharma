import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { BottomNav } from '@/components/layout/BottomNav'
import { SideNav } from '@/components/layout/SideNav'
import { UpdateBanner } from '@/components/common/UpdateBanner'

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '加算ナビ',
  description: '調剤事務スタッフのための加算算定チェック・検索ツール（令和8年度調剤報酬改定対応）',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '加算ナビ',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#2563EB',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50">
        {/* デスクトップ: サイドバー + コンテンツ */}
        <div className="hidden lg:flex h-screen overflow-hidden">
          <SideNav />
          <main className="flex-1 overflow-y-auto">
            <UpdateBanner />
            <div className="max-w-4xl mx-auto p-6">{children}</div>
          </main>
        </div>

        {/* モバイル: 上部タイトル + コンテンツ + 下部ナビ */}
        <div className="lg:hidden flex flex-col min-h-screen">
          {/* モバイルヘッダー */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-2">
            <span className="text-xl">💊</span>
            <h1 className="text-lg font-bold text-slate-900">加算ナビ</h1>
            <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
              R8対応
            </span>
          </header>
          <UpdateBanner />
          <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  )
}
