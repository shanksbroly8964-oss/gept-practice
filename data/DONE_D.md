# DONE_D — 聽力看圖辨義 (Picture) 題庫統計

**產出日期**：2026-07-01  
**題型**：聽力-看圖辨義 (Listening Picture)  
**年級**：G1（國一）／G2（國二）／G3（國三）  
**選項數**：三選一（options 長度=3）

---

## 各檔統計

| 檔案 | 題數 | 年級難度 |
|------|------|----------|
| `listening_picture_G1.json` | 23 | G1（語速慢、句子短、日常主題） |
| `listening_picture_G2.json` | 25 | G2（中等語速、句子稍長） |
| `listening_picture_G3.json` | 24 | G3（接近正式考速、句子較長） |
| **合計** | **72** | — |

---

## 欄位一致性確認

每題均含以下欄位：
`id`, `grade`, `section`, `type`, `level_tag`, `source`, `image`, `audio_script`, `question`, `options`, `answer`, `explanation`

- `id` 格式：LP-{grade}-{XXX}（例：LP-G1-001）
- `options` 一律為 3 個選項（A/B/C）
- `answer` 為完整選項文字（含 "A. " 前綴），與 `options` 陣列內完全一致
- `image` 為 emoji 場景字串，供前端畫面顯示
- `audio_script` 為英文敘述，由瀏覽器 Web Speech API (en-US) 朗讀
- `question` 為繁體中文提示
- `explanation` 為繁體中文解析
- 所有 JSON 檔案已通過 `JSON.parse` 驗證
