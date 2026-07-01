# VERIFY_REPORT.md

## Cache-Busting Verification Report

- **Date**: 2026-07-01 15:50:26
- **APP_VERSION**: 20260701-2
- **Passed**: 20, **Failed**: 0, **Total**: 20

---

## Cache-Busting Changes

| File | Change |
|------|--------|
| `index.html` | Added `window.APP_VERSION='20260701-2'` script at top. Added `?v=20260701-2` to all CSS `<link>` and all JS `<script>` tags (13 total). |
| `js/data-loader.js` | Modified `fetch(url)` to `fetch(url + '?v=' + window.APP_VERSION)` for JSON data cache-busting. |
| `firebase.json` | Added `headers` section: all `*.html` files get `Cache-Control: no-cache`. Also added `VERIFY_REPORT.md` and `evidence/**` to ignore list. |

---

## Bug 1: 選項重複代碼 (Double Options Prefix)

**Assertion**: No option button text matches regex `/^([A-D])[.。、]\s*\1[.。、]/` (e.g., "A. A. some text").

| Test | Result | Detail | Screenshot |
|------|--------|--------|------------|
| BUG1: Listening subtype buttons present | **PASS** | - | - |
| BUG1: No "A. A. " double prefix in options | **PASS** | OK | listening_options.png |

---

## Bug 2a: 口說測驗 → 朗讀 (No "題庫準備中")

**Assertion**: 畫面不出現「題庫準備中」，且有實際朗讀內容 (.speaking-text 或 demo 按鈕)。

| Test | Result | Detail | Screenshot |
|------|--------|--------|------------|
| BUG2a: Speaking subtype buttons present | **PASS** | - | - |
| BUG2a: No "題庫準備中" in 朗讀 | **PASS** | - | speaking_readaloud.png |
| BUG2a: Has speaking content (.speaking-text or demo-btn) | **PASS** | - | - |

---

## Bug 2b: 寫作測驗 → 看圖段落寫作 (No "題庫準備中")

**Assertion**: 畫面不出現「題庫準備中」，且有 textarea 與 word-count。

| Test | Result | Detail | Screenshot |
|------|--------|--------|------------|
| BUG2b: Writing subtype buttons present | **PASS** | - | - |
| BUG2b: No "題庫準備中" in 看圖段落寫作 | **PASS** | - | writing_paragraph.png |
| BUG2b: Has textarea + wordcount | **PASS** | - | - |

---

## Bug 3: TTS 太快 (Rate <= 0.5)

**Assertion**: `speechSynthesis.speak()` 被呼叫時 `utterance.rate <= 0.5`。

| Test | Result | Detail | Screenshot |
|------|--------|--------|------------|
| BUG3-listening: TTS called | **PASS** | - | - |
| BUG3-listening: All TTS rates <= 0.5 | **PASS** | rates=[0.4] lastRate=0.4 | - |
| BUG3-speaking: TTS called for demo | **PASS** | - | - |
| BUG3-speaking: TTS rate <= 0.5 | **PASS** | rate=0.4 | - |

---

## Regression Tests

| Test | Result | Detail |
|------|--------|--------|
| REG-G3-listening: No 題庫準備中 | **PASS** | - |
| REG-mockexam: Start button visible | **PASS** | - |
| REG-mockexam: Timer appears | **PASS** | - |
| REG-progress: Dashboard visible | **PASS** | - |
| REG-vocab: Options render | **PASS** | - |
| REG-vocab: Answer feedback shown | **PASS** | - |

---

## Cache-Busting Test

| Test | Result | Detail |
|------|--------|--------|
| CACHE: APP_VERSION set | **PASS** | version=20260701-2 |

---

## Final State Screenshot

![Final State](evidence/final_state.png)

---

## Conclusion

All tests passed. The 3 previously reported bugs are verified fixed.
