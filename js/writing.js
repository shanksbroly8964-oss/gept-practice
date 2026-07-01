window.GEPT = window.GEPT || {};
window.GEPT.Writing = (function() {
  var SUBTYPE_INFO = {
    sentence: { name: '單句寫作', icon: '✍️', desc: '根據提示寫出正確的英文句子' },
    paragraph: { name: '看圖段落寫作', icon: '🖼️', desc: '看圖寫出一段完整的英文段落' }
  };

  var currentGrade = '';
  var currentSubtype = '';
  var questions = [];
  var currentIndex = 0;

  function init(grade) {
    currentGrade = grade;
    resetSession();
  }

  function resetSession() {
    questions = [];
    currentIndex = 0;
    currentSubtype = '';
  }

  function showSubtypeSelection() {
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('writing-container');
    container.classList.remove('hidden');

    var html = '<div class="subtype-selection">';
    html += '<h2 class="subtype-title">寫作測驗</h2>';
    html += '<p class="subtype-hint">選擇題型開始寫作練習</p>';
    html += '<div class="subtype-grid">';

    Object.keys(SUBTYPE_INFO).forEach(function(key) {
      var info = SUBTYPE_INFO[key];
      html += '<button class="subtype-btn" data-subtype="' + key + '">';
      html += '<span class="subtype-icon">' + info.icon + '</span>';
      html += '<span class="subtype-label">' + info.name + '</span>';
      html += '<span class="subtype-desc">' + info.desc + '</span>';
      html += '</button>';
    });

    html += '</div></div>';
    container.innerHTML = html;

    container.querySelectorAll('.subtype-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        loadSubtype(this.dataset.subtype);
      });
    });
  }

  function loadSubtype(subtype) {
    currentSubtype = subtype;
    currentIndex = 0;
    questions = [];

    GEPT.UIRenderer.showLoading();

    var dataKey = 'writing_' + subtype;
    GEPT.DataLoader.fetchQuestions(dataKey, currentGrade)
      .then(function(data) {
        questions = shuffle(data);
        if (questions.length === 0) {
          showSubtypeError(subtype);
          return;
        }
        try {
          showQuestion();
        } catch (e) {
          console.error('Writing render error (' + subtype + '):', e);
          showRenderError(subtype, e);
        }
      })
      .catch(function(err) {
        console.error('Writing load error (' + subtype + '):', err);
        showSubtypeError(subtype);
      });
  }

  function showSubtypeError(subtype) {
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('writing-container');
    container.classList.remove('hidden');
    var info = SUBTYPE_INFO[subtype] || { name: subtype };
    container.innerHTML =
      '<div class="state-message">' +
        '<p>「' + info.name + '」題庫準備中</p>' +
        '<p class="error-hint">請稍後再試，或選擇其他題型</p>' +
        '<button id="back-writing-subtype-btn" class="btn" style="margin-top:1rem">返回寫作選單</button>' +
      '</div>';
    document.getElementById('back-writing-subtype-btn').addEventListener('click', function() {
      showSubtypeSelection();
    });
  }

  function showRenderError(subtype, err) {
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('writing-container');
    container.classList.remove('hidden');
    var info = SUBTYPE_INFO[subtype] || { name: subtype };
    container.innerHTML =
      '<div class="state-message">' +
        '<p>「' + info.name + '」發生錯誤</p>' +
        '<p class="error-hint">' + escHtml((err && err.message) || '未知錯誤') + '</p>' +
        '<button id="back-writing-subtype-btn" class="btn" style="margin-top:1rem">返回寫作選單</button>' +
      '</div>';
    document.getElementById('back-writing-subtype-btn').addEventListener('click', function() {
      showSubtypeSelection();
    });
  }

  function showQuestion() {
    if (currentIndex >= questions.length) {
      showComplete();
      return;
    }

    var q = questions[currentIndex];
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('writing-container');
    container.classList.remove('hidden');

    if (q.type === 'paragraph') {
      renderParagraph(q);
    } else {
      renderSentence(q);
    }
  }

  function renderSentence(q) {
    var progress = (currentIndex + 1) + ' / ' + questions.length;
    var html = buildHeader(q, progress);

    html += '<div class="writing-instruction">' + escHtml(q.instruction) + '</div>';
    html += '<div class="writing-prompt">' + escHtml(q.prompt) + '</div>';

    html += '<textarea class="writing-textarea" id="writing-answer" placeholder="請在此輸入你的答案..."></textarea>';

    html += '<div class="writing-actions">';
    html += '<button id="writing-show-answer-btn" class="btn btn-secondary btn-small">看參考答案</button>';
    html += '</div>';

    html += '<div id="writing-sample-area" class="writing-sample hidden">';
    html += '<div class="sample-answer-box">';
    html += '<h4>📝 參考答案</h4>';
    html += '<p class="sample-answer-text">' + escHtml(q.sample_answer) + '</p>';
    html += '</div>';
    html += '<div class="checkpoint-box">';
    html += '<h4>✅ 檢核項目</h4>';
    html += '<ul class="checkpoint-list">';
    (q.checkpoints || []).forEach(function(cp) {
      html += '<li class="checkpoint-item">' + escHtml(cp) + '</li>';
    });
    html += '</ul></div>';
    html += '<div class="explanation-box">';
    html += '<h4>💡 說明</h4>';
    html += '<p>' + escHtml(q.explanation) + '</p>';
    html += '</div>';
    html += '</div>';

    html += buildNav();

    document.getElementById('writing-container').innerHTML = html;
    bindCommonEvents();
  }

  function renderParagraph(q) {
    var progress = (currentIndex + 1) + ' / ' + questions.length;
    var html = buildHeader(q, progress);

    if (q.image) {
      html += '<div class="writing-image">' + escHtml(q.image) + '</div>';
    }

    html += '<div class="writing-instruction">' + escHtml(q.instruction) + '</div>';
    html += '<div class="writing-prompt">' + escHtml(q.prompt) + '</div>';

    var minWords = q.min_words || 30;
    html += '<div class="writing-textarea-wrapper">';
    html += '<textarea class="writing-textarea paragraph-textarea" id="writing-answer" placeholder="請在此輸入你的段落..."></textarea>';
    html += '<div class="word-count" id="word-count">字數：0 / ' + minWords + '</div>';
    html += '</div>';

    html += '<div class="writing-actions">';
    html += '<button id="writing-show-answer-btn" class="btn btn-secondary btn-small">看範文</button>';
    html += '</div>';

    html += '<div id="writing-sample-area" class="writing-sample hidden">';
    html += '<div class="sample-answer-box">';
    html += '<h4>📝 範文</h4>';
    html += '<p class="sample-answer-text">' + escHtml(q.sample_answer) + '</p>';
    html += '</div>';
    html += '<div class="checkpoint-box">';
    html += '<h4>✅ 檢核項目</h4>';
    html += '<ul class="checkpoint-list">';
    (q.checkpoints || []).forEach(function(cp) {
      html += '<li class="checkpoint-item">' + escHtml(cp) + '</li>';
    });
    html += '</ul></div>';
    html += '<div class="explanation-box">';
    html += '<h4>💡 說明</h4>';
    html += '<p>' + escHtml(q.explanation) + '</p>';
    html += '</div>';
    html += '</div>';

    html += buildNav();

    document.getElementById('writing-container').innerHTML = html;
    bindCommonEvents();

    document.getElementById('writing-answer').addEventListener('input', function() {
      updateWordCount(this, minWords);
    });
  }

  function buildHeader(q, progress) {
    var html = '<div class="writing-question">';
    html += '<div class="listening-header">';
    html += '<span class="question-progress">第 ' + progress + ' 題</span>';
    html += '<span class="question-id">' + escHtml(q.id) + '</span>';
    html += '</div>';
    return html;
  }

  function buildNav() {
    var html = '<div class="writing-nav">';
    if (currentIndex > 0) {
      html += '<button id="writing-prev-btn" class="btn btn-secondary btn-small">上一題</button>';
    }
    if (currentIndex < questions.length - 1) {
      html += '<button id="writing-next-btn" class="btn btn-small">下一題</button>';
    } else {
      html += '<button id="writing-finish-btn" class="btn btn-small">完成測驗</button>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function bindCommonEvents() {
    document.getElementById('writing-show-answer-btn').addEventListener('click', function() {
      var area = document.getElementById('writing-sample-area');
      area.classList.toggle('hidden');
      this.textContent = area.classList.contains('hidden')
        ? (questions[currentIndex].type === 'paragraph' ? '看範文' : '看參考答案')
        : (questions[currentIndex].type === 'paragraph' ? '隱藏範文' : '隱藏參考答案');
    });

    var prevBtn = document.getElementById('writing-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        currentIndex--;
        showQuestion();
      });
    }

    var nextBtn = document.getElementById('writing-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        currentIndex++;
        showQuestion();
      });
    }

    var finishBtn = document.getElementById('writing-finish-btn');
    if (finishBtn) {
      finishBtn.addEventListener('click', function() {
        showComplete();
      });
    }
  }

  function updateWordCount(textarea, minWords) {
    var text = textarea.value.trim();
    var count = text === '' ? 0 : text.split(/\s+/).length;
    var el = document.getElementById('word-count');
    if (el) {
      el.textContent = '字數：' + count + ' / ' + minWords;
      el.className = 'word-count' + (count >= minWords ? ' word-count-ok' : ' word-count-warn');
    }
  }

  function showComplete() {
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('writing-container');
    container.classList.remove('hidden');
    container.innerHTML =
      '<div class="quiz-complete">' +
        '<h2>寫作練習完成！</h2>' +
        '<p>你已完成所有題目，記得參考解析自我對照學習。</p>' +
        '<button id="writing-restart-btn" class="btn">再做一次</button>' +
        '<button id="writing-back-btn" class="btn btn-secondary" style="margin-top:0.5rem">返回寫作選單</button>' +
      '</div>';

    document.getElementById('writing-restart-btn').addEventListener('click', function() {
      loadSubtype(currentSubtype);
    });
    document.getElementById('writing-back-btn').addEventListener('click', function() {
      showSubtypeSelection();
    });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  return {
    init: init,
    showSubtypeSelection: showSubtypeSelection,
    updateWordCount: updateWordCount
  };
})();
