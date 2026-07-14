window.GEPT = window.GEPT || {};
window.GEPT.Listening = (function() {
  var SUBTYPE_INFO = {
    picture: { name: '看圖辨義', icon: '🖼️', desc: '聽句子選出對應圖片' },
    response: { name: '問答', icon: '💬', desc: '聽問題選出最佳回應' },
    conversation: { name: '簡短對話', icon: '👥', desc: '聽對話選出正確答案' }
  };

  var GRADE_SUBTYPES = {
    G1: ['picture'],
    G2: ['picture', 'response', 'conversation'],
    G3: ['picture', 'response', 'conversation']
  };

  var currentGrade = '';
  var currentSubtype = '';
  var questions = [];
  var currentIndex = 0;
  var answered = false;
  var sessionCorrect = 0;
  var sessionWrong = 0;
  var speechSynth = window.speechSynthesis;
  var isSpeaking = false;
  var autoPlayTimer = null;

  function init(grade) {
    currentGrade = grade;
    resetSession();
  }

  function resetSession() {
    questions = [];
    currentIndex = 0;
    answered = false;
    sessionCorrect = 0;
    sessionWrong = 0;
    currentSubtype = '';
    stopSpeaking();
    if (autoPlayTimer) { clearTimeout(autoPlayTimer); autoPlayTimer = null; }
  }

  function showSubtypeSelection() {
    stopSpeaking();
    if (autoPlayTimer) { clearTimeout(autoPlayTimer); autoPlayTimer = null; }
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('listening-container');
    container.classList.remove('hidden');

    var allowed = GRADE_SUBTYPES[currentGrade] || ['picture'];
    var html = '<div class="subtype-selection">';
    html += '<h2 class="subtype-title">聽力測驗</h2>';
    html += '<p class="subtype-hint">選擇題型開始聽力練習</p>';
    html += '<div class="subtype-grid">';

    allowed.forEach(function(key) {
      var info = SUBTYPE_INFO[key];
      if (!info) return;
      html += '<button class="subtype-btn" data-subtype="' + key + '">';
      html += '<span class="subtype-icon">' + info.icon + '</span>';
      html += '<span class="subtype-label">' + info.name + '</span>';
      if (currentGrade !== 'G3') {
        html += '<span class="subtype-desc">' + info.desc + '</span>';
      }
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
    answered = false;
    sessionCorrect = 0;
    sessionWrong = 0;
    questions = [];

    GEPT.UIRenderer.showLoading();

    var dataKey = 'listening_' + subtype;
    GEPT.DataLoader.fetchQuestions(dataKey, currentGrade)
      .then(function(data) {
        questions = shuffle(data).slice(0, 10);
        if (questions.length === 0) {
          showSubtypeError(subtype);
          return;
        }
        showQuestion();
      })
      .catch(function() {
        showSubtypeError(subtype);
      });
  }

  function showSubtypeError(subtype) {
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('listening-container');
    container.classList.remove('hidden');
    var info = SUBTYPE_INFO[subtype] || { name: subtype };
    container.innerHTML =
      '<div class="state-message">' +
        '<p>「' + info.name + '」題庫準備中</p>' +
        '<p class="error-hint">請稍後再試，或選擇其他題型</p>' +
        '<button id="back-subtype-btn" class="btn" style="margin-top:1rem">返回聽力選單</button>' +
      '</div>';
    document.getElementById('back-subtype-btn').addEventListener('click', function() {
      showSubtypeSelection();
    });
  }

  function showQuestion() {
    stopSpeaking();

    if (currentIndex >= questions.length) {
      showComplete();
      return;
    }

    var q = questions[currentIndex];
    answered = false;
    GEPT.UIRenderer.hideAllMain();

    var container = document.getElementById('listening-container');
    container.classList.remove('hidden');

    var progress = (currentIndex + 1) + ' / ' + questions.length;

    var html = '<div class="listening-question">';
    html += '<div class="listening-header">';
    html += '<span class="question-progress">第 ' + progress + ' 題</span>';
    html += '<span class="question-id">' + escHtml(q.id) + '</span>';
    html += '</div>';

    if (q.type === 'picture' && q.image) {
      html += '<div class="listening-image">' + escHtml(q.image) + '</div>';
    }

    if (q.type === 'conversation') {
      html += '<div class="conversation-box">';
      var lines = (q.audio_script || '').split('\n');
      lines.forEach(function(line) {
        if (line.trim()) {
          html += '<div class="conversation-line">' + escHtml(line.trim()) + '</div>';
        }
      });
      html += '</div>';
    }

    html += '<div class="audio-controls">';
    html += '<button id="play-btn" class="play-btn">▶ 播放音檔</button>';
    html += '<span id="play-status" class="play-status"></span>';
    html += '</div>';

    html += '<p class="question-text">' + escHtml(q.question) + '</p>';

    html += '<div class="options">';
    q.options.forEach(function(opt, i) {
      var letter = String.fromCharCode(65 + i);
      html += '<button class="option-btn" data-index="' + i + '">' + letter + '. ' + escHtml(opt) + '</button>';
    });
    html += '</div>';

    html += '<div id="listening-feedback" class="feedback hidden">';
    html += '<p id="listening-feedback-result" class="feedback-result"></p>';
    html += '<p id="listening-feedback-explanation" class="feedback-explanation"></p>';
    html += '<button id="listening-next-btn" class="btn">下一題</button>';
    html += '</div>';

    html += '</div>';

    container.innerHTML = html;

    // Play button
    document.getElementById('play-btn').addEventListener('click', function() {
      if (isSpeaking) {
        stopSpeaking();
      } else {
        playAudio(q.audio_script || '');
      }
    });

    // Option buttons
    container.querySelectorAll('.option-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (answered) return;
        onAnswer(parseInt(this.dataset.index), q);
      });
    });

    // Next button
    document.getElementById('listening-next-btn').addEventListener('click', function() {
      currentIndex++;
      showQuestion();
    });

    // Auto-play for G1/G2, not for G3
    if (autoPlayTimer) clearTimeout(autoPlayTimer);
    if (currentGrade !== 'G3') {
      autoPlayTimer = setTimeout(function() {
        autoPlayTimer = null;
        playAudio(q.audio_script || '');
      }, 300);
    }
  }

  function playAudio(script) {
    if (!script || !speechSynth) {
      updatePlayStatus('瀏覽器不支援語音功能');
      return;
    }

    stopSpeaking();

    var statusEl = document.getElementById('play-status');
    var playBtn = document.getElementById('play-btn');
    if (statusEl) statusEl.textContent = '播放中...';
    if (playBtn) playBtn.textContent = '⏹ 停止';

    isSpeaking = true;

    var lines = script.split('\n').filter(function(l) { return l.trim(); });
    var currentLine = 0;

    function speakNext() {
      if (currentLine >= lines.length || !isSpeaking) {
        speakDone();
        return;
      }

      GEPT.TTS.speak(lines[currentLine].trim(), {
        grade: currentGrade,
        onend: function() {
          currentLine++;
          setTimeout(speakNext, 200);
        },
        onerror: function() {
          currentLine++;
          setTimeout(speakNext, 200);
        }
      });
    }

    speakNext();
  }

  function stopSpeaking() {
    isSpeaking = false;
    if (speechSynth) {
      speechSynth.cancel();
    }
    updatePlayStatus('');
    var playBtn = document.getElementById('play-btn');
    if (playBtn) playBtn.textContent = '▶ 播放音檔';
  }

  function speakDone() {
    isSpeaking = false;
    updatePlayStatus('播放完成');
    var playBtn = document.getElementById('play-btn');
    if (playBtn) playBtn.textContent = '▶ 重播';
  }

  function updatePlayStatus(msg) {
    var el = document.getElementById('play-status');
    if (el) el.textContent = msg;
  }

  function onAnswer(index, q) {
    if (answered) return;
    answered = true;

    var letters = ['A', 'B', 'C', 'D'];
    var userLetter = letters[index] || '';
    var correctLetter = getCorrectLetter(q);
    var isCorrect = userLetter === correctLetter;

    if (isCorrect) {
      sessionCorrect++;
    } else {
      sessionWrong++;
      GEPT.Storage.addWrongAnswer(currentGrade, currentSubtype, q, userLetter);
    }

    // Highlight options
    var btns = document.querySelectorAll('#listening-container .option-btn');
    btns.forEach(function(btn, i) {
      btn.disabled = true;
      var letter = String.fromCharCode(65 + i);
      if (letter === correctLetter) {
        btn.classList.add('option-correct');
      }
      if (i === index && !isCorrect) {
        btn.classList.add('option-wrong');
      }
    });

    // Show feedback
    var fb = document.getElementById('listening-feedback');
    fb.classList.remove('hidden');

    var result = document.getElementById('listening-feedback-result');
    result.className = 'feedback-result';
    result.classList.add(isCorrect ? 'correct' : 'incorrect');
    result.textContent = isCorrect
      ? '✓ 答對了！'
      : '✗ 答錯了！正確答案：' + correctLetter;

    document.getElementById('listening-feedback-explanation').textContent = q.explanation || '';
  }

  function getCorrectLetter(q) {
    var letters = ['A', 'B', 'C', 'D'];
    if (q.answer && q.answer.length === 1 && letters.indexOf(q.answer) !== -1) {
      return q.answer;
    }
    var idx = q.options.indexOf(q.answer);
    return idx !== -1 ? letters[idx] : '';
  }

  function showComplete() {
    stopSpeaking();
    if (autoPlayTimer) { clearTimeout(autoPlayTimer); autoPlayTimer = null; }
    var total = sessionCorrect + sessionWrong;
    var accuracy = total > 0 ? Math.round((sessionCorrect / total) * 100) : 0;

    var container = document.getElementById('listening-container');
    container.classList.remove('hidden');
    container.innerHTML =
      '<div class="quiz-complete">' +
        '<h2>聽力練習完成！</h2>' +
        '<div class="complete-stats">' +
          '<div class="stat-item"><span class="stat-number correct">' + sessionCorrect + '</span><span class="stat-label">答對</span></div>' +
          '<div class="stat-item"><span class="stat-number incorrect">' + sessionWrong + '</span><span class="stat-label">答錯</span></div>' +
          '<div class="stat-item"><span class="stat-number">' + accuracy + '%</span><span class="stat-label">正確率</span></div>' +
        '</div>' +
        '<button id="listening-restart-btn" class="btn">再做一次</button>' +
        '<button id="listening-back-btn" class="btn btn-secondary" style="margin-top:0.5rem">返回聽力選單</button>' +
      '</div>';

    document.getElementById('listening-restart-btn').addEventListener('click', function() {
      loadSubtype(currentSubtype);
    });
    document.getElementById('listening-back-btn').addEventListener('click', function() {
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
    resetSession: resetSession
  };
})();
