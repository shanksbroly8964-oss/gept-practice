# 全民英檢初級輔助學習工具

GEPT Elementary Learning Tool — 專為國中學生設計的英檢初級輔助練習平台。

## 功能特色

- **年級切換**：國一 (G1) / 國二 (G2) / 國三 (G3)，不同年級載入對應題庫
- **四種題型**：單字測驗、文法填空、克漏字、閱讀理解
- **即時回饋**：作答後立即顯示正確/錯誤與中文解析
- **統計追蹤**：累積答對/答錯/正確率（儲存於 localStorage）
- **錯題記錄**：答錯題目自動暫存，預留 M2 錯題本擴充
- **RWD 響應式**：手機與桌面皆可使用

## 開始使用

1. **安裝題庫**：將題庫 JSON 檔放入 `data/` 目錄
   - 格式：`data/{section}_{grade}.json`
   - 題型：`vocab` / `grammar` / `cloze` / `reading`
   - 年級：`G1` / `G2` / `G3`
2. **開啟網頁**：用瀏覽器直接開啟 `index.html`（或部署至 GitHub Pages）

## 題庫格式

```json
{
  "id": "R-G1-001",
  "grade": "G1",
  "section": "reading",
  "type": "vocab",
  "level_tag": ["be動詞"],
  "source": "static",
  "question": "題幹文字",
  "passage": "（cloze/reading 用）",
  "options": ["A", "B", "C", "D"],
  "answer": "A",
  "explanation": "中文解析"
}
```

## 技術架構

- 純靜態網頁（HTML + CSS + Vanilla JS）
- 無框架、無建置工具，可直接用瀏覽器開啟
- 資料來源支援 `static` 與 `ai-realtime`（M1 僅實作 static，已預留接口）
- 答錯題目以 localStorage 暫存
