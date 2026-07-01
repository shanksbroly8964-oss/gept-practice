# QA Report — M2 聽力題庫 & 聽力/錯題本前端品管

**日期**：2026-07-01  
**品管範圍**：data/listening_*.json（9 檔）、index.html、js/listening.js、js/wrongbook.js 及相關依賴  
**最終結論**：**PASS** ✅  

---

## 一、題庫 JSON 檢查

### 1.1 各檔題數與驗證結果

| 檔案 | 題數 | JSON Parse | Schema | ID 不重複 | Options=3 | Answer∈Options | 結果 |
|------|------|-----------|--------|-----------|-----------|-----------------|------|
| listening_picture_G1.json | 23 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| listening_picture_G2.json | 25 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| listening_picture_G3.json | 24 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| listening_response_G1.json | 20 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| listening_response_G2.json | 20 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| listening_response_G3.json | 20 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| listening_conversation_G1.json | 16 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| listening_conversation_G2.json | 16 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| listening_conversation_G3.json | 16 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| **合計** | **180** | | | | | | |

### 1.2 細項檢查

- **Schema 完整性**：全部 180 題均含 id, grade, section="listening", type, level_tag[], source, audio_script, question, options, answer, explanation。picture 型均有 image 欄位。
- **Options 長度**：全為 3 選項（聽力三選一），無長度不符。
- **Answer 正確性**：全部 answer 均為 options 陣列內的完整文字，無不匹配。
- **Grade 一致性**：全部題目 grade 欄位與檔名年級一致。
- **ID 唯一性**：跨 9 檔共 180 個 ID，無重複。
- **年級難度分流**：G1 句短語速慢、用字淺（如 "The car is red."）；G2 中等長度（如 "A dog and a cat are sitting together under a big tree..."）；G3 較長較複雜（如含 when/while 複合句）。無明顯年級不符。
- **英文正確性**：語法與拼字均正確，用語自然。無發現錯誤。
- **Explanation**：全部使用繁體中文，能正確解釋答案理由。
- **audio_script 格式**：conversation 型均以 `\n` 換行分隔說話者（如 `A: ...\nB: ...`），TTS 可逐行朗讀。

---

## 二、前端檢查

### 2.1 index.html
- ✅ 正確引用 listening.js 與 wrongbook.js
- ✅ 缺 JSON 檔時不會整頁壞掉（data-loader.js 有 fetch error catch；UI 顯示「題庫準備中」而非 crash）

### 2.2 聽力模組 (listening.js)
- ✅ 使用 Web Speech API SpeechSynthesis，lang="en-US"
- ✅ 播放/重播按鈕：▶播放 → ⏹停止 → ▶重播
- ✅ 語速依年級：G1=0.7, G2=0.85, G3=1.0
- ✅ 年級分流：G1 僅看圖辨義(picture)；G2/G3 三種全開
- ✅ 作答後即時回饋：綠色/紅色標示 + 中文解析
- ✅ G1/G2 自動播放音檔，G3 不自動播放（需手動點擊）

### 2.3 錯題本 (wrongbook.js)
- ✅ 讀取 localStorage `gept_wrong`
- ✅ 篩選：年級 + 題型雙重篩選
- ✅ 清空：確認對話框 → localStorage.removeItem
- ✅ 重練：點選單題進入練習模式；答對自動從錯題本移除
- ✅ 作答即時回饋 + 中文解析

### 2.4 CSS (style.css)
- ✅ 聽力相關樣式：.subtype-selection, .listening-question, .listening-image, .conversation-box, .audio-controls, .play-btn
- ✅ 錯題本相關樣式：.wrongbook, .wb-*. .wrongbook-filters, .wrongbook-item, .wrongbook-empty
- ✅ RWD 適配：手機/平板/桌面

---

## 三、發現問題與已修正項

### 3.1 wrongbook.js — 正確答案高亮失效（已修正）
**問題**：錯題本選項列表中，正確答案無法高亮標示為綠色。原因是 `letter === item.question.answer` 將單一字母（如 "A"）與完整答案文字（如 "A. A boy is reading a book in the classroom."）比較，永遠不相等。

**修正**：`js/wrongbook.js:89-91` — 先以 `item.question.options.indexOf(item.question.answer)` 計算正確答案的索引，再轉為字母 (A/B/C)，再與選項字母比較。

### 3.2 wrongbook.js — 使用者答案僅顯示字母（已修正）
**問題**：錯題本中「你的答案」欄位只顯示單一字母（如 "A"），而非完整選項文字（如 "A. An apple"）。

**修正**：`js/wrongbook.js:104-106` — 將 `item.userAnswer` 字母轉換為索引，從 `item.question.options` 取出完整文字顯示。

### 3.3 wrongbook.js — 正確答案顯示可能重複前綴（已修正）
**問題**：picture 型題目的 answer 已包含 "A. " 前綴，若再次拼接會顯示 "A. A. ..."。

**修正**：`js/wrongbook.js:107-113` — 拼接前先檢查 answer 是否已含正確字母前綴。若已有則直接顯示，否則才拼接。

### 3.4 listening.js — autoPlayTimer 未清理（已修正）
**問題**：`showSubtypeSelection()`, `showComplete()`, `resetSession()` 三處未清除 `autoPlayTimer`。若使用者在自動播放前快速切換頁面，300ms 後 timer 觸發會嘗試操作已消失的 DOM 元素，導致 JS error。

**修正**：在 `js/listening.js` 的 `showSubtypeSelection()` (L43)、`showComplete()` (L338)、`resetSession()` (L37) 三處加入 `clearTimeout(autoPlayTimer)`。

---

## 四、仍待處理項

| # | 項目 | 說明 | 優先度 |
|---|------|------|--------|
| 1 | G1 conversation 資料未使用 | `listening_conversation_G1.json` 有 16 題，但 GRADE_SUBTYPES 設定 G1 僅開放 picture。若日後要開放可調整設定。 | 低（設計決策） |
| 2 | conversation 對話文字預先顯示 | 聽力測驗的 conversation 型在播放前即顯示全文對話框，學生可先閱讀再聽，可能降低聽力訓練效果。可考慮加入「顯示文稿」切換開關。 | 低（設計優化） |
| 3 | 錯題本重新練習後的 UI 狀態 | 練習完成後跳回錯題本列表，若僅一題且已移出（答對），列表為空時會顯示「沒有符合條件的錯題」，體驗可再微調。 | 低（UX 微調） |

---

## 五、最終結論

**PASS** ✅

M2 交付的聽力題庫（9 檔 JSON，共 180 題）與前端（聽力測驗 / 錯題本）經過完整品管：

- **題庫**：JSON 全數合法，Schema 完整，無 ID 重複，選項與答案正確，英文品質與年級難度分流皆合格。
- **前端**：聽力測驗（SpeechSynthesis 播放、年級分流、即時回饋）與錯題本（篩選、重練、清空、答對移除）功能完備。
- **已修正 4 項 bug**（3 項錯題本顯示、1 項 autoPlayTimer 潛在異常），均為前端問題，不涉及 JSON 資料。
- 未發現須標記 FAIL 的阻擋性問題。
