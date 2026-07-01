# M4 Firebase 登入與雲端同步 — 交付報告 (DONE_R.md)

## 檔案清單

| 檔案 | 說明 |
|------|------|
| `js/firebase-config.js` | Firebase 設定檔（placeholder），部署前需依 FIREBASE_SETUP.md 替換 |
| `js/auth.js` | Google 登入 + Firestore 雲端同步模組，自我隔離 |
| `FIREBASE_SETUP.md` | Firebase 設定指引（建立 App、啟用 Google 登入、安全規則） |
| `DONE_R.md` | 本檔案 — 交付清單 |

## 模組介面 — `window.GeptAuth`

| API | 說明 |
|-----|------|
| `init()` | 初始化（自動於載入時呼叫） |
| `login()` | 觸發 Google 彈窗登入 |
| `logout()` | 登出並清除登入狀態 |
| `getUser()` | 回傳目前登入者物件或 `null` |
| `onUser(cb)` | 註冊登入狀態變化回呼；立即用目前狀態呼叫一次 |
| `syncProgress(dataObj)` | 登入時將進度寫入 Firestore `users/{uid}`，未登入靜默略過 |
| `loadProgress()` | 回傳 Promise，登入時從 Firestore 取回進度，未登入回 `null` |

## 架構設計

### 自我隔離原則
- `auth.js` 僅操作 `#auth-container` DOM 容器（找不到時不報錯崩潰）
- 不依賴 `window.GEPT` 或其他應用模組
- 不修改 `index.html`、任何現有 `js/*.js`、`data/*.json`

### Firebase SDK 載入策略
- 使用 Firebase v10 compat CDN（`firebase-app-compat.js` 等三支），動態注入 `<script>` 載入
- 不需 npm / 打包工具，純靜態網頁直接可用
- 載入失敗自動降級為「雲端同步未設定」按鈕，不影響 App 其他功能

### 容錯設計
| 情境 | 行為 |
|------|------|
| `firebaseConfig` 為 placeholder | 顯示灰色「雲端同步未設定」按鈕 |
| Firebase SDK 載入失敗 | 同上，console 輸出警告 |
| `#auth-container` 不存在 | 靜默跳過所有 UI 渲染，不報錯 |
| 未登入時呼叫 `syncProgress` | 靜默略過 |
| 未登入時呼叫 `loadProgress` | 回傳 `Promise.resolve(null)` |
| 重複初始化 Firebase | 捕捉 `app/duplicate-app` 錯誤，不崩潰 |
| Firestore 讀寫失敗 | console.error 記錄，不拋出例外 |

### Firestore 結構
```
users (collection)
  └── {uid} (document)  ← Firebase Auth UID
        └── { ... progress data ... }
```
- 安全規則：`users/{userId}` 僅 `request.auth.uid == userId` 者可讀寫

## 整合說明

另一 agent 只需在 `index.html` 中：
1. 加入 `<div id="auth-container"></div>` 於 `<header>` 內或任意位置
2. 在既有 `<script>` 標籤序列中插入（例：於 `storage.js` 前或後）：
   ```html
   <script src="js/firebase-config.js"></script>
   <script src="js/auth.js"></script>
   ```
3. 呼叫 `GeptAuth.onUser(cb)` 監聽登入狀態變化
4. 需要同步時呼叫 `GeptAuth.syncProgress(dataObj)` / `GeptAuth.loadProgress()`

## 本階段限制

- 本階段**不部署**，config 為 placeholder
- 僅在 `localhost` 以 HTTP server 開啟時可測試完整登入流程（先依 FIREBASE_SETUP.md 填入實際 config）
- 未設定時 App 以純 localStorage 模式正常運作
