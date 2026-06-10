'use client'

import { useState } from 'react'
import { BookOpen, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

const FAQ_ITEMS = [
  {
    category: '処方箋・受付',
    question: '処方箋の受付期限はいつまでですか？',
    answer: '処方箋の有効期限は、原則として交付日を含めて4日以内です。長期投薬の場合、医師が期間を指定することがあります。休日や閉局日は有効期間に含まれます。',
  },
  {
    category: '処方箋・受付',
    question: '処方箋が変更・追記されていた場合はどうすればよいですか？',
    answer: '処方箋に変更・追記がある場合は、変更箇所に処方医の署名または捺印があることを確認してください。署名・捺印のない変更は受け付けられません。必要に応じて処方医に確認の照会を行います。',
  },
  {
    category: '保険・公費',
    question: '保険証の確認はいつ行いますか？',
    answer: '原則として初回来局時および毎月1回は保険証の確認が必要です。月の途中で変更がある場合も確認が必要です。マイナンバーカードを保険証として利用する患者には、資格確認端末で確認します。',
  },
  {
    category: '保険・公費',
    question: '一部負担金の計算方法を教えてください。',
    answer: '一部負担金は「点数 × 10円 × 負担割合」で計算します。ただし端数処理（5円以下切捨・5円超切上）があります。高齢者（70歳以上）は原則2割、現役並み所得者は3割です。公費がある場合は公費の負担割合を適用します。',
  },
  {
    category: '後発品・変更',
    question: '後発品への変更ができない場合はどんなときですか？',
    answer: '①処方箋に「変更不可」の記載がある場合、②処方医が変更不可と判断した場合（患者の意向含む）、③患者本人が変更を希望しない場合、④後発品の在庫がない場合（この場合は患者に説明のうえ先発品を調剤）です。',
  },
  {
    category: '後発品・変更',
    question: '一般名処方（「般」マーク）の処方箋はどう対応しますか？',
    answer: '「般」マークがある場合は、その成分の後発品を調剤することが原則です。患者が先発品を希望する場合は患者の意向を確認し、薬歴に記録します。後発品がない場合は先発品を調剤します。',
  },
  {
    category: '薬歴・記録',
    question: '薬歴に必ず記載すべき内容は何ですか？',
    answer: '①患者の基本情報（氏名・生年月日・保険情報）、②処方内容と調剤内容、③服薬指導の内容（副作用・相互作用の確認含む）、④患者からの訴え・相談内容、⑤次回への申し送り事項、が必須です。',
  },
  {
    category: '算定・加算',
    question: 'かかりつけ薬剤師指導料と服薬管理指導料は同時に算定できますか？',
    answer: 'いいえ、同日の算定はできません。かかりつけ薬剤師が担当する場合はかかりつけ薬剤師指導料（76点）を算定します。担当薬剤師が不在の場合は服薬管理指導料（45点）を算定します。',
  },
]

export default function OtherPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const categories = [...new Set(FAQ_ITEMS.map((i) => i.category))]

  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <h2 className="text-xl font-bold text-slate-900">マニュアル・FAQ</h2>
        <p className="text-sm text-slate-500 mt-0.5">調剤事務のよくある質問と業務マニュアルです。</p>
      </div>

      {/* タブ（マニュアル・FAQ） */}
      <div className="flex border-b border-slate-200">
        <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">
          <HelpCircle size={15} />
          FAQ
        </button>
        <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700">
          <BookOpen size={15} />
          マニュアル
          <span className="text-xs bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded ml-1">準備中</span>
        </button>
      </div>

      {/* FAQ リスト（カテゴリ別） */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">
              {category}
            </h3>
            <div className="space-y-1.5">
              {FAQ_ITEMS.filter((item) => item.category === category).map((item, idx) => {
                const globalIdx = FAQ_ITEMS.indexOf(item)
                const isOpen = openItems.has(globalIdx)
                return (
                  <div
                    key={globalIdx}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                  >
                    <button
                      className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3"
                      onClick={() => toggleItem(globalIdx)}
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center">
                          Q
                        </span>
                        <span className="text-sm font-medium text-slate-800 leading-snug">
                          {item.question}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-slate-300 mt-0.5">
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                        <div className="flex items-start gap-2.5 pt-3">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold flex items-center justify-center">
                            A
                          </span>
                          <p className="text-sm text-slate-700 leading-relaxed">{item.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 pt-2">
        全 {FAQ_ITEMS.length} 件のFAQ（管理者画面から追加・編集可能）
      </p>
    </div>
  )
}
