# DONE_E2E — Summary of All Changes

以下為本次所有檔案異動摘要。

---

## A. 已修復 Bug

### Bug1 — 聽力選項重複代碼 (A. A. ...)

**變更檔案**：
- `data/listening_picture_G1.json`
- `data/listening_picture_G2.json`
- `data/listening_picture_G3.json`

**內容**：每題的 `options` 與 `answer` 欄位開頭的 `A. `／`B. `／`C. ` 前綴已移除。`answer` 仍等於 `options` 中的某個元素，JSON 合法。

**修法腳本**：`node -e "... strip /^[A-D]\.\s+/ from options + answer ..."`（已執行）

---

### Bug2 — 口說朗讀 / 寫作看圖段落顯示「題庫準備中」

**根因**：`js/speaking.js` 的 `renderReadAloud()` `renderQA()` 與 `js/writing.js` 的 `renderSentence()` `renderParagraph()` 在設定 `container.innerHTML = html` 時，引用了只在父層 `showQuestion()` 內定義的 `container` 變數。因 JavaScript 函數作用域隔離，`container` 在這些 render 函數中未定義，拋出 `ReferenceError: container is not defined`。此例外被 `.catch()` 攔截後，誤報成「題庫準備中」。

**變更檔案**：
- `js/speaking.js`
  - L194 `container.innerHTML = html` → `document.getElementById('speaking-container').innerHTML = html`
  - L243 `container.innerHTML = html` → `document.getElementById('speaking-container').innerHTML = html`
  - `loadSubtype()` 內 `showQuestion()` 加 `try/catch`，區分 fetch 失敗（→ `showSubtypeError`）與 render 例外（→ `showRenderError`，顯示實際錯誤訊息）
- `js/writing.js`
  - L164 `container.innerHTML = html` → `document.getElementById('writing-container').innerHTML = html`
  - L209 `container.innerHTML = html` → `document.getElementById('writing-container').innerHTML = html`
  - `loadSubtype()` 同上加 `try/catch` + `showRenderError()`

---

### Bug3 — TTS 語速太快

**變更檔案**：
- `js/listening.js` — `speakNext()` 內 utterance.rate：G1 0.7→0.4, G2 0.85→0.45, G3 1.0→0.5
- `js/speaking.js` — `playDemo()` 內 utterance.rate：同上
- `js/mockexam.js` — `_playAudio()` 內 utter.rate：同上

**E2E 驗證**：TTS rate 全部 ≤ 0.5（G1=0.4，已確認）。

---

## B. E2E 測試基礎建設

**新增檔案**：
| 檔案 | 用途 |
|------|------|
| `package.json` | npm 專案設定，含 `test` 腳本 (`node e2e/e2e-tests.js`) |
| `e2e/server.js` | Node.js 靜態伺服器 (port 8080) |
| `e2e/e2e-tests.js` | 39 項 Playwright E2E 測試（headless Chromium） |

**安裝**：
```
npm install       # 安裝 playwright + http-server
npx playwright install chromium
```

**執行**：
```
npm test
```

---

## C. E2E 測試覆蓋範圍 (39 PASS / 0 FAIL)

| # | 流程 | 狀態 |
|---|------|------|
| T1 | 頁面載入 → 年級選擇器可見 | PASS |
| T2 | 三個年級按鈕存在 | PASS |
| T3 | 選 G1 → 導覽列出現 | PASS |
| T4a | Vocab/Grammar/Cloze/Reading 選項渲染正常 | PASS |
| T4b | 聽力子型、無雙重前綴、TTS 語速 0.4 | PASS |
| T4c | 寫作(單句/段落) textarea、字數統計、參考答案切換 | PASS |
| T4d | 口說(朗讀/QA) Demo+Record 按鈕、TTS 低速 | PASS |
| T4e | 模擬考載入、開始按鈕可見 | PASS |
| T4f | 進度儀表板載入 | PASS |
| T4-summary | 全部區塊無「題庫準備中」 | PASS |
| T5 | MCQ 選項無雙重前綴 "A. A. ..." | PASS |
| T6a | 作答流程（點選項→即時回饋→下一題）×5 | PASS |
| T6b | 錯題本可進入 | PASS |
| T7 | 錯題本篩選/清空按鈕存在 | PASS |
| T8 | 模擬考計時器、作答、顯示剩餘時間 | PASS |
| T9 | 進度規劃器（倒數計畫表） | PASS |
| T10 | 錄音 UI（狀態顯示以 headless 限制標記） | PASS |
| T11 | 麥克風拒絕時錯誤處理（headless 下 real getUserMedia 回 "Not supported"，代碼無 crash） | PASS |
| T12 | 年級切換 G1→G2→G3，題型仍可載入 | PASS |
| T13 | Auth stub（GeptAuth 特徵偵測、sign-in UI） | PASS |

---

## D. 未更動的檔案（不破壞既有功能）

- `firebase-config.js`
- `firebase.json`
- `.firebaserc`
- `.git` 目錄
- 其餘所有 data/*.json（僅聽力圖片 3 檔有改）

---

## E. 已知限制

- `navigator.mediaDevices.getUserMedia` 在 headless Chromium 無法被完整 mock。錄音按鈕渲染與錯誤處理（getUserMedia 失敗不 crash）已驗證。
- `SpeechSynthesis` mock 在 headless Chromium 可覆蓋成功（TTS rate 驗證通過）。
- Firebase 真實 OAuth 無法在 headless 跑，改以 `window.GeptAuth` slap 驗證 UI 響應。
