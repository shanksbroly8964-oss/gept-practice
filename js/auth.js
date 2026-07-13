// ============================================================
// GeptAuth — Firebase Google 登入閘門 + Firestore 雲端同步
// 流程：loading → onAuthStateChanged → 登入頁 或 App
// 關鍵：setPersistence(browserLocalPersistence) 持久保持登入
// ============================================================
window.GeptAuth = (function() {
  'use strict';

  var ALLOW_GUEST = false;
  var FB_CDN = 'https://www.gstatic.com/firebasejs/10.12.0';
  var SDK_LOADED = false;

  var auth = null;
  var db = null;
  var currentUser = null;
  var isGuestMode = false;
  var authReady = false;
  var readyCallbacks = [];
  var userChangeCallbacks = [];

  function isPlaceholder(val) {
    return !val || /^YOUR_/.test(val);
  }

  function isConfigValid() {
    try {
      if (typeof firebaseConfig === 'undefined') return false;
      var c = firebaseConfig;
      return !isPlaceholder(c.apiKey) && !isPlaceholder(c.projectId) && !isPlaceholder(c.appId);
    } catch (e) { return false; }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

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
    ]).then(function() { SDK_LOADED = true; });
  }

  // ── UI ───────────────────────────────────────────────────

  function showLoading() {
    var el = document.getElementById('app-loading');
    if (el) el.classList.remove('hidden');
    var app = document.getElementById('app');
    if (app) app.classList.add('hidden');
    var login = document.getElementById('login-page');
    if (login) login.classList.add('hidden');
  }

  function hideLoading() {
    var el = document.getElementById('app-loading');
    if (el) el.classList.add('hidden');
  }

  function showLoginPage() {
    hideLoading();
    var el = document.getElementById('login-page');
    if (el) {
      el.classList.remove('hidden');
      var guestBtn = document.getElementById('login-guest-btn');
      if (guestBtn) {
        guestBtn.classList.toggle('hidden', !ALLOW_GUEST);
      }
    }
    var app = document.getElementById('app');
    if (app) app.classList.add('hidden');
    var loginErr = document.getElementById('login-error');
    if (loginErr) loginErr.classList.add('hidden');
  }

  function showApp() {
    hideLoading();
    var el = document.getElementById('login-page');
    if (el) el.classList.add('hidden');
    var app = document.getElementById('app');
    if (app) app.classList.remove('hidden');
  }

  function showLoginError(msg) {
    var el = document.getElementById('login-error');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(function() {
      el.classList.add('hidden');
    }, 5000);
  }

  function renderHeaderUser(user) {
    var container = document.getElementById('auth-container');
    if (!container) return;

    var avatar = user && user.photoURL ? escapeHtml(user.photoURL) : '';
    var name = (user && user.displayName) || (user && user.email) || '使用者';
    if (isGuestMode) name = '訪客';

    if (isGuestMode || user) {
      container.innerHTML =
        '<div class="auth-user" style="display:flex;align-items:center;gap:8px;">' +
          (avatar ? '<img src="' + avatar + '" alt="" class="auth-avatar">' : '<span class="auth-avatar-placeholder">&#x1f464;</span>') +
          '<span class="auth-name">' + escapeHtml(name) + '</span>' +
          '<button class="auth-btn-logout" onclick="window.GeptAuth.logout()">登出</button>' +
        '</div>';
    } else {
      container.innerHTML = '';
    }
  }

  // ── Firebase init ────────────────────────────────────────

  function initFirebase() {
    if (!isConfigValid()) {
      authReady = true;
      hideLoading();
      showLoginPage();
      fireReadyCallbacks();
      return;
    }

    loadFirebaseSdk().then(function() {
      if (typeof firebase === 'undefined') {
        authReady = true;
        hideLoading();
        showLoginPage();
        fireReadyCallbacks();
        return;
      }

      try {
        firebase.initializeApp(firebaseConfig);
      } catch (e) {
        if (e.code !== 'app/duplicate-app') {
          console.warn('Firebase init error:', e);
          authReady = true;
          hideLoading();
          showLoginPage();
          fireReadyCallbacks();
          return;
        }
      }

      auth = firebase.auth();
      db = firebase.firestore();

      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function() {
        console.log('[Auth] persistence set to LOCAL');
      }).catch(function(e) {
        console.warn('[Auth] setPersistence failed:', e);
      });

      auth.onAuthStateChanged(function(user) {
        console.log('[Auth] onAuthStateChanged:', user ? user.uid : 'null');
        currentUser = user;
        isGuestMode = false;

        if (!authReady) {
          authReady = true;
          hideLoading();
          if (user) {
            loadCloudProgressForUser(user).then(function() {
              showApp();
              notifyUserChange(user, false);
            });
          } else {
            showLoginPage();
            notifyUserChange(null, false);
          }
          fireReadyCallbacks();
        } else {
          if (user) {
            loadCloudProgressForUser(user).then(function() {
              showApp();
              notifyUserChange(user, false);
            });
          } else if (!isGuestMode) {
            clearLocalUserData();
            showLoginPage();
            notifyUserChange(null, false);
          }
        }
        renderHeaderUser(user);
      });
    }).catch(function(err) {
      console.warn('Firebase SDK load failed:', err);
      authReady = true;
      hideLoading();
      showLoginPage();
      fireReadyCallbacks();
    });
  }

  // ── callbacks ────────────────────────────────────────────

  function fireReadyCallbacks() {
    var cbs = readyCallbacks.slice();
    readyCallbacks = [];
    cbs.forEach(function(cb) { try { cb(); } catch(e) { /* silent */ } });
  }

  function notifyUserChange(user, isGuest) {
    userChangeCallbacks.forEach(function(cb) {
      try { cb(user, isGuest); } catch(e) { /* silent */ }
    });
  }

  function loadCloudProgressForUser(user) {
    if (!user || !db) return Promise.resolve(null);
    return db.collection('users').doc(user.uid).get()
      .then(function(doc) {
        if (doc.exists) {
          var data = doc.data();
          if (data && data.progress) {
            try { localStorage.setItem(getUidKey('gept_progress'), JSON.stringify(data.progress)); } catch(e) {}
          }
          if (data && data.stats) {
            try { localStorage.setItem(getUidKey('gept_stats'), JSON.stringify(data.stats)); } catch(e) {}
          }
          if (data && data.wrong) {
            try { localStorage.setItem(getUidKey('gept_wrong'), JSON.stringify(data.wrong)); } catch(e) {}
          }
          console.log('[Auth] loaded cloud progress for', user.uid);
        }
        return data;
      })
      .catch(function(err) {
        console.error('[Auth] loadProgress error:', err);
        return null;
      });
  }

  function clearLocalUserData() {
    try {
      localStorage.removeItem('gept_progress');
      localStorage.removeItem('gept_stats');
      localStorage.removeItem('gept_wrong');
      localStorage.removeItem('gept_grade');
    } catch(e) {}
  }

  function getUidKey(key) {
    if (isGuestMode) return key + '_guest';
    if (!currentUser) return key;
    return key + '_' + currentUser.uid;
  }

  // ── public API ───────────────────────────────────────────

  function login() {
    if (!auth) {
      showLoginError('登入服務尚未就緒，請稍候再試。');
      return;
    }

    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    auth.signInWithPopup(provider).catch(function(err) {
      console.error('[Auth] login error:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') {
        showLoginError('已取消登入，請再試一次。');
      } else if (err.code === 'auth/network-request-failed') {
        showLoginError('網路連線異常，請檢查網路後再試。');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Silently ignore — user closed popup
      } else {
        showLoginError('登入失敗：' + (err.message || '請再試一次。'));
      }
    });
  }

  function loginAsGuest() {
    if (!ALLOW_GUEST) return;
    isGuestMode = true;
    currentUser = null;
    hideLoading();
    showApp();
    renderHeaderUser(null);
    notifyUserChange(null, true);
  }

  function logout() {
    clearLocalUserData();
    isGuestMode = false;
    if (auth) {
      auth.signOut().catch(function(err) {
        console.error('[Auth] logout error:', err);
      });
    } else {
      showLoginPage();
      renderHeaderUser(null);
      notifyUserChange(null, false);
    }
  }

  function getUser() {
    return currentUser || null;
  }

  function isGuest() {
    return isGuestMode;
  }

  function isLoggedIn() {
    return !!(currentUser || isGuestMode);
  }

  function onReady(callback) {
    if (typeof callback !== 'function') return;
    if (authReady) {
      try { callback(); } catch(e) { /* silent */ }
    } else {
      readyCallbacks.push(callback);
    }
  }

  function onUserChange(callback) {
    if (typeof callback !== 'function') return;
    userChangeCallbacks.push(callback);
    if (currentUser !== undefined && currentUser !== null) {
      try { callback(currentUser, isGuestMode); } catch(e) { /* silent */ }
    }
  }

  function syncProgress(dataObj) {
    if (isGuestMode) return;
    if (!currentUser || !db) return;
    var payload = {
      progress: null,
      stats: null,
      wrong: null,
      updatedAt: new Date().toISOString()
    };
    try { payload.progress = JSON.parse(localStorage.getItem(getUidKey('gept_progress'))); } catch(e) {}
    try { payload.stats = JSON.parse(localStorage.getItem(getUidKey('gept_stats'))); } catch(e) {}
    try { payload.wrong = JSON.parse(localStorage.getItem(getUidKey('gept_wrong'))); } catch(e) {}
    if (dataObj) Object.assign(payload, dataObj);

    db.collection('users').doc(currentUser.uid).set(payload, { merge: true })
      .catch(function(err) {
        console.error('[Auth] syncProgress error:', err);
      });
  }

  function loadProgress() {
    if (isGuestMode) return Promise.resolve(null);
    if (!currentUser || !db) return Promise.resolve(null);
    return db.collection('users').doc(currentUser.uid).get()
      .then(function(doc) {
        if (doc.exists) {
          var data = doc.data();
          if (data) {
            if (data.progress) localStorage.setItem(getUidKey('gept_progress'), JSON.stringify(data.progress));
            if (data.stats) localStorage.setItem(getUidKey('gept_stats'), JSON.stringify(data.stats));
            if (data.wrong) localStorage.setItem(getUidKey('gept_wrong'), JSON.stringify(data.wrong));
          }
          return data;
        }
        return null;
      })
      .catch(function(err) {
        console.error('[Auth] loadProgress error:', err);
        return null;
      });
  }

  function getStoragePrefix() {
    return getUidKey('');
  }

  function getUidKeyFn() {
    return getUidKey;
  }

  // ── init ─────────────────────────────────────────────────

  showLoading();
  initFirebase();

  return {
    ALLOW_GUEST: ALLOW_GUEST,
    login: login,
    loginAsGuest: loginAsGuest,
    logout: logout,
    getUser: getUser,
    isGuest: isGuest,
    isLoggedIn: isLoggedIn,
    onReady: onReady,
    onUserChange: onUserChange,
    syncProgress: syncProgress,
    loadProgress: loadProgress,
    getStoragePrefix: getStoragePrefix,
    getUidKey: getUidKeyFn,
    showLoginPage: showLoginPage,
    showApp: showApp
  };
})();
