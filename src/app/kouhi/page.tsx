import { FileText, Construction, CheckCircle } from 'lucide-react'

export default function KouhiPage() {
  return (
    <div className="space-y-4">
      <div className="hidden lg:block">
        <h2 className="text-xl font-bold text-slate-900">公費情報</h2>
        <p className="text-sm text-slate-500 mt-0.5">国公費・兵庫県・大阪府の公費情報を確認できます。</p>
      </div>
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mb-4">
          <Construction size={26} className="text-teal-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-2">Phase 3 で実装予定</h3>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          国公費・兵庫県・大阪府の地方単独公費の基本情報・調剤取扱い・注意事項を検索・参照できます。
        </p>
        <div className="mt-6 flex flex-col gap-2 text-xs text-slate-400">
          {['国公費（精神・難病・生保など）', '兵庫県地方単独公費', '大阪府地方単独公費', '管理者メモ機能つき'].map((item) => (
            <div key={item} className="flex items-center gap-2 justify-center">
              <CheckCircle size={13} className="text-emerald-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
