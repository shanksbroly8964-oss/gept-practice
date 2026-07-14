// ============================================================
// GEPT.TTS — 集中式發音（Web Speech API）
// 重點：主動挑「最高品質的英文語音」，而非系統預設機械音；
//       支援使用者選語音 / 調語速；對話逐句用 onend 串接。
// ============================================================
window.GEPT = window.GEPT || {};
window.GEPT.TTS = (function() {
  'use strict';

  var supported = ('speechSynthesis' in window) && (typeof SpeechSynthesisUtterance !== 'undefined');
  var voices = [];
  var loaded = false;
  var readyCbs = [];

  function loadVoices() {
    if (!supported) return;
    var v = speechSynthesis.getVoices() || [];
    if (v.length) {
      voices = v;
      loaded = true;
      var cbs = readyCbs.splice(0);
      cbs.forEach(function(cb) { try { cb(); } catch (e) {} });
    }
  }

  if (supported) {
    loadVoices();
    try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
    // 某些瀏覽器 getVoices 首次為空，稍後再抓
    setTimeout(loadVoices, 300);
    setTimeout(loadVoices, 1200);
  }

  function englishVoices() {
    return voices.filter(function(v) { return /^en([-_]|$)/i.test(v.lang); });
  }

  // 品質優先序（名稱比對，越前面越優先）
  var PRIORITY = [
    /natural/i,          // Microsoft/Edge 神經語音（最自然）
    /neural/i,
    /google us english/i,
    /google.*english/i,  // Chrome / Android 的 Google 語音
    /\bava\b/i, /samantha/i, /allison/i, /\bsiri\b/i, // Apple 高品質
    /microsoft (aria|jenny|michelle|guy|zira|david|mark)/i
  ];

  function score(v) {
    var s = 0;
    for (var i = 0; i < PRIORITY.length; i++) {
      if (PRIORITY[i].test(v.name)) { s = (PRIORITY.length - i) * 10; break; }
    }
    if (/en[-_]us/i.test(v.lang)) s += 6;        // 美式優先
    if (v.localService === false) s += 3;         // 線上語音通常較自然
    return s;
  }

  function autoVoice() {
    var en = englishVoices();
    if (!en.length) return null;
    return en.slice().sort(function(a, b) { return score(b) - score(a); })[0];
  }

  function getSelectedVoice() {
    var saved = localStorage.getItem('gept_tts_voice');
    if (saved && saved !== 'auto') {
      var m = voices.filter(function(v) { return v.name === saved; })[0];
      if (m) return m;
    }
    return autoVoice();
  }

  function setVoice(name) { localStorage.setItem('gept_tts_voice', name || 'auto'); }
  function getVoicePref() { return localStorage.getItem('gept_tts_voice') || 'auto'; }

  // 語速：'grade'(依年級預設，慢) / 'normal' / 'fast'
  var GRADE_RATE = { G1: 0.4, G2: 0.45, G3: 0.5 }; // 沿用先前「慢速」設定為預設
  var PRESET_RATE = { normal: 0.8, fast: 1.0 };
  function setSpeed(s) { localStorage.setItem('gept_tts_speed', s || 'grade'); }
  function getSpeed() { return localStorage.getItem('gept_tts_speed') || 'grade'; }

  function rateFor(grade) {
    var sp = getSpeed();
    if (sp !== 'grade' && PRESET_RATE[sp]) return PRESET_RATE[sp];
    return GRADE_RATE[grade] || 0.5;
  }

  function speak(text, opts) {
    opts = opts || {};
    if (!supported || !text) { if (opts.onend) opts.onend(); return null; }
    stop();
    var u = new SpeechSynthesisUtterance(String(text));
    var v = getSelectedVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-US'; }
    u.rate = (typeof opts.rate === 'number') ? opts.rate : rateFor(opts.grade);
    u.pitch = (typeof opts.pitch === 'number') ? opts.pitch : 1;
    if (opts.onend) u.onend = opts.onend;
    if (opts.onerror) u.onerror = opts.onerror;
    try { speechSynthesis.speak(u); } catch (e) { if (opts.onend) opts.onend(); }
    return u;
  }

  function stop() { if (supported) { try { speechSynthesis.cancel(); } catch (e) {} } }
  function isSupported() { return supported; }

  function onReady(cb) {
    if (loaded) { cb(); }
    else { readyCbs.push(cb); setTimeout(cb, 1500); } // 保險：最多等 1.5s
  }

  // 填入語音下拉選單（英文語音 + 自動）
  function populateVoiceSelect(sel) {
    if (!sel) return;
    sel.innerHTML = '';
    var auto = document.createElement('option');
    auto.value = 'auto';
    var av = autoVoice();
    auto.textContent = '自動（最佳）' + (av ? '：' + shortName(av.name) : '');
    sel.appendChild(auto);
    englishVoices().forEach(function(v) {
      var o = document.createElement('option');
      o.value = v.name;
      o.textContent = shortName(v.name) + (/en[-_]us/i.test(v.lang) ? ' · 美式' : ' · ' + v.lang);
      sel.appendChild(o);
    });
    sel.value = getVoicePref();
  }

  function shortName(n) {
    return n.replace(/^(Microsoft|Google)\s+/i, '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
  }

  return {
    isSupported: isSupported,
    speak: speak,
    stop: stop,
    onReady: onReady,
    autoVoice: autoVoice,
    englishVoices: englishVoices,
    getSelectedVoice: getSelectedVoice,
    setVoice: setVoice,
    getVoicePref: getVoicePref,
    setSpeed: setSpeed,
    getSpeed: getSpeed,
    rateFor: rateFor,
    populateVoiceSelect: populateVoiceSelect,
    _score: score
  };
})();
