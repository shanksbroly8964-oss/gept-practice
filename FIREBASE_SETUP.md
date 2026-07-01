# Firebase 設定指引

本文件說明如何取得 Firebase 設定值，來替換 `js/firebase-config.js` 中的 placeholder，使雲端同步功能可運作。

---

## 1. 建立 Firebase 專案與 Web App

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點選「新增專案」，依指示建立專案（或可沿用既有的 `goku-46e66` 專案）
3. 專案建立後，點選「</>」Web App 圖示新增一個 Web 應用程式
4. 註冊後，Firebase 會顯示一組設定物件，複製該設定值

---

## 2. 替換 `js/firebase-config.js`

將複製的設定值填入 `js/firebase-config.js`：

```js
var firebaseConfig = {
  apiKey: "AIzaSy...",                  // ← 貼上實際值
  authDomain: "goku-46e66.firebaseapp.com",
  projectId: "goku-46e66",
  storageBucket: "goku-46e66.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123..."
};
```

---

## 3. 啟用 Google 登入供應商

1. 在 Firebase Console 左側選單 → **Authentication** → **Sign-in method**
2. 找到 **Google**，點選編輯圖示（鉛筆）
3. 切換「啟用」開關 → 選取專案支援電子郵件 → 儲存

---

## 4. 設定 authorizedDomains（OAuth 授權網域）

Google 登入僅允許在列於 authorizedDomains 的網域上運作。

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. 預設已包含 `localhost` 與 Firebase Hosting 預設網域
3. **本機開發**：`localhost` 已預設可用，無需額外設定
4. **部署後**：需手動加入實際部署網域，例如：
   - `yourapp.web.app`（Firebase Hosting）
   - `your-custom-domain.com`（自訂網域）

> 使用 `npx live-server` 或 `python -m http.server` 在本機 `localhost` 開發時，
> 已預設可用，不須額外設定。

---

## 5. Firestore 安全規則

至 Firebase Console → **Firestore Database** → **Rules**，貼上以下規則：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

此規則確保：每位使用者**僅能讀寫自己的進度資料**（`users/{uid}`），
其他使用者的資料無法存取。

---

## 6. 建立 Firestore 資料庫

1. Firebase Console → **Firestore Database** → **Create database**
2. 選擇「以測試模式啟動」（或直接套用上方安全規則後再切換為正式模式）
3. 選擇資料庫位置（建議 `asia-east1` 台灣）

---

## 7. 關於本地靜態檔案測試

本專案透過 CDN 動態載入 Firebase SDK（`firebase-app-compat.js` 等），
不需 npm 安裝或打包工具，可直接用瀏覽器開啟（需 HTTP server）：

```bash
npx live-server .
```

因 `localhost` 已在 authorizedDomains 預設清單中，Google 登入可正常運作。

---

## 8. goku-46e66 專案沿用

若已有 `goku-46e66` Firebase 專案，可直接在其下新增 Web App 取得設定值，
不需新建專案。本階段不部署，僅需在本機驗證登入流程。
