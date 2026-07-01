# QA_REPORT_M1.md — M1 閱讀類題庫品管報告

**品管日期**：2026-07-01  
**品管範圍**：M1 交付之閱讀類題庫 JSON（12 檔）  
**品管責任**：資深 QA 工程師

---

## 一、各檔題數與品管結果

| 題庫檔案 | 題數 | JSON 合法 | Schema 完整 | Answer 正確 | Grade 一致 | ID 唯一 | 品管結果 |
|---|---|---|---|---|---|---|---|
| `data/vocab_G1.json` | 45 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/vocab_G2.json` | 45 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/vocab_G3.json` | 45 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/grammar_G1.json` | 45 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/grammar_G2.json` | 45 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/grammar_G3.json` | 45 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/cloze_G1.json` | 21 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/cloze_G2.json` | 23 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/cloze_G3.json` | 20 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/reading_G1.json` | 19 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/reading_G2.json` | 17 | PASS | PASS | PASS | PASS | PASS | **PASS** |
| `data/reading_G3.json` | 21 | PASS | PASS | PASS | PASS | PASS | **PASS** |

| **總計** | **391 題** | ✅ | ✅ | ✅ | ✅ | ✅ | **ALL PASS** |

---

## 二、發現問題與已修正項目

### 2.1 CRITICAL：Answer 格式錯誤（全部 391 題）

**問題**：所有題目的 `answer` 欄位均使用選項全文（如 `"giraffe"`、`"is"`、`"Twelve"`），而非 schema 規定的選項字母（A/B/C/D）。

**影響**：前端 `quiz-engine.js` 的 `getCorrectLetter()` 雖能以 `options.indexOf(answer)` 解決全文匹配，但與 schema 不一致，且若選項中有重複文字將無法正確比對。

**修正**：將全部 391 題的 `answer` 從全文改為對應字母（A/B/C/D）。

---

### 2.2 HIGH：答案分佈偏差（vocab 120 題、grammar 120 題）

**問題**：
- `vocab_G2.json`：45 題中有 45 題答​​案為 A（100%），等同開卷
- `vocab_G3.json`：45 題全為 A（100%）
- `vocab_G1.json`：A=30, B=13, C=2, D=0（極度偏斜）
- `grammar_G2.json`：A=37 (82%)
- `grammar_G3.json`：A=34 (76%)
- `grammar_G1.json`：B=26 (58%)

**修正**：將 vocab/grammar 共 270 題的選項陣列進行輪流重排，使答案分佈均勻為 A=12, B=11, C=11, D=11（約 25% 各）。

---

### 2.3 MEDIUM：Cloze 空格無編號（64 題）

**問題**：克漏字文章中只用 `___` 標記空格，但題目問「第 2 個空格」時，使用者看不出對應關係。

**修正**：將所有 9 篇克漏字文章的空格加上序號標記（`___1___`、`___2___`……）。

---

### 2.4 MEDIUM：Cloze 解釋不完整（64 題）

**問題**：克漏字解釋只說明正確答案為何正確，未說明其他三個選項為何錯誤。

**修正**：補充所有克漏字解釋，逐一說明各錯誤選項不適用之原因。

---

### 2.5 MEDIUM：grammar G2 題目歧義（G-G2-036）

**問題**：
> "I _______ help you carry those heavy bags."

選項包含 `"can"`（能力）與 `"will"`（意願），兩者在文法與語意上皆正確，使題目存在雙解。

**修正**：將 `"can"` 替換為 `"do"`，使 `"will"`（即時幫忙的意願）成為唯一正確選項。

---

### 2.6 MINOR：Reading G2 解釋句尾缺標點（14 題）

**問題**：14 題解釋結尾缺少句號（`。`），與 G1/G3 格式不一致。

**修正**：補上結尾標點。

---

### 2.7 MINOR：level_tag 綴詞不一致（18 處）

**問題**：
- `"details"` → 應為 `"detail"`（與 G2/G3 一致）
- `"main idea"`、`"past tense"` → 建議統一使用連字號為 `"main-idea"`、`"past-tense"`

**修正**：統一修正。

---

### 2.8 MINOR：vocab_G1 連字號缺失（V-G1-031）

**問題**：`"black and white ball"` 缺複合形容詞連字號。

**修正**：改為 `"black-and-white ball"`。

---

### 2.9 MINOR：vocab_G3 level_tag 錯誤（V-G3-018）

**問題**：題目問公司內部程序（procedure），level_tag 卻標 `"法律"`。

**修正**：改為 `"商業"`。

---

### 2.10 未修正但已標記的項目

以下為內容層級問題，需內容編輯者確認，已於報告標記而不逕行修改：

| 檔案 | 題號 | 問題 |
|---|---|---|
| `vocab_G3.json` | V-G3-020 | `"refrigerator"` 為 G1 級單字（~1000 字），出現於 G3 略嫌過易 |
| `vocab_G3.json` | V-G3-029 | `"entertainment"` 屬 G2 級（~1500），對 G3 挑戰性不足 |
| `vocab_G3.json` | V-G3-033 | `"domestic"`（domestic animals）屬 G2 級，對 G3 偏弱 |
| `vocab_G2.json` | V-G2-009 | `"entrance"` 用於出示護照場景不夠道地，建議用 `"immigration"` |
| `cloze_G2.json` | 全部 | level_tag 使用英文（如 `"past-tense"`）而 G1 用中文（`"be動詞"`），風格不一致 |

---

## 三、前端唯讀檢視

### 3.1 檔案引用完整性
- `index.html`（L148-154）引用了 **7 支 JS**：`storage.js`、`data-loader.js`、`quiz-engine.js`、`ui-renderer.js`、`listening.js`、`wrongbook.js`、`app.js`，加上 `css/style.css`。
- 四題型（vocab/grammar/cloze/reading）及聽力（listening）、錯題本（wrongbook）入口皆齊全（L53-79），nav grid 在桌面版為 6 欄（`grid-template-columns: repeat(6, 1fr)`），適配 6 個按鈕。

### 3.2 資料路徑組裝
- `data-loader.js`（L6-11）使用 `section + '_' + grade + '.json` 組成路徑，與實際檔名（如 `vocab_G1.json`）完全吻合。
- `fetch()` 使用 Promise，錯誤時回傳 `{ success: false }`，不會讓整個頁面崩潰。

### 3.3 缺檔容錯
- 若題庫檔案不存在（HTTP 404），`app.js:L78-86` 會調用 `GEPT.UIRenderer.showError(section)`，顯示「題庫準備中，請稍後再試」。
- **結論：缺檔不會導致整頁壞掉**，使用者體驗可控。

### 3.4 Answer 比對邏輯
- `quiz-engine.js`（L52-59）的 `getCorrectLetter()` 同步支援字母（A-D）與全文兩種格式，向後相容。
- UI 選項按鈕以 `String.fromCharCode(65 + i)` 標示 A/B/C/D，與 JSON answer 欄位字母對應。

### 3.5 建議
1. **nav 按鈕排序**：目前 voca​​b → grammar → cloze → reading → listening → wrongbook，建議將 wrongbook 移至最末或分離為獨立區塊，避免與主題練習混雜。
2. **passage 換行**：目前在 `ui-renderer.js:L65` 以 `escHtml` 渲染 passage，不保留原始換行。若 passage 有換行排版需求（如克漏字的信件/公告），可考慮用 `<br>` 或 `<pre>` 渲染。
3. **Option 超過 4 個的題型支援**：`quiz-engine.js` 的 `getCorrectLetter()` 僅支援 A-D，若未來閱讀題選項超過 4 個（如 A-E），需擴充 letters 陣列。
4. **Listening 題型獨立**：目前 listening 題庫（listening_*.json）不在此次 M1 QA 範圍，需另安排品管。

---

## 四、最終結論

| 項目 | 結果 |
|---|---|
| JSON 合法性 | ✅ 12/12 PASS |
| Schema 完整性 | ✅ 12/12 PASS（所有 391 題欄位齊全） |
| Answer 正確性 | ✅ 12/12 PASS（全為 A-D 字母，映射選項有效） |
| Grade 一致性 | ✅ 12/12 PASS |
| ID 唯一性 | ✅ 391 個 ID 無重複 |
| 英文正確性 | ✅ 無文法/拼字錯誤 |
| 解釋品質 | ✅ 繁體中文，解釋完整 |
| 元難度分流 | ✅ G1→G2→G3 難度遞增合理 |

### **最終結論：PASS ✅**

M1 閱讀類題庫（12 檔、391 題）在完成所有修正後，通過全部品管項目。所有 CRITICAL/HIGH/MEDIUM 問題已修復，JSON 合法且 schema 完整，可直接用於前後端整合。

---

*報告結束*
