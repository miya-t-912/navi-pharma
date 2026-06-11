# 加算ナビ 引継ぎファイル

最終更新：2026-06-11  
URL：https://navi-pharma.vercel.app  
GitHub：https://github.com/miya-t-912/navi-pharma  
ローカル：`C:\Users\non09\OneDrive\デスクトップ\claude\kaisan-navi\`

---

## スタック

- **フレームワーク**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **デプロイ**: Vercel（mainブランチへのpushで自動デプロイ）
- **DB**: Firebase Realtime Database（薬価マスタの全端末共有）
- **参照PDF**: `C:\Users\non09\OneDrive\デスクトップ\令和8年度　調剤報酬改定　点数表.pdf`

---

## Firebase 設定

```
Project: navi-pharma
Database URL: https://navi-pharma-default-rtdb.asia-southeast1.firebasedatabase.app
```

設定ファイル: `src/lib/firebase.ts`  
DB関数: `src/lib/drugMasterDB.ts`（saveMasterToFirebase / loadMasterFromFirebase / loadMetaFromFirebase / deleteMasterFromFirebase）

**DBの構造**:
```
Firebase Realtime Database
├── meta/
│   ├── count: 4386
│   └── updatedAt: "2026-06-11"
└── drugMaster: [ DrugMaster[] ]
```

**⚠ 未対応**: Firebaseのテストモードルール（30日で期限切れ）を永続化すること
```json
{ "rules": { ".read": true, ".write": true } }
```

---

## ページ一覧と状態

### ✅ `/warijokazan` — 割錠加算チェック（実用済み）
- 薬品名検索 → 規格選択 → 2/4分割 → 割錠後規格の薬価収載確認 → レセプトコメント生成
- **データソース**: Firebase優先 → localStorageフォールバック → サンプル17件
- **主要ファイル**: `src/app/warijokazan/page.tsx`, `src/data/drugMaster.ts`

### ✅ `/admin` — マスタ管理（実用済み）
- 厚労省Excelを「名前を付けて保存 → CSV」→ アップロード → Firebaseに保存 → 全端末反映
- **フォーマット**: A=成分名, B=規格, C=品名（厚労省Excel形式そのまま）
- Shift-JIS/UTF-8自動判定、全角数字・記号を自動正規化
- **注意**: 「全品目」ファイルが必要。カテゴリ別ファイルでは一部の薬しか登録されない
- **主要ファイル**: `src/app/admin/page.tsx`

### ✅ `/check` — 算定チェック（実装済み・令和8年度改定対応）
薬局設定（localStorage保存）＋患者ごとの条件入力で算定可能点数を自動計算。

**実装済み加算（全項目）**:

| カテゴリ | 項目 | 点数 |
|----------|------|------|
| kihon | 調剤基本料1〜特別B（7区分） | 47/30/25/20/37/5/3点 |
| kihon | 地域支援加算1〜5 | 27/59/67/37/59点 |
| kihon | 連携強化加算 | 5点 |
| kihon | 夜間・休日等加算 | 40点 |
| kihon | 調剤ベースアップ評価料 | 4点 |
| kihon | 調剤物価対応料 | 1点 |
| kihon | バイオ後続品調剤体制加算 | 50点（特別A→5点） |
| kihon | 電子的調剤情報連携体制整備加算 | 8点 |
| kihon | 在宅薬学総合体制加算（体制1・2イ・2ロ） | 30/100/50点 |
| yakugaku | 服薬管理指導料①②③ | 45/59/59点 |
| yakugaku | 調剤管理料（27日以下/28日以上） | 10/60点（/剤） |
| yakugaku | 麻薬管理指導加算 | 22点 |
| yakugaku | 特定薬剤管理指導加算1イ・1ロ・2・3イ・3ロ | 10/5/100/5/10点 |
| yakugaku | 乳幼児服薬指導加算 | 12点 |
| yakugaku | 小児特定加算 | 350点 |
| yakugaku | 吸入薬管理指導加算 | 30点 |
| yakugaku | かかりつけ薬剤師フォローアップ加算 | 50点 |
| yakugaku | かかりつけ薬剤師訪問加算 | 230点 |
| yakugaku | 調剤時残薬調整加算 | 30点（在宅/かかりつけ50点） |
| yakugaku | 薬学的有害事象等防止加算 | 30点（在宅/かかりつけ50点） |
| yakugaku | 調剤後薬剤管理指導料（糖尿病・慢性心不全） | 60点 |
| tokutei | 外来服薬支援料1 | 185点 |
| tokutei | 服用薬剤調整支援料1 | 125点 |
| tokutei | 服薬情報等提供料1/2/3 | 30/20/50点 |
| gijutsu | 外来服薬支援料2（一包化） | 34点/7日・上限240点 |
| gijutsu | 施設連携加算 | 50点 |
| gijutsu | 自家製剤加算（割錠） | 4点/7日 |
| gijutsu | 自家製剤加算（嚥下困難・粉砕） | 20点/7日 |

**主要ファイル**: `src/app/check/page.tsx`, `src/data/checkConditions.ts`, `src/data/additions.ts`

### ✅ `/comments` — レセプトコメント検索（実装済み）
- コード番号またはキーワードで全加算のコメントを検索・コピー
- **主要ファイル**: `src/app/comments/page.tsx`, `src/data/additions.ts`

### 🔶 `/other` — マニュアル・FAQ（FAQ部分のみ実装済み）
- FAQ: 8件（処方箋・保険・後発品・薬歴・算定）→ 実装済み
- マニュアルタブ: 「準備中」表示のみ
- 追加案: 記事データをTSファイルで定義するだけで実装できる構造

### ❌ `/kouhi` — 公費情報（未実装）
- プレースホルダーのみ（「Phase 3 実装予定」）
- 予定: 国公費（精神・難病・生保）、兵庫県・大阪府地方単独公費
- 追加案: `src/data/kouhiMaster.ts` を作り `/check` や `/comments` と同じパターンで実装

---

## データ型（主要）

```typescript
// src/types/index.ts
interface DrugMaster {
  id: string; genericName: string; brandName: string
  dosageForm: string; strengthMg: number; unit: string; updatedAt: string
}

// src/data/checkConditions.ts
interface PharmacySettings {
  kihonRyo: KihonRyo; chiiikiKasan: ChiiikiKasan
  renkeiKyo: boolean; biosimilarDelivered: boolean
  denshiRenkei: boolean; yakkanKyujitsu: boolean
}

interface PatientConditions {
  techoAri; sangatsuInai; onlineShido; basupToday; bukkaToday
  prescriptionDays; medicineCount
  mayakuOk; hairisuType; gaikagakuryoho; rmpShido; tokutei3roType
  nyuyoji; kyunyu; shoniTokutei
  kakariFollowup; kakariHoumon
  ippozukaDays; warijoOk; engeKonnan; shisetsuRenkei
  jofukuResult; isZaitakuPatient
  serviceShien; genyakuOk; infoProvision; infoProvision2; infoProvision3
  biosimilarDispensed; zaitakuVisit
  chozaigoKanri: 'none' | 'diabetes' | 'heartfailure'
  yakkanToday; denshiRenkeiToday
}
```

---

## 未対応・改善候補

### 今後の機能追加
- `/kouhi` 公費情報ページの実装
- `/other` マニュアルタブの記事追加
- 管理ページへのパスコード認証（現在は誰でもマスタを上書き可能）
- `/check` の薬局設定をFirebase共有化（現在はlocalStorageのみ・端末ごと）

### UI小改善（checkページ）
- 処方日数ステッパーに直接入力フィールドを追加（現状±7日刻みのみ）
- 内服薬の剤数上限を3剤に変更（`Math.min(10,...)` → `Math.min(3,...)`）
- 服薬情報等提供料1/2 をラジオボタン化

### スコープ外（意図的に未実装）
- 薬剤調製料（内服24点・屯服21点等）
- 薬剤料・特定保険医療材料
- 在宅患者訪問薬剤管理指導料
- 介護報酬、後発品減算、門前薬局等立地減算
- 計量混合調剤加算・時間外等加算・分割調剤
- 服用薬剤調整支援料2（令和9年6月1日以降1,000点で復活予定→その時に実装）

---

## 運用メモ

**薬価マスタ更新タイミング**: 年2回（4月・10月の薬価改定後）
1. 厚労省から「薬価基準収載医薬品コードリスト」全品目Excelをダウンロード
2. 「名前を付けて保存」→「CSV UTF-8（コンマ区切り）」
3. `/admin` でアップロード → Firebaseに保存 → 全端末に自動反映

**算定チェックのルール更新**: 改定のたびに `src/data/checkConditions.ts` の点数・条件を修正

**技術メモ**:
- 2つのレイアウトインスタンス: `div.lg:hidden`（モバイル）・`div.hidden.lg:flex`（デスクトップ）→ layout.tsx で両方に `{children}` を渡す構造
- localStorage key: `kaisan-navi-pharmacy-v1`（薬局設定）、`kaisan-navi-drug-master-v1`（薬価マスタキャッシュ）
