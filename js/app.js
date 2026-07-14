window.GEPT = window.GEPT || {};
window.GEPT.App = (function() {
  var currentGrade = '';
  var currentSection = '';
  var initCalled = false;

  function init() {
    if (initCalled) return;
    initCalled = true;

    GEPT.UIRenderer.init();

    document.querySelectorAll('.grade-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var g = this.dataset.grade;
        GEPT.Storage.setGrade(g);
        startApp(g);
      });
    });

    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var section = this.dataset.section;
        navigateTo(section);
      });
    });

    setupBottomNav();

    GEPT.QuizEngine.onStatsUpdate(updateStatsDisplay);

    currentGrade = GEPT.Storage.getGrade();
    if (!currentGrade) {
      var sel = document.getElementById('grade-select');
      currentGrade = (sel && sel.value) || 'G1';
      GEPT.Storage.setGrade(currentGrade);
    }
    startApp(currentGrade);
  }

  function navigateTo(section) {
    GEPT.Listening.resetSession();
    GEPT.Speaking.resetSession();
    GEPT.MockExam.init(currentGrade);
    updateBottomNavActive(section);

    if (section === 'listening') {
      loadListening();
    } else if (section === 'wrongbook') {
      loadWrongBook();
    } else if (section === 'writing') {
      loadWriting();
    } else if (section === 'speaking') {
      loadSpeaking();
    } else if (section === 'mockexam') {
      loadMockExam();
    } else if (section === 'progress') {
      loadProgress();
    } else {
      loadSection(section);
    }
  }

  function showGradePicker() {
    GEPT.UIRenderer.showGradePicker();
    document.getElementById('bottom-nav').classList.add('hidden');
  }

  function startApp(grade) {
    currentGrade = grade;
    GEPT.UIRenderer.hideGradePicker();
    document.getElementById('section-nav').classList.remove('hidden');
    document.getElementById('stats').classList.remove('hidden');
    document.getElementById('bottom-nav').classList.remove('hidden');
    GEPT.UIRenderer.updateGradeDisplay(grade);
    GEPT.QuizEngine.init(grade);
    GEPT.Listening.init(grade);
    GEPT.Writing.init(grade);
    GEPT.Speaking.init(grade);
    GEPT.MockExam.init(grade);
    GEPT.Progress.init(grade);
    GEPT.UIRenderer.showStartMessage();
    updateStatsDisplay();
  }

  function setupBottomNav() {
    document.querySelectorAll('#bottom-nav .bn-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var section = this.dataset.bn;
        if (!section) return;
        if (section === 'vocab') {
          loadSection('vocab');
          updateBottomNavActive('vocab');
        } else {
          navigateTo(section);
        }
      });
    });
  }

  function updateBottomNavActive(section) {
    document.querySelectorAll('#bottom-nav .bn-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.bn === section);
    });
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.section === section);
    });
  }

  function setupInstallHint() {
    var hintEl = document.getElementById('install-hint');
    var closeBtn = document.getElementById('install-hint-close');
    var installBtn = document.getElementById('install-hint-btn');
    var hintText = document.getElementById('install-hint-text');
    var deferredPrompt = null;

    if (!hintEl) return;

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        hintEl.classList.add('hidden');
        try { localStorage.setItem('gept_install_hint_closed', '1'); } catch(e) {}
      });
    }

    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      deferredPrompt = e;
      if (localStorage.getItem('gept_install_hint_closed')) return;
      hintEl.classList.remove('hidden');
      if (installBtn) installBtn.style.display = '';
      if (hintText) hintText.textContent = '將此 App 安裝到主畫面，隨時練習！';
    });

    if (installBtn) {
      installBtn.addEventListener('click', function() {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function(result) {
            deferredPrompt = null;
          });
        }
        hintEl.classList.add('hidden');
        try { localStorage.setItem('gept_install_hint_closed', '1'); } catch(e) {}
      });
    }

    window.addEventListener('appinstalled', function() {
      hintEl.classList.add('hidden');
      deferredPrompt = null;
    });

    var isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (isIOS && !isStandalone && !localStorage.getItem('gept_install_hint_closed')) {
      hintEl.classList.remove('hidden');
      if (hintText) hintText.textContent = '點選下方分享按鈕 →「加入主畫面」安裝此 App';
      if (installBtn) installBtn.style.display = 'none';
    }
  }

  function registerServiceWorker() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.register('sw.js')
      .then(function(reg) {
        console.log('[SW] registered scope:', reg.scope);
      })
      .catch(function(err) {
        console.warn('[SW] register failed:', err);
      });
  }

  function loadWriting() {
    currentSection = 'writing';
    updateBottomNavActive('writing');
    GEPT.Writing.showSubtypeSelection();
  }

  function loadSpeaking() {
    currentSection = 'speaking';
    updateBottomNavActive('speaking');
    GEPT.Speaking.showSubtypeSelection();
  }

  function loadListening() {
    currentSection = 'listening';
    updateBottomNavActive('listening');
    GEPT.Listening.showSubtypeSelection();
  }

  function loadWrongBook() {
    currentSection = 'wrongbook';
    updateBottomNavActive('wrongbook');
    GEPT.WrongBook.show();
  }

  function loadMockExam() {
    currentSection = 'mockexam';
    updateBottomNavActive('mockexam');
    GEPT.MockExam.start();
  }

  function loadProgress() {
    currentSection = 'progress';
    updateBottomNavActive('progress');
    GEPT.Progress.show();
  }

  function loadSection(section) {
    currentSection = section;
    updateBottomNavActive(section);
    GEPT.UIRenderer.resetQuestionUI();
    GEPT.UIRenderer.showLoading();

    GEPT.QuizEngine.loadSection(section).then(function(result) {
      if (result.success && result.total > 0) {
        var q = GEPT.QuizEngine.getCurrentQuestion();
        var p = GEPT.QuizEngine.getProgress();
        GEPT.UIRenderer.showQuestion(q, p);
      } else {
        GEPT.UIRenderer.showError(section);
      }
    });
  }

  function onAnswer(index) {
    var result = GEPT.QuizEngine.selectAnswer(index);
    if (!result) return;

    GEPT.UIRenderer.highlightOptions(index, result.isCorrect, result.correctAnswer);
    GEPT.UIRenderer.showFeedback(result.isCorrect, result.explanation, result.correctAnswer);
    updateStatsDisplay();
  }

  function onNextQuestion() {
    var result = GEPT.QuizEngine.nextQuestion();
    if (result.hasNext) {
      GEPT.UIRenderer.showQuestion(result.question, result.progress);
    } else if (result.isComplete) {
      GEPT.UIRenderer.showQuizComplete(result.stats);
    }
  }

  function onGradeChange(grade) {
    startApp(grade);
    GEPT.UIRenderer.resetQuestionUI();
  }

  function onRestartSection() {
    if (currentSection) loadSection(currentSection);
  }

  function updateStatsDisplay() {
    var stats = GEPT.Storage.getStats(currentGrade, currentSection);
    var total = stats.correct + stats.wrong;
    var accuracy = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    GEPT.UIRenderer.updateStats(stats.correct, stats.wrong, accuracy);
  }

  function resetApp() {
    initCalled = false;
    currentGrade = '';
    currentSection = '';
    document.getElementById('section-nav').classList.add('hidden');
    document.getElementById('stats').classList.add('hidden');
    document.getElementById('bottom-nav').classList.add('hidden');
    showGradePicker();
  }

  // ── PWA 設定不受登入閘門影響，頁面載入即執行 ──
  function bootPWA() {
    try { setupInstallHint(); } catch (e) {}
    try { registerServiceWorker(); } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootPWA);
  } else {
    bootPWA();
  }

  // ── Auth gate ────────────────────────────────────────────

  // GeptAuth 由 auth.js 定義，而 auth.js 於本檔之後載入。
  // 因此延到 DOM 載入完成(此時 auth.js 已執行)再綁定，避免載入期 window.GeptAuth 未定義而中斷。
  function wireAuthGate() {
    if (!window.GeptAuth) { setTimeout(wireAuthGate, 50); return; }
    window.GeptAuth.onReady(function() {
      if (window.GeptAuth.isLoggedIn()) {
        init();
      }
    });
    window.GeptAuth.onUserChange(function(user, isGuest) {
      if (user || isGuest) {
        if (!initCalled) {
          init();
        }
      } else {
        if (initCalled) {
          resetApp();
        }
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAuthGate);
  } else {
    wireAuthGate();
  }

  return {
    init: init,
    resetApp: resetApp,
    onGradeChange: onGradeChange,
    onAnswer: onAnswer,
    onNextQuestion: onNextQuestion,
    onRestartSection: onRestartSection
  };
})();
