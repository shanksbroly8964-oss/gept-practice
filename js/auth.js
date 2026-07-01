// ============================================================
// GeptAuth — Firebase Google 登入 + Firestore 雲端同步模組
// 自我隔離：僅操作 #auth-container，不碰任何其他 DOM 與模組
// ============================================================
window.GeptAuth = (function() {
  'use strict';

  var FB_CDN = 'https://www.gstatic.com/firebasejs/10.12.0';
  var SDK_LOADED = false;
  var AUTH_INITIALIZED = false;

  var auth = null;
  var db = null;
  var currentUser = null;
  var listeners = [];

  // ── helpers ─────────────────────────────────────────────

  function isPlaceholder(val) {
    return !val || /^YOUR_/.test(val);
  }

  function isConfigValid() {
    try {
      if (typeof firebaseConfig === 'undefined') return false;
      var c = firebaseConfig;
      return !isPlaceholder(c.apiKey) && !isPlaceholder(c.projectId) && !isPlaceholder(c.appId);
    } catch (e) {
      return false;
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ── dynamic script loader ───────────────────────────────

  function loadScript(src) {
    return new Promise(function(resolve, reject) {
      var el = document.createElement('script');
      el.src = src;
      el.onload = resolve;
      el.onerror = function() { reject(new Error('Failed to load: ' + src)); };
      document.head.appendChild(el);
    });
  }

  function loadFirebaseSdk() {
    if (SDK_LOADED) return Promise.resolve();
    return Promise.all([
      loadScript(FB_CDN + '/firebase-app-compat.js'),
      loadScript(FB_CDN + '/firebase-auth-compat.js'),
      loadScript(FB_CDN + '/firebase-firestore-compat.js')
    ]).then(function() {
      SDK_LOADED = true;
    });
  }

  // ── UI rendering ────────────────────────────────────────

  function renderUI() {
    var container = document.getElementById('auth-container');
    if (!container) return;

    var user = getUser();
    var html;

    if (user) {
      var avatar = user.photoURL ? escapeHtml(user.photoURL) : '';
      var name = user.displayName || user.email || '使用者';
      html =
        '<div class="gept-auth-user" style="display:flex;align-items:center;gap:8px;padding:4px 0;">' +
          (avatar ? '<img src="' + avatar + '" alt="" style="width:28px;height:28px;border-radius:50%;">' : '') +
          '<span class="gept-auth-name" style="font-size:14px;color:#333;">' + escapeHtml(name) + '</span>' +
          '<button class="gept-auth-btn gept-auth-logout" onclick="window.GeptAuth.logout()" ' +
            'style="margin-left:auto;padding:4px 12px;border:1px solid #ccc;border-radius:4px;background:#fff;cursor:pointer;font-size:13px;">' +
            '登出</button>' +
        '</div>';
    } else {
      html =
        '<button class="gept-auth-btn gept-auth-login" onclick="window.GeptAuth.login()" ' +
          'style="display:flex;align-items:center;gap:8px;padding:6px 16px;border:none;border-radius:4px;' +
          'background:#4285f4;color:#fff;cursor:pointer;font-size:14px;font-weight:500;">' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;' +
            'width:20px;height:20px;background:#fff;color:#4285f4;border-radius:2px;font-weight:700;font-size:12px;">G</span>' +
          'Google 登入同步' +
        '</button>';
    }

    container.innerHTML = html;
  }

  function showUnconfigured() {
    var container = document.getElementById('auth-container');
    if (!container) return;
    container.innerHTML =
      '<button class="gept-auth-btn gept-auth-disabled" disabled ' +
        'style="padding:6px 16px;border:1px dashed #999;border-radius:4px;background:#f5f5f5;' +
        'color:#999;cursor:not-allowed;font-size:13px;">' +
        '雲端同步未設定' +
      '</button>';
  }

  // ── auth state ──────────────────────────────────────────

  function notifyListeners(user) {
    currentUser = user;
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](user); } catch (e) { /* silent */ }
    }
  }

  // ── public API ──────────────────────────────────────────

  function init() {
    renderUI();

    if (!isConfigValid()) {
      showUnconfigured();
      return;
    }

    loadFirebaseSdk().then(function() {
      if (typeof firebase === 'undefined') {
        showUnconfigured();
        return;
      }

      try {
        firebase.initializeApp(firebaseConfig);
      } catch (e) {
        // Already initialized — ignore duplicate-app error
        if (e.code !== 'app/duplicate-app') {
          console.warn('Firebase init error:', e);
          showUnconfigured();
          return;
        }
      }

      auth = firebase.auth();
      db = firebase.firestore();

      auth.onAuthStateChanged(function(user) {
        notifyListeners(user);
        renderUI();
      });

      AUTH_INITIALIZED = true;
    }).catch(function(err) {
      console.warn('Firebase SDK load failed:', err);
      showUnconfigured();
    });
  }

  function login() {
    if (!isConfigValid() || !auth) return;
    var provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(function(err) {
      console.error('Google 登入失敗:', err.message || err);
    });
  }

  function logout() {
    if (!auth) return;
    auth.signOut().catch(function(err) {
      console.error('登出失敗:', err.message || err);
    });
  }

  function getUser() {
    return currentUser || null;
  }

  function onUser(callback) {
    if (typeof callback !== 'function') return;
    listeners.push(callback);
    if (currentUser !== undefined && currentUser !== null) {
      try { callback(currentUser); } catch (e) { /* silent */ }
    }
  }

  function syncProgress(dataObj) {
    if (!currentUser || !db) return;
    db.collection('users').doc(currentUser.uid).set(dataObj, { merge: true })
      .catch(function(err) {
        console.error('進度同步失敗:', err.message || err);
      });
  }

  function loadProgress() {
    return new Promise(function(resolve) {
      if (!currentUser || !db) return resolve(null);
      db.collection('users').doc(currentUser.uid).get()
        .then(function(doc) {
          resolve(doc.exists ? doc.data() : null);
        })
        .catch(function(err) {
          console.error('進度載入失敗:', err.message || err);
          resolve(null);
        });
    });
  }

  // ── auto-init on load ───────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init: init,
    login: login,
    logout: logout,
    getUser: getUser,
    onUser: onUser,
    syncProgress: syncProgress,
    loadProgress: loadProgress
  };

})();
