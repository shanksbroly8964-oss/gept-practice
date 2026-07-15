// ============================================================
// Firebase 設定檔
// 專案 goku-46e66 / Web App: GEPT-Elementary / Hosting: gept-goku
// ============================================================
var firebaseConfig = {
  apiKey: "AIzaSyCLno101eOvQ5CWZ9WHQ5MNRxAnRJHoJVk",
  authDomain: "goku-46e66.firebaseapp.com",
  projectId: "goku-46e66",
  storageBucket: "goku-46e66.firebasestorage.app",
  messagingSenderId: "488762442595",
  appId: "1:488762442595:web:b5e2fa5be6306a23be4956"
};

// iPhone(iOS Safari ITP)修正：跨網域 redirect 的憑證回傳會被第三方儲存限制擋掉，導致登入迴圈。
// 若 App 由 Firebase Hosting 網域(gept-goku)提供，把 authDomain 設為同網域，讓 /__/auth/ iframe 變第一方。
// ⚠️ 需在 Google Cloud Console 的 OAuth 用戶端「已授權重新導向 URI」加入：
//    https://gept-goku.web.app/__/auth/handler
try {
  var _host = location.hostname;
  if (/(^|\.)gept-goku\.(web\.app|firebaseapp\.com)$/.test(_host)) {
    firebaseConfig.authDomain = _host;
  }
} catch (e) {}
