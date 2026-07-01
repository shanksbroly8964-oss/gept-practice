# DONE_E — 聽力-問答 (Listening Response) 題庫統計

**產出日期**：2026-07-01  
**題型**：聽力問答 (Listening Response)  
**年級**：G1（國一）／G2（國二）／G3（國三）

---

## 各檔統計

| 檔案 | 題數 | 年級難度 |
|------|------|----------|
| `listening_response_G1.json` | 20 | G1（簡單日常問句） |
| `listening_response_G2.json` | 20 | G2（中等難度：過去式、未來式、比較級、禮貌請求） |
| `listening_response_G3.json` | 20 | G3（較長自然對話：假設語氣、完成式、條件句、開放意見） |
| **合計** | **60** | — |

---

## 分項明細

### G1 — 簡單日常問句
| 題號 | 情境標籤 | 音檔內容摘要 |
|------|---------|-------------|
| LR-G1-001~005 | 問候、自我介紹、年齡 | Good morning / What's your name / How old are you |
| LR-G1-006~010 | 日期、天氣、喜好、能力 | What day / How's the weather / Do you like / Can you |
| LR-G1-011~015 | 顏色、方位、人物、需求 | What color / Where is / Who is / Do you want |
| LR-G1-016~020 | 家庭、早餐、借物、科目、道別 | How many people / What do you eat / May I borrow / Favorite subject / See you |

### G2 — 中等難度
| 題號 | 情境標籤 | 音檔內容摘要 |
|------|---------|-------------|
| LR-G2-001~005 | 過去事件、未來計畫、頻率 | What did you do / are you going to / How often / Why don't we |
| LR-G2-006~010 | 比較、問路、購物、身體 | Which do you like / How can I get to / How much / What's the matter |
| LR-G2-011~015 | 邀請、經驗、指路、解釋 | Would you like to / Have you been to / Can you tell me / Why were you late |
| LR-G2-016~020 | 時間、求助、意見、生日 | How long / Could you help / What did you think / Shall we / When is |

### G3 — 較長自然對話
| 題號 | 情境標籤 | 音檔內容摘要 |
|------|---------|-------------|
| LR-G3-001~005 | 假設、完成式、意見 | If you could travel / Have you ever tried / online learning / learn English / won a million |
| LR-G3-006~010 | 持續時間、資訊、許可、關懷 | How long have you been / Could you tell me / Do you mind / How's it going / most interesting place |
| LR-G3-011~015 | 解釋、擔心、偏好、建議 | Can you explain / You look worried / Would you rather / getting a pet |
| LR-G3-016~020 | 原因、壓力、改變、天氣、友誼 | Do you know why / deal with stress / change about school / raining for three days / makes a good friend |

---

## 欄位一致性確認

每題均含以下欄位：
`id`, `grade`, `section`, `type`, `level_tag`, `source`, `audio_script`, `question`, `options`, `answer`, `explanation`

- `section` 一律為 `"listening"`，`type` 一律為 `"response"`
- `options` 一律為 3 個選項（三選一）
- `answer` 為正確選項的完整文字，與 `options` 陣列內完全一致
- `audio_script` 為前端 TTS 朗讀之英文語句
- `question` 為螢幕顯示之繁體中文提示
- `explanation` 為繁體中文解析
- 所有 JSON 檔案已通過 `JSON.parse` 驗證
- 60 個 `id` 皆唯一，無重複
