window.GEPT = window.GEPT || {};
window.GEPT.UIRenderer = (function() {
  var GRADE_NAMES = { G1: '國一', G2: '國二', G3: '國三' };
  var DIFFICULTY  = { G1: '基礎', G2: '進階', G3: '挑戰' };
  var SECTION_ICONS = { vocab: '📖', grammar: '✏️', cloze: '📝', reading: '📚', writing: '✍️', speaking: '🎤', listening: '🎧', wrongbook: '📝' };
  var SECTION_NAMES = { vocab: '單字測驗', grammar: '文法填空', cloze: '克漏字', reading: '閱讀理解', writing: '寫作測驗', speaking: '口說測驗', listening: '聽力測驗', wrongbook: '錯題本' };

  function init() {
    var sel = document.getElementById('grade-select');
    sel.addEventListener('change', function() {
      GEPT.Storage.setGrade(this.value);
      GEPT.App.onGradeChange(this.value);
    });
  }

  function showGradePicker() {
    document.getElementById('grade-picker').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  function hideGradePicker() {
    document.getElementById('grade-picker').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  }

  function updateGradeDisplay(grade) {
    document.getElementById('grade-select').value = grade;
    document.getElementById('current-grade-label').textContent =
      GRADE_NAMES[grade] + ' · ' + DIFFICULTY[grade];
    document.querySelectorAll('.nav-btn').forEach(function(btn) { btn.classList.remove('active'); });
  }

  function showLoading() {
    hideAllMain();
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('loading').innerHTML = '載入題庫中...';
  }

  function showError(section) {
    hideAllMain();
    var el = document.getElementById('error');
    el.classList.remove('hidden');
    el.innerHTML =
      '<p>「' + SECTION_NAMES[section] + '」題庫準備中</p>' +
      '<p class="error-hint">請稍後再試，或選擇其他題型</p>';
  }

  function showStartMessage() {
    hideAllMain();
    document.getElementById('start-message').classList.remove('hidden');
  }

  function showQuestion(question, progress) {
    hideAllMain();
    var container = document.getElementById('question-container');
    container.classList.remove('hidden');

    document.getElementById('question-progress').textContent =
      '第 ' + progress.current + '/' + progress.total + ' 題';
    document.getElementById('question-id').textContent = question.id;

    var pc = document.getElementById('passage-container');
    if (question.passage && question.passage.trim()) {
      pc.classList.remove('hidden');
      pc.innerHTML = '<div class="passage-content">' + escHtml(question.passage) + '</div>';
    } else {
      pc.classList.add('hidden');
    }

    document.getElementById('question-text').textContent = question.question;

    var oc = document.getElementById('options-container');
    oc.innerHTML = '';
    question.options.forEach(function(opt, i) {
      var btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.textContent = String.fromCharCode(65 + i) + '. ' + opt;
      btn.dataset.index = i;
      btn.addEventListener('click', function() {
        GEPT.App.onAnswer(parseInt(this.dataset.index));
      });
      oc.appendChild(btn);
    });

    hideFeedback();
  }

  function hideFeedback() {
    document.getElementById('feedback').classList.add('hidden');
  }

  function showFeedback(isCorrect, explanation, correctAnswer) {
    var fb = document.getElementById('feedback');
    fb.classList.remove('hidden');

    var result = document.getElementById('feedback-result');
    result.className = 'feedback-result';
    result.classList.add(isCorrect ? 'correct' : 'incorrect');
    result.textContent = isCorrect
      ? '✓ 答對了！'
      : '✗ 答錯了！正確答案：' + correctAnswer;

    document.getElementById('feedback-explanation').textContent = explanation;
  }

  function showQuizComplete(stats) {
    hideAllMain();
    var container = document.getElementById('question-container');
    container.classList.remove('hidden');
    container.innerHTML =
      '<div class="quiz-complete">' +
        '<h2>練習完成！</h2>' +
        '<div class="complete-stats">' +
          '<div class="stat-item"><span class="stat-number correct">' + stats.correct + '</span><span class="stat-label">答對</span></div>' +
          '<div class="stat-item"><span class="stat-number incorrect">' + stats.wrong + '</span><span class="stat-label">答錯</span></div>' +
          '<div class="stat-item"><span class="stat-number">' + stats.accuracy + '%</span><span class="stat-label">正確率</span></div>' +
        '</div>' +
        '<button id="reset-section-btn" class="btn">再做一次</button>' +
        '<p class="complete-hint">或選擇其他題型繼續練習</p>' +
      '</div>';
    document.getElementById('reset-section-btn').addEventListener('click', function() {
      GEPT.App.onRestartSection();
    });
  }

  function updateStats(correct, wrong, accuracy) {
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('wrong-count').textContent = wrong;
    document.getElementById('accuracy').textContent = accuracy + '%';
  }

  function highlightOptions(selectedIndex, isCorrect, correctAnswer) {
    var buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(function(btn, i) {
      btn.disabled = true;
      var letter = String.fromCharCode(65 + i);
      if (letter === correctAnswer) {
        btn.classList.add('option-correct');
      }
      if (i === selectedIndex && !isCorrect) {
        btn.classList.add('option-wrong');
      }
    });
  }

  function resetQuestionUI() {
    document.getElementById('question-container').classList.add('hidden');
    document.getElementById('question-container').innerHTML =
      '<div class="question-header">' +
        '<span id="question-progress"></span>' +
        '<span id="question-id" class="question-id"></span>' +
      '</div>' +
      '<div id="passage-container" class="passage hidden"></div>' +
      '<p id="question-text" class="question-text"></p>' +
      '<div id="options-container" class="options"></div>' +
      '<div id="feedback" class="feedback hidden">' +
        '<p id="feedback-result" class="feedback-result"></p>' +
        '<p id="feedback-explanation" class="feedback-explanation"></p>' +
        '<button id="next-btn" class="btn">下一題</button>' +
      '</div>';
    document.getElementById('next-btn').addEventListener('click', function() {
      GEPT.App.onNextQuestion();
    });
  }

  function hideAllMain() {
    var ids = ['loading', 'error', 'start-message', 'question-container', 'writing-container', 'speaking-container', 'listening-container', 'wrongbook-container', 'mockexam-root', 'progress-root'];
    ids.forEach(function(id) { document.getElementById(id).classList.add('hidden'); });
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return {
    init: init,
    showGradePicker: showGradePicker,
    hideGradePicker: hideGradePicker,
    updateGradeDisplay: updateGradeDisplay,
    showLoading: showLoading,
    showError: showError,
    showStartMessage: showStartMessage,
    showQuestion: showQuestion,
    hideFeedback: hideFeedback,
    showFeedback: showFeedback,
    showQuizComplete: showQuizComplete,
    updateStats: updateStats,
    highlightOptions: highlightOptions,
    resetQuestionUI: resetQuestionUI,
    hideAllMain: hideAllMain
  };
})();
