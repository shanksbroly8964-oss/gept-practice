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

// iPhone 修正：若 App 由 Firebase Hosting 網域(gept-goku)提供，把 authDomain 設為同網域，
// 讓 iOS 已安裝 PWA 的登入變「同源」，避免跨網域被 Safari ITP / 儲存分區擋下。
// （gept-goku.web.app 本身已自帶 Firebase 的 /__/auth/ 登入處理器，可作為 authDomain。）
try {
  var _host = location.hostname;
  if (/(^|\.)gept-goku\.(web\.app|firebaseapp\.com)$/.test(_host)) {
    firebaseConfig.authDomain = _host;
  }
} catch (e) {}
