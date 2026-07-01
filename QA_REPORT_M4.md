# QA Report — M4 限時模擬考／進度追蹤／Firebase 登入同步 + 全站最終回歸

**日期**: 2026-07-01  
**專案**: gept-elementary-app  
**範圍**: M4 模組品管 + M1/M2/M3/M4 全站回歸  
**結論**: **PASS** (2 項已修正，無遺留重大問題)

---

## 1. M4 各功能檢查

### 1.1 index.html 引用完整性

| 檢查項 | 狀態 |
|--------|------|
| `js/mockexam.js` 已引用 (defer) | PASS |
| `js/progress.js` 已引用 (defer) | PASS |
| `js/firebase-config.js` 已引用 (defer) | PASS |
| `js/auth.js` 已引用 (defer) | PASS |
| M1/M2/M3 原有 script 未破壞 | PASS |
| 所有 13 支 .js 檔案皆存在 | PASS |
| `#auth-container` DOM 節點存在 | PASS |
| `#mockexam-root` DOM 節點存在 | PASS |
| `#progress-root` DOM 節點存在 | PASS |

### 1.2 限時模擬考 (mockexam.js)

| 檢查項 | 狀態 | 說明 |
|--------|------|------|
| 從既有題庫組卷 | PASS | 透過 `GEPT.DataLoader.fetchQuestions()` 依 `GRADE_CONFIG` 拉取 |
| 年級分流 (G3/G2/G1) | PASS | G3: 45題/50分, G2: 25題/35分, G1: 16題/20分 |
| 倒數計時 | PASS | `setInterval` 每 1s 更新, 進度條 + 文字 |
| 時間到自動交卷 | PASS | `timeRemaining <= 0` 觸發 `submitExam()` |
| 答題計分 | PASS | 逐題比對 `getCorrectIndex()`，累積 section stats |
| 各題型正確率 | PASS | 結果頁依 sectionOrder 輸出表格 |
| 錯題進 `gept_wrong` | PASS | `GEPT.Storage.addWrongAnswer()` 於答錯時呼叫 |
| 聽力播放 (TTS) | PASS | `playAudio()` 使用 `SpeechSynthesisUtterance`，G1 rate 0.7 |
| 重新測驗 / 返回 | PASS | `_backToMenu()` 清理 timer + audioSynth |

**answer 慣例**: `getCorrectIndex()` (mockexam.js:382-393) 支援兩格式：
- 單字母 A-D → 轉索引
- 全文 → `options.indexOf(ans)` 比對
- 含前綴格式 (e.g. "A. 選項全文") → regex 清理後比對  
與 quiz-engine / listening 一致，未破壞慣例。

### 1.3 進度追蹤 (progress.js)

| 檢查項 | 狀態 | 說明 |
|--------|------|------|
| 讀取 localStorage 統計 | PASS | `getAllStats()` 從 `gept_stats` 讀，依 grade 分群 |
| 錯題數計算 | PASS | `getWrongCount()` 從 `gept_wrong` 遍歷計數 |
| 總練習量 / 正確率 | PASS | 彙總所有題型正確/錯誤數 |
| 各題型練習統計表 | PASS | 含練習量/答對/答錯/正確率 + mini bar |
| 倒數計畫表 | PASS | 可設定考試日，計算剩餘天數 |
| 每日建議練習 | PASS | 依年級給定每日單字/文法/聽力/閱讀量 |
| 每日打卡 checklist | PASS | 最多顯示 30 天，支援 checkbox 切換 |
| 計畫儲存至 localStorage | PASS | `savePlan()` 寫 `gept_exam_plan` |

### 1.4 Firebase 登入／同步 (firebase-config.js + auth.js)

| 檢查項 | 狀態 | 說明 |
|--------|------|------|
| `window.GeptAuth` 暴露 | PASS | auth.js IIFE 回傳完整 API |
| API: `init` | PASS | 自動於 DOMContentLoaded 呼叫 |
| API: `login` | PASS | Google signInWithPopup |
| API: `logout` | PASS | signOut |
| API: `getUser` | PASS | 回傳 `currentUser` |
| API: `onUser` | PASS | callback 註冊; 現有用戶立即回呼 |
| API: `syncProgress` | PASS | Firestore `users/{uid}` set merge |
| API: `loadProgress` | PASS | Firestore get → resolve(data or null) |
| `#auth-container` 注入 UI | PASS | renderUI() 依登入狀態繪製按鈕/頭像 |
| SDK placeholder 提示 | PASS | `showUnconfigured()` 顯示「雲端同步未設定」disabled button |
| localStorage 不因 Firebase 未設定而失效 | PASS | `isConfigValid()` → false 時 skip SDK loading |
| progress.js feature-detect 呼叫 | PASS | `if (window.GeptAuth && typeof GeptAuth.syncProgress === 'function')` |
| progress.js 無硬相依 Firebase | PASS | loadProgress/syncProgress 皆在 try/catch 內 |

### 1.5 契約一致性

| 合約項 | auth.js 提供 | progress.js/mockexam.js 使用 | 一致? |
|--------|-------------|-----------------------------|--------|
| `window.GeptAuth` | ✓ | progress.js 使用 `window.GeptAuth` | PASS |
| `GeptAuth.init()` | ✓ | 內部自動呼叫 | PASS |
| `GeptAuth.login()` | ✓ | inline onclick in renderUI | PASS |
| `GeptAuth.logout()` | ✓ | inline onclick in renderUI | PASS |
| `GeptAuth.getUser()` | ✓ | renderUI 內部使用 | PASS |
| `GeptAuth.onUser()` | ✓ | (未由其他模組呼叫) | PASS |
| `GeptAuth.syncProgress()` | ✓ | progress.js savePlan() | PASS |
| `GeptAuth.loadProgress()` | ✓ | progress.js show() | PASS |
| `#auth-container` | auth.js 寫入 | index.html:43 | PASS |
| `#progress-root` | progress.js 寫入 | index.html:152 | PASS |
| `#mockexam-root` | mockexam.js 寫入 | index.html:149 | PASS |
| script 載入順序 | firebase-config → auth (defer) | progress/mockexam check GeptAuth at runtime | PASS |

---

## 2. 全站回歸結果

### 2.1 M1 — 閱讀四題型 (vocab / grammar / cloze / reading)

| 檢查項 | 狀態 |
|--------|------|
| quiz-engine 組卷 (隨機抽 10 題) | PASS |
| 選項渲染 (A/B/C/D) | PASS |
| answer 全文比對正確率 | PASS |
| 累積統計 (正確/錯誤/正確率) | PASS |
| 錯題進 gept_wrong | PASS |
| 完成頁面 (再做一次) | PASS |
| 缺少題庫檔時不壞頁 (showError) | PASS |

### 2.2 M2 — 聽力三題型 + 錯題本

| 檢查項 | 狀態 |
|--------|------|
| listening.js 三子型選單 | PASS |
| audio TTS 播放 / 停止 | PASS |
| G1/G2 auto-play, G3 手動 | PASS |
| 答題回饋 + 錯題記錄 | PASS |
| 錯題本 (wrongbook.js) 列出全錯題 | PASS |
| 篩選 (年級/題型) | PASS |
| 重新練習 + 答對自動移除 | PASS |
| 清空確認對話 | PASS |
| 錯題本 userAnswer 相容全文/字母兩格式 | PASS |

### 2.3 M3 — 寫作 + 口說

| 檢查項 | 狀態 |
|--------|------|
| writing.js 兩子型 (sentence/paragraph) | PASS |
| 寫作區 textarea + 字數計數 | PASS |
| 參考答案/範文 toggle | PASS |
| 檢核項目 + 說明 | PASS |
| speaking.js 兩子型 (readaloud/qa) | PASS |
| TTS 示範播放 | PASS |
| MediaRecorder 錄音 + 播放 | PASS |
| 麥克風權限錯誤提示 | PASS |
| 缺題庫不壞頁 | PASS |

### 2.4 M4 — 模擬考 + 進度 (同上 §1，不再重複)

---

## 3. 問題與已修正

### 3.1 [FIXED] `ui-renderer.js` hideAllMain() 未隱藏 M4 容器

- **檔案**: `js/ui-renderer.js:166-169`
- **問題**: `hideAllMain()` 持有的 DOM id 清單缺少 `mockexam-root` 和 `progress-root`，導致從 M4 模組切換至一般題型時容器殘留。
- **修正**: 將 `mockexam-root` 與 `progress-root` 加入 `ids` 陣列。
- **影響**: M1/M2/M3 頁面切換不受影響，僅 M4↔其他模組切換時會出現雙容器顯示。

### 3.2 [FIXED] `progress.js` mergeRemoteData() 全量覆蓋 local 資料

- **檔案**: `js/progress.js:81-97`
- **問題**: `mergeRemoteData()` 直接以 `localStorage.setItem` 全量覆蓋 stats/wrong/plan，若遠端僅含部分年級資料，其他年級本地記錄會遺失。
- **修正**: 改為 `mergeObjectByGrade()` 逐 grade 合併，保留遠端未涵蓋的年級資料。
- **影響**: 僅在 Firebase 同步啟用且跨裝置使用時會觸發。MVP 階段低風險。

---

## 4. 待處理項目

| 項目 | 優先度 | 說明 |
|------|--------|------|
| stats/wrong 缺乏主動同步機制 | Low | 僅 plan 透過 syncProgress 上傳雲端；stats/wrong 僅單向 load。跨裝置統計需手動觸發同步。 |
| 模擬考進行中離開無確認對話 | Low | 點擊其他 nav 按鈕會呼叫 `MockExam.init()` 重置考卷，未提示用戶確認。建議加 `beforeunload` 或確認對話。 |
| `progress.js` 重繪頻率偏高 | Low | 每次 checkbox 切換即 `renderDashboard()` 全頁重繪。可改為局部 DOM 更新提升效能。 |
| Firebase 部署需實填設定 | Medium | `firebase-config.js` 目前為 placeholder。部署前依 FIREBASE_SETUP.md 更新。 |

---

## 5. 題庫完整性摘要

| 指標 | 數據 |
|------|------|
| JSON 檔案總數 | 33 |
| 合法 JSON 率 | 100% (0 損壞) |
| 選項題總數 | 571 |
| 全文 answer 率 | 100% (0 筆字母-only) |
| answer ∉ options 錯誤 | 0 |
| 缺 id 題目 | 0 |
| 寫作/口說題 (非選擇題 schema) | 243 (正常，使用 sample_answer/text 等欄位) |

---

## 6. 結論

**PASS** — M4 模組功能完整，契約一致，全站回歸無回退。發現 2 項問題均已修正。題庫資料完整，選擇題慣例一致。無遺留 P0/P1 問題，可進入下一階段。
