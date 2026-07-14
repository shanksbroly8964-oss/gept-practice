const APP_VERSION = '20260702-pwa4';
const CACHE = 'gept-app-v' + APP_VERSION;

const PRECACHE_URLS = [
  'index.html?v=' + APP_VERSION,
  'manifest.json?v=' + APP_VERSION,

  'css/style.css?v=' + APP_VERSION,

  'js/storage.js?v=' + APP_VERSION,
  'js/data-loader.js?v=' + APP_VERSION,
  'js/quiz-engine.js?v=' + APP_VERSION,
  'js/ui-renderer.js?v=' + APP_VERSION,
  'js/listening.js?v=' + APP_VERSION,
  'js/wrongbook.js?v=' + APP_VERSION,
  'js/writing.js?v=' + APP_VERSION,
  'js/speaking.js?v=' + APP_VERSION,
  'js/mockexam.js?v=' + APP_VERSION,
  'js/progress.js?v=' + APP_VERSION,
  'js/app.js?v=' + APP_VERSION,
  'js/firebase-config.js?v=' + APP_VERSION,
  'js/auth.js?v=' + APP_VERSION,

  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon.svg',
  'icons/apple-touch-icon.png',

  'data/vocab_G1.json?v=' + APP_VERSION,
  'data/vocab_G2.json?v=' + APP_VERSION,
  'data/vocab_G3.json?v=' + APP_VERSION,
  'data/grammar_G1.json?v=' + APP_VERSION,
  'data/grammar_G2.json?v=' + APP_VERSION,
  'data/grammar_G3.json?v=' + APP_VERSION,
  'data/cloze_G1.json?v=' + APP_VERSION,
  'data/cloze_G2.json?v=' + APP_VERSION,
  'data/cloze_G3.json?v=' + APP_VERSION,
  'data/reading_G1.json?v=' + APP_VERSION,
  'data/reading_G2.json?v=' + APP_VERSION,
  'data/reading_G3.json?v=' + APP_VERSION,
  'data/writing_sentence_G1.json?v=' + APP_VERSION,
  'data/writing_sentence_G2.json?v=' + APP_VERSION,
  'data/writing_sentence_G3.json?v=' + APP_VERSION,
  'data/writing_paragraph_G1.json?v=' + APP_VERSION,
  'data/writing_paragraph_G2.json?v=' + APP_VERSION,
  'data/writing_paragraph_G3.json?v=' + APP_VERSION,
  'data/speaking_readaloud_G1.json?v=' + APP_VERSION,
  'data/speaking_readaloud_G2.json?v=' + APP_VERSION,
  'data/speaking_readaloud_G3.json?v=' + APP_VERSION,
  'data/speaking_qa_G1.json?v=' + APP_VERSION,
  'data/speaking_qa_G2.json?v=' + APP_VERSION,
  'data/speaking_qa_G3.json?v=' + APP_VERSION,
  'data/listening_picture_G1.json?v=' + APP_VERSION,
  'data/listening_picture_G2.json?v=' + APP_VERSION,
  'data/listening_picture_G3.json?v=' + APP_VERSION,
  'data/listening_response_G1.json?v=' + APP_VERSION,
  'data/listening_response_G2.json?v=' + APP_VERSION,
  'data/listening_response_G3.json?v=' + APP_VERSION,
  'data/listening_conversation_G1.json?v=' + APP_VERSION,
  'data/listening_conversation_G2.json?v=' + APP_VERSION,
  'data/listening_conversation_G3.json?v=' + APP_VERSION
];

function stripVersion(url) {
  const u = new URL(url, self.location.href);
  u.searchParams.delete('v');
  return u.href;
}

self.addEventListener('install', function (event) {
  console.log('[SW] install', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      console.log('[SW] caching', PRECACHE_URLS.length, 'files');
      return cache.addAll(PRECACHE_URLS);
    }).then(function () {
      console.log('[SW] install complete');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  console.log('[SW] activate', APP_VERSION);
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE; })
            .map(function (key) {
              console.log('[SW] deleting old cache', key);
              return caches.delete(key);
            })
      );
    }).then(function () {
      console.log('[SW] claiming clients');
      return self.clients.claim();
    })
  );
});

function isFirebaseDomain(url) {
  return /\.(firebaseapp\.com|googleapis\.com|gstatic\.com|firestore\.googleapis\.com|identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com)$/i.test(url.hostname);
}

function isStaticResource(url) {
  var p = url.pathname;
  return /\.(css|js|json|png|svg|ico|webp|jpg|jpeg|gif)$/i.test(p) ||
         p.indexOf('/data/') !== -1 ||
         p.indexOf('/icons/') !== -1;
}

function fetchWithTimeout(request, timeoutMs) {
  return new Promise(function (resolve, reject) {
    var timeoutId = setTimeout(function () {
      timeoutId = null;
      reject(new Error('timeout'));
    }, timeoutMs);
    fetch(request).then(function (response) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        resolve(response);
      }
    }, function (err) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        reject(err);
      }
    });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  var url = new URL(req.url, self.location.href);

  if (req.method !== 'GET') return;

  console.log('[SW] fetch', req.mode, url.href);

  if (req.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(req, 5000).then(function (response) {
        if (response && response.ok && response.type !== 'opaqueredirect') {
          return response;
        }
        throw new Error('bad response');
      }).catch(function () {
        console.log('[SW] navigation fallback to cache');
        return caches.match('index.html', { ignoreSearch: true })
          .then(function (r) { return r || caches.match(new Request('index.html')); });
      })
    );
    return;
  }

  if (isFirebaseDomain(url)) {
    event.respondWith(fetch(req));
    return;
  }

  var isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin && isStaticResource(url)) {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (cached) {
        if (cached) {
          console.log('[SW] cache hit', url.pathname);
          return cached;
        }
        console.log('[SW] cache miss, fetching', url.pathname);
        return fetch(req).then(function (response) {
          if (response && response.ok) {
            var clone = response.clone();
            caches.open(CACHE).then(function (cache) {
              cache.put(req, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match(req, { ignoreSearch: true });
      })
    );
    return;
  }

  event.respondWith(fetch(req));
});
