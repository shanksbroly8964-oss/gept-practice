window.GEPT = window.GEPT || {};
window.GEPT.Progress = (function() {
  'use strict';

  var rootEl = null;
  var GRADE = '';

  var SECTION_NAMES = {
    vocab: '單字測驗',
    grammar: '文法填空',
    cloze: '克漏字',
    reading: '閱讀理解',
    listening_picture: '聽力-看圖辨義',
    listening_response: '聽力-問答',
    listening_conversation: '聽力-簡短對話',
    writing_sentence: '寫作-單句',
    writing_paragraph: '寫作-段落',
    speaking_readaloud: '口說-朗讀',
    speaking_qa: '口說-回答問題'
  };

  var ALL_SECTIONS = ['vocab', 'grammar', 'cloze', 'reading',
    'listening_picture', 'listening_response', 'listening_conversation',
    'writing_sentence', 'writing_paragraph', 'speaking_readaloud', 'speaking_qa'];

  var PLAN_STORAGE_KEY = 'gept_exam_plan';

  function init(grade) {
    GRADE = grade;
  }

  function getRoot() {
    if (!rootEl) {
      rootEl = document.getElementById('progress-root');
      if (!rootEl) {
        rootEl = document.createElement('div');
        rootEl.id = 'progress-root';
        rootEl.className = 'hidden';
        var main = document.getElementById('quiz-area');
        if (main) main.appendChild(rootEl);
      }
    }
    return rootEl;
  }

  function hideAllSections() {
    var ids = ['writing-container', 'speaking-container', 'listening-container',
      'wrongbook-container', 'question-container', 'loading', 'error', 'start-message',
      'mockexam-root'];
    ids.forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function show() {
    hideAllSections();
    var root = getRoot();
    root.classList.remove('hidden');
    root.innerHTML = '<div class="state-message"><p>載入中...</p></div>';
    renderDashboard();

    try {
      if (window.GeptAuth && typeof window.GeptAuth.loadProgress === 'function') {
        window.GeptAuth.loadProgress().then(function(remoteData) {
          if (remoteData) {
            mergeRemoteData(remoteData);
            renderDashboard();
          }
        }).catch(function() {});
      }
    } catch (e) {}
  }

  function mergeRemoteData(remoteData) {
    if (remoteData.stats) {
      try {
        var localStats = JSON.parse(localStorage.getItem('gept_stats')) || {};
        mergeObjectByGrade(localStats, remoteData.stats);
        localStorage.setItem('gept_stats', JSON.stringify(localStats));
      } catch (e) {}
    }
    if (remoteData.wrong) {
      try {
        var localWrong = JSON.parse(localStorage.getItem('gept_wrong')) || {};
        mergeObjectByGrade(localWrong, remoteData.wrong);
        localStorage.setItem('gept_wrong', JSON.stringify(localWrong));
      } catch (e) {}
    }
    if (remoteData.plan) {
      try {
        var localPlan = JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY)) || {};
        mergeObjectByGrade(localPlan, remoteData.plan);
        localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(localPlan));
      } catch (e) {}
    }
  }

  function mergeObjectByGrade(localObj, remoteObj) {
    Object.keys(remoteObj).forEach(function(grade) {
      localObj[grade] = remoteObj[grade];
    });
  }

  function renderDashboard() {
    var root = getRoot();
    var stats = getAllStats();
    var wrongCount = getWrongCount();
    var allPractice = 0;
    var allCorrect = 0;

    Object.keys(stats).forEach(function(s) {
      allPractice += stats[s].correct + stats[s].wrong;
      allCorrect += stats[s].correct;
    });

    var overallAccuracy = allPractice > 0 ? Math.round((allCorrect / allPractice) * 100) : 0;

    var html = '<div class="progress-dashboard">';
    html += '<h2>📊 進度追蹤</h2>';

    html += '<div class="progress-summary-cards">';
    html += '<div class="progress-card"><span class="progress-card-num">' + allPractice + '</span><span class="progress-card-label">總練習題數</span></div>';
    html += '<div class="progress-card"><span class="progress-card-num">' + overallAccuracy + '%</span><span class="progress-card-label">總正確率</span></div>';
    html += '<div class="progress-card"><span class="progress-card-num">' + wrongCount + '</span><span class="progress-card-label">錯題數</span></div>';
    html += '<div class="progress-card"><span class="progress-card-num">' + Object.keys(stats).length + '</span><span class="progress-card-label">練習過的題型</span></div>';
    html += '</div>';

    html += '<div class="progress-section-breakdown"><h3>各題型練習統計</h3>';
    html += '<div class="progress-table-wrap"><table class="progress-table"><thead><tr><th>題型</th><th>練習量</th><th>答對</th><th>答錯</th><th>正確率</th></tr></thead><tbody>';

    var hasData = false;
    ALL_SECTIONS.forEach(function(s) {
      var st = stats[s];
      if (!st || (st.correct + st.wrong === 0)) return;
      hasData = true;
      var total = st.correct + st.wrong;
      var acc = total > 0 ? Math.round((st.correct / total) * 100) : 0;
      var accClass = acc >= 80 ? 'me-acc-great' : acc >= 60 ? 'me-acc-ok' : 'me-acc-low';
      var barPct = Math.max(acc, 5);
      html += '<tr><td>' + (SECTION_NAMES[s] || s) + '</td><td>' + total + '</td><td>' + st.correct + '</td><td>' + st.wrong + '</td><td class="' + accClass + '"><div class="progress-mini-bar"><div class="progress-mini-fill" style="width:' + barPct + '%"></div></div>' + acc + '%</td></tr>';
    });

    if (!hasData) {
      html += '<tr><td colspan="5" class="progress-empty">尚無練習記錄，開始練習後會顯示統計</td></tr>';
    }

    html += '</tbody></table></div></div>';

    html += renderPlanner();

    html += '</div>';

    root.innerHTML = html;

    bindPlannerEvents();
  }

  function getAllStats() {
    try {
      var raw = localStorage.getItem('gept_stats');
      if (raw) {
        var data = JSON.parse(raw);
        return data[GRADE] || {};
      }
    } catch (e) {}
    return {};
  }

  function getWrongCount() {
    try {
      var raw = localStorage.getItem('gept_wrong');
      if (raw) {
        var data = JSON.parse(raw);
        var gradeWrongs = data[GRADE] || {};
        var count = 0;
        Object.keys(gradeWrongs).forEach(function(s) {
          count += (gradeWrongs[s] || []).length;
        });
        return count;
      }
    } catch (e) {}
    return 0;
  }

  function renderPlanner() {
    var plan = loadPlan();
    var html = '<div class="progress-planner"><h3>📅 倒數計畫表</h3>';

    if (plan && plan.examDate) {
      var examDate = new Date(plan.examDate);
      var now = new Date();
      var daysRemaining = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      html += '<div class="planner-header">';
      html += '<p><strong>考試日期：</strong>' + plan.examDate + '</p>';
      if (daysRemaining >= 0) {
        html += '<p class="planner-days">剩餘 <span class="planner-days-num">' + daysRemaining + '</span> 天</p>';
      } else {
        html += '<p class="planner-days planner-days-past">考試日已過 ' + Math.abs(daysRemaining) + ' 天</p>';
      }
      html += '<button class="btn btn-small btn-secondary" id="planner-edit-btn">修改日期</button>';
      html += '</div>';

      if (daysRemaining >= 0) {
        html += renderDailyPlan(daysRemaining, plan);
      }

      html += '<div class="planner-edit-form hidden" id="planner-edit-form">';
      html += '<label>考試日期：<input type="date" class="planner-date-input" id="planner-date-input" value="' + plan.examDate + '"></label>';
      html += '<button class="btn btn-small" id="planner-save-btn">儲存</button>';
      html += '<button class="btn btn-small btn-secondary" id="planner-cancel-btn">取消</button>';
      html += '</div>';

    } else {
      html += '<div class="planner-setup">';
      html += '<p>設定你的目標考試日期，我們會幫你規劃每日練習！</p>';
      html += '<label>考試日期：<input type="date" class="planner-date-input" id="planner-date-input"></label>';
      html += '<button class="btn btn-small" id="planner-save-btn">開始規劃</button>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function renderDailyPlan(daysRemaining, plan) {
    var dailyVocab = GRADE === 'G1' ? 3 : GRADE === 'G2' ? 5 : 8;
    var dailyGrammar = GRADE === 'G1' ? 2 : GRADE === 'G2' ? 3 : 5;
    var dailyListening = GRADE === 'G1' ? 2 : GRADE === 'G2' ? 3 : 4;
    var dailyReading = GRADE === 'G1' ? 1 : GRADE === 'G2' ? 2 : 3;

    var checkedDays = plan.checkedDays || {};

    var html = '<div class="planner-daily"><h4>每日建議練習</h4>';
    html += '<div class="planner-daily-goals">';
    html += '<div class="planner-goal-item"><span class="planner-goal-icon">📖</span><span>單字 × ' + dailyVocab + ' 題</span></div>';
    html += '<div class="planner-goal-item"><span class="planner-goal-icon">✏️</span><span>文法 × ' + dailyGrammar + ' 題</span></div>';
    html += '<div class="planner-goal-item"><span class="planner-goal-icon">🎧</span><span>聽力 × ' + dailyListening + ' 題</span></div>';
    html += '<div class="planner-goal-item"><span class="planner-goal-icon">📚</span><span>閱讀 × ' + dailyReading + ' 題</span></div>';
    html += '</div>';

    html += '<div class="planner-checklist"><h4>每日打卡</h4>';
    html += '<div class="planner-checklist-grid">';

    var displayDays = Math.min(daysRemaining, 30);
    var startDate = new Date();
    for (var i = displayDays - 1; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() + i);
      var dateStr = formatDate(d);
      var isToday = (i === 0);
      var isPast = (i < 0);
      var checked = !!checkedDays[dateStr];
      html += '<div class="planner-day' + (isToday ? ' planner-day-today' : '') + '">';
      html += '<span class="planner-day-date">' + (i === 0 ? '今天' : i === 1 ? '明天' : dateStr) + '</span>';
      html += '<input type="checkbox" class="planner-checkbox" data-date="' + dateStr + '"' + (checked ? ' checked' : '') + '' + (isPast ? '' : '') + '>';
      html += '<span class="planner-check-text">' + (checked ? '✅' : '☐') + '</span>';
      html += '</div>';
    }

    html += '</div></div></div>';
    return html;
  }

  function formatDate(d) {
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function loadPlan() {
    try {
      var raw = localStorage.getItem(PLAN_STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        return data[GRADE] || null;
      }
    } catch (e) {}
    return null;
  }

  function savePlan(plan) {
    try {
      var raw = localStorage.getItem(PLAN_STORAGE_KEY);
      var data = raw ? JSON.parse(raw) : {};
      data[GRADE] = plan;
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(data));

      if (window.GeptAuth && typeof window.GeptAuth.syncProgress === 'function') {
        try {
          window.GeptAuth.syncProgress({ plan: data });
        } catch (e) {}
      }
    } catch (e) {}
  }

  function bindPlannerEvents() {
    var saveBtn = document.getElementById('planner-save-btn');
    var cancelBtn = document.getElementById('planner-cancel-btn');
    var editBtn = document.getElementById('planner-edit-btn');
    var dateInput = document.getElementById('planner-date-input');

    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        if (!dateInput || !dateInput.value) return;
        var plan = loadPlan() || {};
        plan.examDate = dateInput.value;
        plan.checkedDays = plan.checkedDays || {};
        savePlan(plan);
        renderDashboard();
        bindPlannerEvents();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        renderDashboard();
        bindPlannerEvents();
      });
    }

    if (editBtn) {
      editBtn.addEventListener('click', function() {
        var form = document.getElementById('planner-edit-form');
        if (form) form.classList.remove('hidden');
        editBtn.classList.add('hidden');
      });
    }

    document.querySelectorAll('.planner-checkbox').forEach(function(cb) {
      cb.addEventListener('change', function() {
        var dateStr = this.dataset.date;
        var plan = loadPlan() || {};
        if (!plan.examDate) return;
        plan.checkedDays = plan.checkedDays || {};
        plan.checkedDays[dateStr] = this.checked;
        savePlan(plan);
        renderDashboard();
        bindPlannerEvents();
      });
    });
  }

  return {
    init: init,
    show: show
  };
})();
