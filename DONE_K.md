# M3 口說 QA 題庫 — 交付報告 (DONE_K.md)

## 檔案清單

| 檔案 | 題數 | 年級 | 難度定位 |
|------|------|------|----------|
| `data/speaking_qa_G1.json` | 25 | G1 | 簡單個人問題（姓名、年齡、興趣、日常） |
| `data/speaking_qa_G2.json` | 25 | G2 | 日常情境對話（購物、點餐、問路、校園、節日） |
| `data/speaking_qa_G3.json` | 25 | G3 | 開放式論述題（科技、環境、教育、社會、個人成長） |

**合計：75 題**

## 驗證結果

- JSON 語法合法
- 所有 ID 唯一（`SQ-G1-001` ~ `SQ-G3-025`）
- 所有必填欄位完整（id, grade, section, type, level_tag, source, audio_script, question, sample_answer, tips, explanation）
- grade / section / type 欄位正確（grade=G1/G2/G3, section=speaking, type=qa）

## 結構說明

每題包含：
- `audio_script`：Web Speech API TTS 朗讀用英文問題
- `question`：螢幕顯示問題（英文 + 中文提示）
- `sample_answer`：1~3 句英文參考答案
- `tips`：2~3 個答題提示
- `explanation`：繁體中文解析說明
