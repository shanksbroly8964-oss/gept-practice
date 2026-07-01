window.GEPT = window.GEPT || {};
window.GEPT.WrongBook = (function() {
  var SECTION_NAMES = {
    vocab: '單字測驗',
    grammar: '文法填空',
    cloze: '克漏字',
    reading: '閱讀理解',
    picture: '看圖辨義',
    response: '問答',
    conversation: '簡短對話'
  };

  var currentItems = [];
  var filteredItems = [];
  var selectedGrade = '';
  var selectedSection = '';

  function show() {
    selectedGrade = '';
    selectedSection = '';
    currentItems = GEPT.Storage.getAllWrongAnswers();
    filteredItems = currentItems.slice();
    render();
  }

  function render() {
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('wrongbook-container');
    container.classList.remove('hidden');

    // Gather filter options
    var grades = {};
    var sections = {};
    currentItems.forEach(function(item) {
      grades[item.grade] = true;
      sections[item.section] = true;
    });

    var gradeKeys = Object.keys(grades).sort();
    var sectionKeys = Object.keys(sections).sort();

    var html = '<div class="wrongbook">';
    html += '<h2 class="wrongbook-title">📝 錯題本</h2>';

    // Filters
    html += '<div class="wrongbook-filters">';
    html += '<select id="wb-filter-grade" class="wb-filter">';
    html += '<option value="">全部年級</option>';
    gradeKeys.forEach(function(g) {
      html += '<option value="' + g + '"' + (selectedGrade === g ? ' selected' : '') + '>' + g + '</option>';
    });
    html += '</select>';

    html += '<select id="wb-filter-section" class="wb-filter">';
    html += '<option value="">全部題型</option>';
    sectionKeys.forEach(function(s) {
      var name = SECTION_NAMES[s] || s;
      html += '<option value="' + s + '"' + (selectedSection === s ? ' selected' : '') + '>' + name + '</option>';
    });
    html += '</select>';

    html += '<button id="wb-filter-apply" class="btn btn-small">篩選</button>';
    html += '<button id="wb-clear-all" class="btn btn-small btn-danger">清空錯題本</button>';
    html += '</div>';

    // List
    if (filteredItems.length === 0) {
      html += '<div class="wrongbook-empty">';
      if (currentItems.length === 0) {
        html += '<p>🎉 沒有錯題！表現很好！</p>';
      } else {
        html += '<p>沒有符合條件的錯題</p>';
      }
      html += '</div>';
    } else {
      html += '<p class="wrongbook-count">共 ' + filteredItems.length + ' 題</p>';
      html += '<div class="wrongbook-list">';
      filteredItems.forEach(function(item, idx) {
        var secName = SECTION_NAMES[item.section] || item.section;
        html += '<div class="wrongbook-item" data-idx="' + idx + '">';
        html += '<div class="wb-item-header">';
        html += '<span class="wb-grade">' + item.grade + '</span>';
        html += '<span class="wb-section">' + secName + '</span>';
        html += '<span class="wb-id">' + escHtml((item.question.id || '')) + '</span>';
        html += '</div>';

        html += '<div class="wb-question">' + escHtml(item.question.question || '') + '</div>';

        // Show options
        var answerIdx = item.question.options.indexOf(item.question.answer);
        var correctLetter = answerIdx !== -1 ? String.fromCharCode(65 + answerIdx) : '';
        if (item.question.options) {
          html += '<div class="wb-options">';
          item.question.options.forEach(function(opt, oi) {
            var letter = String.fromCharCode(65 + oi);
            var cls = '';
            if (letter === correctLetter) cls = ' wb-correct';
            if (letter === item.userAnswer && letter !== correctLetter) cls = ' wb-wrong';
            html += '<div class="wb-option' + cls + '">' + letter + '. ' + escHtml(opt) + '</div>';
          });
          html += '</div>';
        }

        var userAnswerIdx = (item.userAnswer && item.userAnswer.length === 1) ? item.userAnswer.charCodeAt(0) - 65 : -1;
        var userAnswerFull = (item.question.options && userAnswerIdx >= 0 && userAnswerIdx < item.question.options.length)
          ? item.userAnswer + '. ' + item.question.options[userAnswerIdx] : (item.userAnswer || '');
        var correctAnswerFull;
        if (correctLetter) {
          var prefix = correctLetter + '. ';
          correctAnswerFull = (item.question.answer && item.question.answer.indexOf(prefix) === 0)
            ? item.question.answer
            : correctLetter + '. ' + item.question.answer;
        } else {
          correctAnswerFull = item.question.answer || '';
        }

        html += '<div class="wb-result">';
        html += '<span class="wb-user-answer">你的答案：' + escHtml(userAnswerFull) + '</span>';
        html += '<span class="wb-correct-answer">正確答案：' + escHtml(correctAnswerFull) + '</span>';
        html += '</div>';

        html += '<div class="wb-explanation">' + escHtml(item.question.explanation || '') + '</div>';

        html += '<div class="wb-actions">';
        html += '<button class="btn btn-small wb-practice-btn" data-idx="' + idx + '">重新練習</button>';
        html += '</div>';

        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;

    // Event listeners
    document.getElementById('wb-filter-apply').addEventListener('click', applyFilters);
    document.getElementById('wb-clear-all').addEventListener('click', function() {
      if (confirm('確定要清空所有錯題嗎？')) {
        GEPT.Storage.clearWrongAnswers();
        show();
      }
    });

    container.querySelectorAll('.wb-practice-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.dataset.idx);
        startPractice(idx);
      });
    });
  }

  function applyFilters() {
    selectedGrade = document.getElementById('wb-filter-grade').value;
    selectedSection = document.getElementById('wb-filter-section').value;

    filteredItems = currentItems.filter(function(item) {
      if (selectedGrade && item.grade !== selectedGrade) return false;
      if (selectedSection && item.section !== selectedSection) return false;
      return true;
    });

    render();
  }

  function startPractice(itemIdx) {
    if (itemIdx < 0 || itemIdx >= filteredItems.length) return;

    var item = filteredItems[itemIdx];
    var qs = [JSON.parse(JSON.stringify(item.question))];
    qs[0]._wrongMeta = { grade: item.grade, section: item.section, index: item.index };

    GEPT.QuizEngine.init(item.grade);
    GEPT.QuizEngine.loadCustomQuestions(qs);

    GEPT.UIRenderer.hideAllMain();
    GEPT.UIRenderer.resetQuestionUI();

    var progress = { current: 1, total: 1 };
    GEPT.UIRenderer.showQuestion(qs[0], progress);

    var originalAnswer = GEPT.App.onAnswer;
    var originalNext = GEPT.App.onNextQuestion;

    GEPT.App.onAnswer = function(index) {
      var result = GEPT.QuizEngine.selectAnswer(index);
      if (!result) return;

      GEPT.UIRenderer.highlightOptions(index, result.isCorrect, result.correctAnswer);
      GEPT.UIRenderer.showFeedback(result.isCorrect, result.explanation, result.correctAnswer);

      if (result.isCorrect && qs[0]._wrongMeta) {
        GEPT.Storage.removeWrongAnswer(
          qs[0]._wrongMeta.grade,
          qs[0]._wrongMeta.section,
          qs[0]._wrongMeta.index
        );
      }

      GEPT.App.onAnswer = originalAnswer;
    };

    GEPT.App.onNextQuestion = function() {
      GEPT.App.onNextQuestion = originalNext;
      show();
    };
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return {
    show: show
  };
})();
