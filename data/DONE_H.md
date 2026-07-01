# M3 寫作-單句寫作 (sentence) 題庫 — 完成

## 產出檔案
| 檔案 | 題數 | 改寫 | 合併 | 重組 |
|------|------|------|------|------|
| `data/writing_sentence_G1.json` | 27 | 10 | 8 | 9 |
| `data/writing_sentence_G2.json` | 27 | 9 | 9 | 9 |
| `data/writing_sentence_G3.json` | 30 | 10 | 10 | 10 |

**總計：84 題**

## 年級難度對照
| 年級 | 文法範圍 | 例 |
|------|----------|-----|
| G1 | be動詞、現在簡單式、can、there is/are | I have a dog. / She is not a teacher. |
| G2 | 過去式、未來式、比較級/最高級、連接詞 | She went to school yesterday. / Tom is taller than Sam. |
| G3 | 關係代名詞、被動語態、完成式、假設語氣 | The book was written by him. / I have never been to Japan. |

## 欄位結構
每題包含：`id`, `grade`, `section`, `type`, `level_tag`, `source`, `instruction`, `prompt`, `sample_answer`, `checkpoints` (2+ 項), `explanation`

## JSON 驗證
- node `require()` 解析通過，84 題欄位完整
- 所有 instruction / explanation 為繁體中文
