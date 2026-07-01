# M3 — 寫作模組 + 口說模組

## 修改檔案

| 檔案 | 異動 |
|------|------|
| **index.html** | 加入寫作/口說導航按鈕、容器 div、js/writing.js 與 js/speaking.js 引用 |
| **css/style.css** | 新增寫作答題區、範例答案、檢核清單、錄音控制、語音播放等樣式（約 300 行） |
| **js/app.js** | 新增 `loadWriting()`、`loadSpeaking()` 路由；`onGradeChange`/`startApp` 中加入 init；導航切換時 reset Speaking session |
| **js/ui-renderer.js** | `SECTION_ICONS`、`SECTION_NAMES` 加入 writing/speaking；`hideAllMain` 加入 writing/speaking container |

## 新增檔案

| 檔案 | 說明 |
|------|------|
| **js/writing.js** | 寫作模組（304 行），兩種子型：單句寫作(sentence)、看圖段落寫作(paragraph) |
| **js/speaking.js** | 口說模組（526 行），兩種子型：朗讀(readaloud)、回答問題(qa)，含 MediaRecorder 錄音回放 |

## 模組功能

### 寫作測驗

- **單句寫作**：顯示 instruction + prompt → 文字輸入框 → 按「看參考答案」顯示 `sample_answer`、`checkpoints` 檢核清單、`explanation`
- **看圖段落寫作**：顯示 image(emoji) + instruction + prompt → textarea + 即時字數統計（對比 `min_words`）→ 按「看範文」顯示範文與檢核說明
- 無自動判分，採自評對照

### 口說測驗

- **朗讀**：顯示 text → 「聽示範」(SpeechSynthesis en-US) → 「錄音」(MediaRecorder) → 回放錄音 → 顯示 tips/explanation
- **回答問題**：顯示 question → 「播放題目」(SpeechSynthesis) → 錄音作答 → 回放 → 按「看參考答案」顯示 `sample_answer` + tips
- 麥克風權限被拒/不支援 MediaRecorder 時顯示友善提示，頁面不崩潰

## 題庫檔名（待後續產生）

```
data/writing_sentence_{G}.json
data/writing_paragraph_{G}.json
data/speaking_readaloud_{G}.json
data/speaking_qa_{G}.json
```

不存在時顯示「題庫準備中」，不影響其他模組。

## 本機預覽

```bash
# 用任何靜態伺服器啟動
npx serve .
# 或
python -m http.server 8080
# 或
npx live-server
```

打開瀏覽器 → 選擇年級 → 導航列點「寫作測驗」或「口說測驗」
