# 加算ナビ 次セッション引き継ぎ

プロジェクト: `C:\Users\non09\OneDrive\デスクトップ\claude\kaisan-navi\`
令和8年度調剤報酬改定チェックツール（Next.js App Router + TypeScript + Tailwind CSS v4）

---

## 直近セッションで完了した作業（高優先度4件の新規実装）

### 実装済み新規加算（令和8年度）

| # | 項目 | 点数 | 実装内容 |
|---|------|------|---------|
| 1 | 夜間・休日等加算 | 40点 | PharmacySettings に `yakkanKyujitsu`・PatientConditions に `yakkanToday` を追加 |
| 2 | 小児特定加算 | 350点・月1回 | PatientConditions に `shoniTokutei` を追加。乳幼児服薬指導加算と同時算定可 |
| 3 | 調剤後薬剤管理指導料（糖尿病） | 60点・月1回 | PatientConditions に `chozaigoKanri: 'none'\|'diabetes'\|'heartfailure'` を追加 |
| 4 | 調剤後薬剤管理指導料（慢性心不全） | 60点・月1回 | 同上。地域支援体制加算届出薬局のみ算定可 |
| 5 | 施設連携加算 | 50点・月1回 | PatientConditions に `shisetsuRenkei` を追加。外来服薬支援料2（一包化）の加算 |

修正対象ファイル: `additions.ts` / `checkConditions.ts` / `app/check/page.tsx` すべて完了

---

## 現在のファイル状態

### additions.ts の全エントリ（実装済み）

| カテゴリ | ID | 名称 | 点数 |
|----------|-----|------|------|
| kihon | kihon-1〜tokubetsu-b | 調剤基本料7区分 | 47/30/25/20/37/5/3点 |
| kihon | chiiiki-1〜5 | 地域支援加算5区分 | 27/59/67/37/59点 |
| kihon | renkeikyo | 連携強化加算 | 5点 |
| kihon | yakkan-kyujitsu | 夜間・休日等加算 | 40点 ★新規 |
| kihon | basup-hyoka | 調剤ベースアップ評価料 | 4点 |
| kihon | bukka-tairyo | 調剤物価対応料 | 1点 |
| kihon | biosimilar-taisei | バイオ後続品調剤体制加算 | 50点（特別A→5点） |
| kihon | denshi-renkei-taisei | 電子的調剤情報連携体制整備加算 | 8点 |
| kihon | zaitaku-taisei-1/2i/2ro | 在宅薬学総合体制加算3区分 | 30/100/50点 |
| yakugaku | fukuyaku-kihon | 服薬管理指導料①（手帳あり） | 45点 |
| yakugaku | fukuyaku-techo-nashi | 服薬管理指導料②（手帳なし等） | 59点 |
| yakugaku | fukuyaku-online-shido | 服薬管理指導料③（オンライン）| 59点 |
| yakugaku | chozai-kanri-tan/cho | 調剤管理料（27日以下/28日以上）| 10/60点 |
| yakugaku | mayaku-shido | 麻薬管理指導加算 | 22点 |
| yakugaku | tokutei-1i/1ro/2/3i/3ro | 特定薬剤管理指導加算 | 10/5/100/5/10点 |
| yakugaku | nyuyoji-fukuyaku | 乳幼児服薬指導加算 | 12点 |
| yakugaku | shoni-tokutei | 小児特定加算 | 350点 ★新規 |
| yakugaku | kyunyu-shido | 吸入薬管理指導加算 | 30点 |
| yakugaku | kakari-followup | かかりつけ薬剤師フォローアップ加算 | 50点 |
| yakugaku | kakari-houmon | かかりつけ薬剤師訪問加算 | 230点 |
| yakugaku | zanzai-chosei | 調剤時残薬調整加算 | 30点（在宅/かかりつけ50点） |
| yakugaku | yugai-jiko-boshi | 薬学的有害事象等防止加算 | 30点（在宅/かかりつけ50点） |
| yakugaku | chozaigo-kanri-diabetes | 調剤後薬剤管理指導料（糖尿病） | 60点 ★新規 |
| yakugaku | chozaigo-kanri-heart | 調剤後薬剤管理指導料（慢性心不全） | 60点 ★新規 |
| tokutei | gairaifukuyaku-shien | 外来服薬支援料1 | 185点 |
| tokutei | fukuyaku-chosei-shien | 服用薬剤調整支援料1 | 125点 |
| tokutei | fukuyaku-joho-teikyoryo/2/3 | 服薬情報等提供料1/2/3 | 30/20/50点 |
| gijutsu | gairaifukuyaku-shien-2 | 外来服薬支援料2（一包化） | 34点/7日・43日以上240点 |
| gijutsu | shisetsu-renkei | 施設連携加算 | 50点 ★新規 |
| gijutsu | warijokazan | 自家製剤加算（割錠） | 4点/7日 |
| gijutsu | enge-konnan | 自家製剤加算（嚥下困難・粉砕） | 20点/7日 |

### checkConditions.ts の全フィールド

```typescript
interface PharmacySettings {
  kihonRyo: KihonRyo
  chiiikiKasan: ChiiikiKasan
  renkeiKyo: boolean
  basupDelivered: boolean
  biosimilarDelivered: boolean
  denshiRenkei: boolean
  yakkanKyujitsu: boolean        // ★新規: 夜間・休日等加算 施設基準届出あり
}

interface PatientConditions {
  techoAri, sangatsuInai, onlineShido
  bukkaAlreadyClaimed
  prescriptionDays, medicineCount
  mayakuOk, hairisuType
  gaikagakuryoho
  rmpShido, tokutei3roType
  nyuyoji, kyunyu
  shoniTokutei: boolean          // ★新規: 小児特定加算（350点・月1回）
  kakariFollowup, kakariHoumon
  ippozukaDays, warijoOk, engeKonnan
  shisetsuRenkei: boolean        // ★新規: 施設連携加算（50点・月1回）
  jofukuResult, isZaitakuPatient
  serviceShien
  infoProvision, infoProvision2, infoProvision3
  genyakuOk
  biosimilarDispensed
  zaitakuVisit
  chozaigoKanri: 'none' | 'diabetes' | 'heartfailure'  // ★新規: 調剤後薬剤管理指導料
  yakkanToday: boolean           // ★新規: 今回夜間・休日受付
}
```

---

## 未実装・要検討（低優先度）

### UI改善

1. **処方日数ステッパーに直接入力フィールドを追加**
   - 現状: ±7日刻みのみ → 任意の日数を入力できないと不便
   - StepperRow コンポーネントを拡張して input フィールドを追加

2. **内服薬の剤数ステッパー上限を3剤に変更**
   - 現状: `Math.min(10, ...)` → `Math.min(3, ...)` に変更（調剤管理料の算定上限が3剤）
   - StepperRow の onPlus に渡している min値の変更のみ

3. **服薬情報等提供料1/2 をラジオボタン化**
   - 現状: 2つの独立チェックボックス（同月算定不可の警告付き）
   - ラジオ: なし / 料1（30点）/ 料2（20点） に変更するとより直感的

### 要告示確認（⚠ 現在実装に注記あり）

- 外来服薬支援料2（一包化）の43日上限切替・240点
- 自家製剤加算（割錠）4点/7日の算定根拠

---

## PDF照合結果サマリー（全セクション）

点数の齟齬: **ゼロ**（全実装済み項目はPDFと一致）

参照PDF: `C:\Users\non09\OneDrive\デスクトップ\令和8年度　調剤報酬改定　点数表.pdf`（日本薬剤師会作成・令和8年5月28日）

⊘ スコープ外（意図的に未実装）:
- 薬剤調製料（内服24点・屯服21点・外用10点等）
- 薬剤料・特定保険医療材料
- 在宅患者訪問薬剤管理指導料（650/320/290点等）
- 各種在宅関連加算（緊急訪問・共同指導等）
- 介護報酬（居宅療養管理指導費等）
- 後発医薬品減算（▲5点）・門前薬局等立地依存減算（▲15点）
- 計量混合調剤加算・時間外等加算・分割調剤

---

## 技術メモ

- 2つのレイアウトインスタンス: `div.lg:hidden`（モバイル）・`div.hidden.lg:flex`（デスクトップ）
  → layout.tsx で両方に `{children}` を渡す構造。デバッグ時は DOM に両インスタンスが存在
- localStorage key: `kaisan-navi-pharmacy-v1`
- 服用薬剤調整支援料2: 令和9年6月1日以降に1,000点で復活予定→そのときに再実装
