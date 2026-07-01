# M1 前端骨架完成

## 建立檔案清單

| 檔案 | 說明 |
|------|------|
| `index.html` | 主頁面：年級選擇 / 題型導航 / 作答區 / 統計面板 |
| `css/style.css` | 全部樣式：RWD 響應式、卡片設計、動畫回饋 |
| `js/storage.js` | localStorage 管理：年級、分數、錯題記錄 |
| `js/data-loader.js` | 題庫載入：fetch JSON + 快取 + 錯誤處理 |
| `js/quiz-engine.js` | 題庫引擎：出題、計分、作答判斷、進度控制 |
| `js/ui-renderer.js` | UI 渲染：題目顯示、回饋、統計更新、狀態切換 |
| `js/app.js` | 主控制器：事件綁定、流程協調、初始化 |
| `data/_schema_example.json` | 題庫結構範例（僅參考，不影響題庫載入） |
| `README.md` | 專案說明文件 |
| `DONE_A.md` | 本檔案 — 交付清單 |

## 如何本機預覽

### 方式一：直接開啟（最簡單）
用瀏覽器直接開啟 `index.html` 即可。

### 方式二：Live Server（推薦，支援 fetch）
```bash
npx live-server .
```
或使用 VS Code 的 Live Server 擴充功能，對 `index.html` 按右鍵 → Open with Live Server。

### 方式三：Python HTTP Server
```bash
python -m http.server 8000
```
開啟瀏覽器進入 `http://localhost:8000`

> **注意**：題庫 JSON 透過 `fetch()` 載入，**必須**透過 HTTP Server 開啟才能正確載入。直接雙擊 `index.html` 打開（file:// 協議）會因為 CORS 限制導致題庫無法載入。

## 使用流程

1. 開啟網頁 → 選擇年級（國一/國二/國三）→ 存入 localStorage
2. 點選題型（單字測驗/文法填空/克漏字/閱讀理解）
3. 系統載入對應 `data/{section}_{grade}.json`
4. 若題庫檔不存在 → 顯示「題庫準備中」（不會整頁壞掉）
5. 作答後即時顯示正確/錯誤 + 中文解析
6. 右上角可隨時切換年級
7. 累積統計顯示於下方面板

## M2 擴充預留

- **錯題本**：已預留 localStorage 結構（`gept_wrong`），M2 可直接讀取
- **資料來源**：每題 `source` 欄位支援 `static` / `ai-realtime`，前端已預留判別邏輯
- **題目數量**：每次隨機抽 10 題，可透過 `quiz-engine.js` 的 `MAX_QUESTIONS` 調整
