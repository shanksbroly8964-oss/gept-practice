# M2 完成報告 — 聽力模組 + 錯題本模組

## 新增檔案

| 檔案 | 說明 |
|---|---|
| `js/listening.js` | 聽力測驗完整模組（Web Speech API TTS、子題型分流、年級門檻） |
| `js/wrongbook.js` | 錯題本模組（篩選、重新練習、移除、清空） |
| `DONE_G.md` | 本文件 |

## 修改檔案

| 檔案 | 修改內容 |
|---|---|
| `index.html` | 加入「聽力測驗」「錯題本」導航按鈕、`#listening-container` / `#wrongbook-container` 容器、`listening.js` / `wrongbook.js` script 載入 |
| `js/app.js` | 增加 `loadListening()` / `loadWrongBook()` 路由；`startApp()` / `onGradeChange()` 初始化 Listening 模組 |
| `js/ui-renderer.js` | `SECTION_NAMES` / `SECTION_ICONS` 擴充；`hideAllMain()` 加入新容器 ID |
| `js/storage.js` | 新增 `getAllWrongAnswers()` / `removeWrongAnswer()` / `clearWrongAnswers()` |
| `js/quiz-engine.js` | 新增 `loadCustomQuestions()` 供錯題本重練使用 |
| `css/style.css` | 聽力子題型選單、播放按鈕、對話框、錯題本列表、按鈕變體樣式 |

## 功能說明

### 聽力模組
- 年級分流：G1 只看圖辨義；G2 看圖辨義+問答+簡短對話；G3 全開放且不顯示過多提示
- 使用瀏覽器 `SpeechSynthesis` (lang="en-US") 朗讀 `audio_script`，不需要 mp3
- conversation 型態自動分行逐句朗讀
- G1/G2 進題自動播放音檔；G3 需手動按播放
- 作答後即時回饋 + 中文解析，答錯寫入 `gept_wrong`
- 題庫檔不存在時顯示「題庫準備中」

### 錯題本
- 讀取 `localStorage` 之 `gept_wrong`，依年級/題型篩選
- 每題顯示原文、選項、你的答案、正確答案、解析
- 「重新練習」按鈕進入單題練習模式，答對自動從錯題本移除
- 「清空錯題本」按鈕（需確認）

## 本機預覽

需要 HTTP server（因 fetch 載入 JSON 檔）：

```bash
# 使用 Node.js（npx）
npx serve .

# 或使用 Python
python -m http.server 8080

# 或使用 VS Code 的 Live Server 擴充
# 右鍵 index.html → Open with Live Server
```

開啟瀏覽器前往 `http://localhost:8080`（或 Live Server 顯示的網址）。

## 注意

- 聽力題庫檔案位於 `data/listening_{subtype}_{grade}.json`（由平行 agent 產生），尚未產生時會顯示「題庫準備中」
- 錯題資料結構沿用 M1 的 `gept_wrong` localStorage key，section 欄位使用 `picture` / `response` / `conversation` 區分子題型
