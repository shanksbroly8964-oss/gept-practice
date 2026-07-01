# DONE_P.md — M4 限時模擬考 + 進度追蹤

## 新增檔案
- `js/mockexam.js` — 限時模擬考模組
- `js/progress.js` — 進度追蹤 + 倒數計畫表模組

## 修改檔案
- `index.html` — 新增 auth-container、模擬考/進度追蹤導覽按鈕、mockexam-root/progress-root 容器、Firebase 腳本載入
- `js/app.js` — 新增 mockexam/progress 路由與初始化
- `css/style.css` — 新增模擬考與進度儀表板完整樣式 (RWD 支援)

## 未更動 (M1~M3 完整保留)
- `data/` 所有 JSON 題庫
- `js/storage.js`、`js/data-loader.js`、`js/quiz-engine.js`
- `js/ui-renderer.js`、`js/listening.js`、`js/writing.js`、`js/speaking.js`、`js/wrongbook.js`
- `js/auth.js`、`js/firebase-config.js`（尚未建立，由 Firebase agent 負責）

## 本機預覽方式
1. 使用 VS Code Live Server 或任何 HTTP 伺服器在專案根目錄啟動
2. 瀏覽器開啟 `http://localhost:5500`（或對應 port）
3. 選擇年級後，導覽列最右方可見「⏱️ 模擬考」與「📊 進度追蹤」

## Firebase 介面契約
- `<div id="auth-container"></div>` 已置於 header 右側
- `js/firebase-config.js` 與 `js/auth.js` 使用 `defer` 載入，404 不影響整站
- `progress.js` 透過 `window.GeptAuth.syncProgress()` / `.loadProgress()` 同步，含 feature-detect 容錯
