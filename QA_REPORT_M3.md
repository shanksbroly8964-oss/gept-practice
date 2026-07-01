# QA Report — M3 寫作/口說題庫 & 前端品管

**日期**：2026-07-01  
**品管範圍**：data/writing_*.json（6 檔）、data/speaking_*.json（6 檔）、index.html、js/writing.js、js/speaking.js  
**最終結論**：**PASS** ✅

---

## 一、題庫 JSON 檢查

### 1.1 各檔題數與驗證結果

| 檔案 | 題數 | JSON Parse | Schema | ID 不重複 | Grade 一致 | 難度分流 | 結果 |
|------|------|-----------|--------|-----------|-----------|----------|------|
| writing_sentence_G1.json | 27 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| writing_sentence_G2.json | 27 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| writing_sentence_G3.json | 30 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| writing_paragraph_G1.json | 12 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| writing_paragraph_G2.json | 12 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| writing_paragraph_G3.json | 12 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| speaking_readaloud_G1.json | 25 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| speaking_readaloud_G2.json | 25 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| speaking_readaloud_G3.json | 25 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| speaking_qa_G1.json | 25 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| speaking_qa_G2.json | 25 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| speaking_qa_G3.json | 25 | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
| **合計** | **270** | | | | | | |

### 1.2 Schema 完整性檢查

**寫作句子 (writing_sentence)**：
- 必備欄位：id, grade, section="writing", type="sentence", level_tag[], source, instruction, prompt, sample_answer, checkpoints[], explanation
- 84 題全數通過，無缺欄位

**寫作段落 (writing_paragraph)**：
- 比 sentence 多：image, min_words
- 36 題全數通過，image 皆以 emoji 表示（詳見 3.3），min_words G1=30 / G2=50 / G3=70

**口說朗讀 (speaking_readaloud)**：
- 必備欄位：id, grade, section="speaking", type="readaloud", level_tag[], source, text, tips[], explanation
- 75 題全數通過

**口說問答 (speaking_qa)**：
- 必備欄位：id, grade, section="speaking", type="qa", level_tag[], source, audio_script, question, sample_answer, tips[], explanation
- 75 題全數通過

### 1.3 ID 唯一性與 Grade 一致性
- 跨 12 檔共 270 個 ID，使用自動化腳本驗證：**零重複**
- 全部題目 `grade` 欄位與檔名年級完全一致

### 1.4 年級難度分流查核

| 題型 | G1 | G2 | G3 | 評估 |
|------|----|----|----|------|
| sentence | 肯定改否定、and/but/because 合併、基本重組 | 過去式/未來式、比較級/最高級、when/if/so 合併 | 被動語態、完成式、間接敘述、關代、假設語氣 | ✅ 遞增明顯 |
| paragraph | 30 字、簡單場景（野餐、遊樂場、生日） | 50 字、過去式敘事（運動會、露營、看牙） | 70 字、論述型（未來世界、環保、AI、志工） | ✅ 遞增明顯 |
| readaloud | 單句 ∼10 字（問候、自我介紹） | 段落 ∼30-50 字（日常作息、購物、問路） | 複合段落 ∼60-100 字（氣候變遷、AI、寓言） | ✅ 遞增明顯 |
| qa | 個人基本問答（名字、年齡、喜好） | 情境問答（點餐、問路、購物、天氣） | 開放式論述（科技利弊、環保、友誼、夢想） | ✅ 遞增明顯 |

無發現年級不符題目。

### 1.5 英文正確性
- 所有 sample_answer / text / audio_script 經過逐筆檢查，文法與拼字正確，用語自然。
- 無發現中式英文或拼字錯誤。
- Explanation 皆為繁體中文，內容正確說明。

### 1.6 Answer 格式全庫一致性確認
- M3 寫作/口說題庫為「自我對照題型」，使用 `sample_answer` / `checkpoints` / `tips` 欄位，**無 options/answer 欄位**，不參與 quiz-engine 的選項判分。
- 不會破壞 M1/M2 現有 answer 格式慣例（quiz-engine.js `getCorrectLetter()` 同時支援字母與全文）。
- 與 M1 `_schema_example.json` 設計保持一致：選擇題用 answer，自我對照題用 sample_answer。

---

## 二、前端檢查

### 2.1 index.html
- ✅ L148-155 正確引用 8 支 JS：storage.js → data-loader.js → quiz-engine.js → ui-renderer.js → listening.js → wrongbook.js → writing.js → speaking.js → app.js
- ✅ nav 按鈕新增「寫作測驗」(L63-66) 與「口說測驗」(L67-70)，與 M1/M2 按鈕共存
- ✅ 新增 `#writing-container` (L85-87)、`#speaking-container` (L89-91) 容器
- ✅ 缺 JSON 時不會整頁壞掉（data-loader.js catch 錯誤，UI 顯示「題庫準備中」）

### 2.2 寫作模組 (writing.js)
- ✅ 子題型選擇：單句寫作 / 看圖段落寫作
- ✅ sentence：textarea 輸入 + 「看參考答案」按鈕，顯示 sample_answer / checkpoints / explanation
- ✅ paragraph：textarea 輸入 + 字數統計（即時比對 min_words）+ 「看範文」按鈕 + 圖片顯示
- ✅ 字數不足時 CSS 類別 `word-count-warn` 標示警告
- ✅ shuffle 題目隨機排序
- ✅ 缺題庫時顯示「題庫準備中」＋返回按鈕

### 2.3 口說模組 (speaking.js)
- ✅ 子題型選擇：朗讀 / 回答問題
- ✅ 朗讀：SpeechSynthesis en-US 示範朗讀 + MediaRecorder 錄音/回放
- ✅ QA：播放題目音檔（audio_script）→ 錄音作答 → 對照 sample_answer
- ✅ 語速依年級分流：G1=0.7, G2=0.85, G3=1.0
- ✅ 錄音權限被拒或不支援時顯示友善提示（不整頁崩潰）
- ✅ shuffle 題目隨機排序
- ✅ 缺題庫時顯示「題庫準備中」＋返回按鈕

### 2.4 全站回歸確認
- M1 閱讀（vocab/grammar/cloze/reading）：nav 按鈕 + quiz-engine 路由未受影響，獨立渲染路徑
- M2 聽力（listening.js）：獨立容器 `#listening-container`，未受 writing/speaking 影響
- M2 錯題本（wrongbook.js）：獨立容器 `#wrongbook-container`，數據儲存未受影響
- `data-loader.js`：共用模組，fetch 邏輯未改變
- `quiz-engine.js`：未修改
- `storage.js` / `ui-renderer.js`：未修改

---

## 三、發現問題與已修正項目

### 3.1 HIGH — speaking.js ReadAloud tips 陣列以字串形式渲染

**問題**：`renderReadAloud()` 使用 `escHtml(q.tips)` 將陣列直接轉為字串。JavaScript 對陣列呼叫 `.toString()` 會以逗號串接，導致多個提示擠在同一行顯示為 `提示1,提示2,提示3`。

**影響**：所有朗讀題（75 題）的 tips 顯示不正確，使用者看到的是一串逗號分隔文字而非條列式提示。

**修正**：`js/speaking.js:160-169` — 將 `escHtml(q.tips)` 改為 `forEach` 迭代，以 `<ul class="checkpoint-list">` + `<li class="checkpoint-item">` 逐條渲染。

### 3.2 HIGH — speaking.js QA tips 陣列同問題

**問題**：`renderQA()` 同樣使用 `escHtml(q.tips)` 將陣列直接轉字串，導致 QA 75 題的 tips 也是逗號串接。

**修正**：`js/speaking.js:205-211` — 同 3.1，改為 `<ul>` + `<li>` 逐條渲染。

### 3.3 MEDIUM — speaking.js QA 未顯示 explanation

**問題**：`renderQA()` 僅顯示 sample_answer 和 tips，但 JSON 中有完整的 `explanation` 欄位（繁體中文解說），完全未被渲染。

**影響**：75 題 QA 題的 explanation 對使用者隱藏，無法提供學習輔助說明。

**修正**：`js/speaking.js:212-216` — 新增 explanation 渲染區塊，在參考答案區塊中顯示 `📖 說明`。

### 3.4 MINOR — writing paragraph image 為 emoji 字串

**問題**：`writing_paragraph_*.json` 的 `image` 欄位使用 emoji 字串（如 `"🧑‍🤝‍🧑👨‍👩‍👧‍👦🧺☀️🌳"`），而非實際圖片 URL。

**狀態**：額外標記，不做修正。emoji 可作為輕量情境提示，後續可考慮升級為真實插圖。目前 `renderParagraph()` 會將 emoji 字串渲染在 `<div class="writing-image">` 中，使用者可看到圖標。

### 3.5 未修正但已標記的項目

| # | 檔案 | 問題 | 優先度 |
|---|------|------|--------|
| 1 | speaking.js | playDemo() 使用 `q.audio_script \|\| q.question` 作為 QA 朗讀文字，但 `q.question` 欄位同時包含中英雙語（如 `"What is your name?（你叫什麼名字？）"`），TTS 會連中文一起唸，語音體驗不佳 | 低（設計優化） |
| 2 | writing_paragraph_*.json | image 僅 emoji 字串，非實際圖片 | 低（後續可升級插圖） |
| 3 | speaking_readaloud_*.json | tips 欄位存為陣列（正確），但 writing.js 中的 tips 概念用 checkpoints 替代，命名不一 | 低（設計一致性） |

---

## 四、最終結論

### PASS ✅

M3 交付的寫作/口說題庫（12 檔 JSON，共 270 題）與前端（寫作測驗 / 口說測驗）經過完整品管：

- **題庫**：JSON 全數合法（12/12），Schema 完整，270 個 ID 零重複，難度流水線 G1→G2→G3 遞增合理，英文正確性無誤。
- **前端**：寫作（文字輸入、參考答案對照、字數統計）與口說（SpeechSynthesis 示範、MediaRecorder 錄音、權限容錯）功能完備，缺檔不壞頁。
- **已修正 3 項 bug**（2 項 tips 陣列渲染錯誤、1 項 QA explanation 未顯示），均為前端渲染問題。
- **全站回歸**：M1 閱讀 / M2 聽力 / M2 錯題本 功能未受影響，共用模組未被修改。
- 無發現須標記 FAIL 的阻擋性問題。

---

*報告結束*
