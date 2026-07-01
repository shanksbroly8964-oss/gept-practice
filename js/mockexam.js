window.GEPT = window.GEPT || {};
window.GEPT.MockExam = (function() {
  'use strict';

  var rootEl = null;
  var GRADE = '';
  var allQuestions = [];
  var currentIndex = 0;
  var answered = false;
  var sessionAnswers = [];
  var timerInterval = null;
  var timeRemaining = 0;
  var timeLimit = 0;
  var totalQuestions = 0;
  var isExamStarted = false;
  var audioSynth = null;
  var sectionOrder = [];

  var GRADE_CONFIG = {
    G3: {
      sections: [
        { key: 'vocab', count: 10 },
        { key: 'grammar', count: 10 },
        { key: 'cloze', count: 5 },
        { key: 'reading', count: 5 },
        { key: 'listening_picture', count: 5 },
        { key: 'listening_response', count: 5 },
        { key: 'listening_conversation', count: 5 }
      ],
      time: 50 * 60
    },
    G2: {
      sections: [
        { key: 'vocab', count: 5 },
        { key: 'grammar', count: 5 },
        { key: 'cloze', count: 3 },
        { key: 'reading', count: 3 },
        { key: 'listening_picture', count: 3 },
        { key: 'listening_response', count: 3 },
        { key: 'listening_conversation', count: 3 }
      ],
      time: 35 * 60
    },
    G1: {
      sections: [
        { key: 'vocab', count: 3 },
        { key: 'grammar', count: 3 },
        { key: 'cloze', count: 2 },
        { key: 'reading', count: 2 },
        { key: 'listening_picture', count: 2 },
        { key: 'listening_response', count: 2 },
        { key: 'listening_conversation', count: 2 }
      ],
      time: 20 * 60
    }
  };

  var SECTION_NAMES = {
    vocab: '單字測驗',
    grammar: '文法填空',
    cloze: '克漏字',
    reading: '閱讀理解',
    listening_picture: '聽力-看圖辨義',
    listening_response: '聽力-問答',
    listening_conversation: '聽力-簡短對話'
  };

  var LISTENING_SECTIONS = ['listening_picture', 'listening_response', 'listening_conversation'];

  function init(grade) {
    GRADE = grade;
    allQuestions = [];
    sessionAnswers = [];
    currentIndex = 0;
    answered = false;
    isExamStarted = false;
    stopTimer();
    totalQuestions = 0;
    timeRemaining = 0;
    timeLimit = 0;
    sectionOrder = [];
    if (audioSynth) {
      window.speechSynthesis.cancel();
      audioSynth = null;
    }
  }

  function getRoot() {
    if (!rootEl) {
      rootEl = document.getElementById('mockexam-root');
      if (!rootEl) {
        rootEl = document.createElement('div');
        rootEl.id = 'mockexam-root';
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
      'progress-root'];
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

  async function start() {
    hideAllSections();
    var root = getRoot();
    root.classList.remove('hidden');
    init(GRADE);

    root.innerHTML = '<div class="mockexam-intro"><h2>⏱️ 限時模擬考</h2><p>正在準備題目...</p></div>';

    var config = GRADE_CONFIG[GRADE];
    if (!config) {
      root.innerHTML = '<div class="state-message"><p>不支援此年級的模擬考</p></div>';
      return;
    }

    try {
      await assembleExam(config);
    } catch (e) {
      root.innerHTML = '<div class="state-message"><p>題庫準備中，請稍後再試</p><p class="error-hint">' + escHtml(e.message) + '</p></div>';
      return;
    }

    if (allQuestions.length === 0) {
      root.innerHTML = '<div class="state-message"><p>題庫準備中</p></div>';
      return;
    }

    totalQuestions = allQuestions.length;
    timeLimit = config.time;
    timeRemaining = timeLimit;
    renderStartScreen();
  }

  async function assembleExam(config) {
    allQuestions = [];
    sectionOrder = [];

    var fetchPromises = config.sections.map(function(sec) {
      return GEPT.DataLoader.fetchQuestions(sec.key, GRADE)
        .then(function(data) {
          var shuffled = shuffle(data.slice());
          var selected = shuffled.slice(0, sec.count);
          selected.forEach(function(q) {
            q._section = sec.key;
            q._questionIndex = allQuestions.length;
          });
          allQuestions = allQuestions.concat(selected);
          sectionOrder.push(sec.key);
        })
        .catch(function() {
          console.warn('MockExam: 無法載入 ' + sec.key);
        });
    });

    await Promise.all(fetchPromises);
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

  function renderStartScreen() {
    var root = getRoot();
    var secList = '';
    var config = GRADE_CONFIG[GRADE];
    config.sections.forEach(function(sec) {
      secList += '<li>' + SECTION_NAMES[sec.key] + ' × ' + sec.count + ' 題</li>';
    });

    var minutes = Math.floor(timeLimit / 60);
    root.innerHTML =
      '<div class="mockexam-intro">' +
      '<div class="mockexam-intro-icon">⏱️</div>' +
      '<h2>限時模擬考</h2>' +
      '<p class="mockexam-grade">年級：' + (GRADE === 'G1' ? '國一 G1' : GRADE === 'G2' ? '國二 G2' : '國三 G3') + '</p>' +
      '<div class="mockexam-intro-info">' +
      '<div class="mockexam-intro-stat"><span class="me-stat-num">' + totalQuestions + '</span><span>總題數</span></div>' +
      '<div class="mockexam-intro-stat"><span class="me-stat-num">' + minutes + '</span><span>分鐘</span></div>' +
      '</div>' +
      '<div class="mockexam-intro-sections"><h4>題型分配</h4><ul>' + secList + '</ul></div>' +
      '<p class="mockexam-intro-hint">按下開始後計時器即啟動，時間到將自動交卷</p>' +
      '<button class="btn mockexam-start-btn" id="mockexam-start-btn">開始考試</button>' +
      '</div>';

    document.getElementById('mockexam-start-btn').addEventListener('click', function() {
      beginExam();
    });
  }

  function beginExam() {
    isExamStarted = true;
    currentIndex = 0;
    sessionAnswers = [];
    answered = false;
    timeRemaining = timeLimit;
    renderExamUI();
    showCurrentQuestion();
    startTimer();
  }

  function renderExamUI() {
    var root = getRoot();
    root.innerHTML =
      '<div class="mockexam-exam">' +
      '<div class="mockexam-timer-bar-container">' +
      '<div class="mockexam-timer-bar" id="mockexam-timer-bar"></div>' +
      '</div>' +
      '<div class="mockexam-timer-text" id="mockexam-timer-text"></div>' +
      '<div class="mockexam-question-area" id="mockexam-question-area"></div>' +
      '</div>';

    updateTimerDisplay();
  }

  function showCurrentQuestion() {
    if (currentIndex >= allQuestions.length) {
      submitExam();
      return;
    }

    answered = false;
    var q = allQuestions[currentIndex];
    var area = document.getElementById('mockexam-question-area');
    if (!area) return;

    var html = '<div class="mockexam-question">';
    html += '<div class="mockexam-q-header">';
    html += '<span class="mockexam-q-progress">第 ' + (currentIndex + 1) + ' / ' + totalQuestions + ' 題</span>';
    html += '<span class="mockexam-q-section">' + SECTION_NAMES[q._section] + '</span>';
    html += '<span class="mockexam-q-id">' + escHtml(q.id || '') + '</span>';
    html += '</div>';

    if (LISTENING_SECTIONS.indexOf(q._section) !== -1) {
      html += renderListeningContent(q);
    } else {
      html += renderStandardContent(q);
    }

    html += '<div class="mockexam-options" id="mockexam-options">';
    (q.options || []).forEach(function(opt, i) {
      var letter = String.fromCharCode(65 + i);
      html += '<button class="option-btn mockexam-option-btn" data-index="' + i + '"><span class="opt-letter">' + letter + '.</span> ' + escHtml(opt) + '</button>';
    });
    html += '</div>';

    html += '<div class="mockexam-feedback hidden" id="mockexam-feedback"></div>';
    html += '</div>';

    area.innerHTML = html;

    document.querySelectorAll('#mockexam-options .mockexam-option-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (answered) return;
        var idx = parseInt(this.dataset.index);
        handleAnswer(idx);
      });
    });

    updateTimerDisplay();
  }

  function renderStandardContent(q) {
    var html = '';
    if (q.passage) {
      html += '<div class="mockexam-passage"><div class="passage-content">' + escHtml(q.passage).replace(/\n/g, '<br>') + '</div></div>';
    }
    html += '<p class="mockexam-q-text">' + escHtml(q.question || '') + '</p>';
    return html;
  }

  function renderListeningContent(q) {
    var html = '';
    if (q.type === 'picture' && q.image) {
      html += '<div class="mockexam-listening-image">' + escHtml(q.image) + '</div>';
    }
    if (q.type === 'conversation' && q.audio_script) {
      var lines = q.audio_script.split('\n');
      html += '<div class="mockexam-conversation-box">';
      lines.forEach(function(line) {
        if (line.trim()) {
          html += '<div class="mockexam-conversation-line">' + escHtml(line.trim()) + '</div>';
        }
      });
      html += '</div>';
    }
    html += '<div class="mockexam-audio-controls"><button class="btn btn-small mockexam-play-btn" onclick="window.GEPT.MockExam._playAudio()">🔊 播放音檔</button><span class="mockexam-play-status" id="mockexam-play-status"></span></div>';
    html += '<p class="mockexam-q-text">' + escHtml(q.question || '') + '</p>';
    return html;
  }

  function _playAudio() {
    if (currentIndex >= allQuestions.length) return;
    var q = allQuestions[currentIndex];
    if (!q.audio_script) return;

    window.speechSynthesis.cancel();
    var statusEl = document.getElementById('mockexam-play-status');
    if (statusEl) statusEl.textContent = '播放中...';

    var utter = new SpeechSynthesisUtterance(q.audio_script);
    utter.lang = 'en-US';
    if (GRADE === 'G1') utter.rate = 0.7;
    else if (GRADE === 'G2') utter.rate = 0.85;
    else utter.rate = 1.0;

    utter.onend = function() {
      if (statusEl) statusEl.textContent = '播放完畢';
      audioSynth = null;
    };
    utter.onerror = function() {
      if (statusEl) statusEl.textContent = '播放失敗';
      audioSynth = null;
    };

    audioSynth = utter;
    window.speechSynthesis.speak(utter);
  }

  function handleAnswer(index) {
    if (answered || currentIndex >= allQuestions.length) return;
    answered = true;

    var q = allQuestions[currentIndex];
    var options = q.options || [];
    var userAnswer = index;
    var userAnswerText = options[index] || '';
    var correctIndex = getCorrectIndex(q);
    var isCorrect = (index === correctIndex);
    var correctAnswerText = options[correctIndex] || q.answer || '';

    sessionAnswers.push({
      question: q,
      userAnswer: userAnswer,
      userAnswerText: userAnswerText,
      correctAnswer: correctIndex,
      correctAnswerText: correctAnswerText,
      isCorrect: isCorrect
    });

    if (!isCorrect) {
      try {
        GEPT.Storage.addWrongAnswer(GRADE, q._section, q, userAnswerText);
      } catch (e) {}
    }

    try {
      var stats = GEPT.Storage.getStats(GRADE, q._section);
      if (isCorrect) {
        GEPT.Storage.saveStats(GRADE, q._section, stats.correct + 1, stats.wrong);
      } else {
        GEPT.Storage.saveStats(GRADE, q._section, stats.correct, stats.wrong + 1);
      }
    } catch (e) {}

    highlightAnswerOptions(index, correctIndex, isCorrect);
    showAnswerFeedback(q, isCorrect, correctAnswerText);
  }

  function getCorrectIndex(q) {
    var ans = q.answer;
    if (!ans || !q.options) return -1;
    if (/^[A-D]$/.test(ans)) {
      return ans.charCodeAt(0) - 65;
    }
    var cleanAns = ans.replace(/^[A-D][.、．]\s*/, '');
    for (var i = 0; i < q.options.length; i++) {
      if (q.options[i] === ans || q.options[i] === cleanAns) return i;
    }
    return -1;
  }

  function highlightAnswerOptions(userIdx, correctIdx, isCorrect) {
    var btns = document.querySelectorAll('#mockexam-options .mockexam-option-btn');
    btns.forEach(function(btn) {
      btn.disabled = true;
    });
    if (correctIdx >= 0 && btns[correctIdx]) {
      btns[correctIdx].classList.add('option-correct');
    }
    if (!isCorrect && userIdx >= 0 && btns[userIdx] && userIdx !== correctIdx) {
      btns[userIdx].classList.add('option-wrong');
    }
  }

  function showAnswerFeedback(q, isCorrect, correctAnswer) {
    var fb = document.getElementById('mockexam-feedback');
    if (!fb) return;
    fb.classList.remove('hidden');
    fb.innerHTML =
      '<p class="feedback-result ' + (isCorrect ? 'correct' : 'incorrect') + '">' +
      (isCorrect ? '✅ 回答正確！' : '❌ 回答錯誤') +
      '</p>' +
      (!isCorrect ? '<p class="mockexam-correct-answer">正確答案：' + escHtml(correctAnswer) + '</p>' : '') +
      (q.explanation ? '<p class="feedback-explanation">' + escHtml(q.explanation) + '</p>' : '') +
      '<button class="btn" id="mockexam-next-btn">' +
      (currentIndex + 1 < totalQuestions ? '下一題 ▶' : '完成交卷 ✓') +
      '</button>';

    document.getElementById('mockexam-next-btn').addEventListener('click', function() {
      currentIndex++;
      if (currentIndex >= totalQuestions) {
        submitExam();
      } else {
        answered = false;
        showCurrentQuestion();
      }
    });
  }

  function startTimer() {
    stopTimer();
    timerInterval = setInterval(function() {
      timeRemaining--;
      updateTimerDisplay();
      if (timeRemaining <= 0) {
        submitExam();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (audioSynth) {
      window.speechSynthesis.cancel();
      audioSynth = null;
    }
  }

  function updateTimerDisplay() {
    var bar = document.getElementById('mockexam-timer-bar');
    var text = document.getElementById('mockexam-timer-text');
    if (!bar || !text) return;

    var pct = timeLimit > 0 ? (timeRemaining / timeLimit) * 100 : 0;
    bar.style.width = pct + '%';

    if (pct < 15) {
      bar.style.background = 'var(--error)';
    } else if (pct < 30) {
      bar.style.background = 'var(--warning)';
    } else {
      bar.style.background = 'var(--success)';
    }

    var mins = Math.floor(timeRemaining / 60);
    var secs = timeRemaining % 60;
    text.textContent = '剩餘時間 ' + mins + ':' + (secs < 10 ? '0' : '') + secs;
    if (pct < 15) {
      text.style.color = 'var(--error)';
    } else {
      text.style.color = 'var(--text)';
    }
  }

  function submitExam() {
    stopTimer();
    isExamStarted = false;

    var root = getRoot();

    if (currentIndex < allQuestions.length) {
      for (var i = currentIndex; i < allQuestions.length; i++) {
        sessionAnswers.push({
          question: allQuestions[i],
          userAnswer: -1,
          userAnswerText: '(未作答)',
          correctAnswer: getCorrectIndex(allQuestions[i]),
          correctAnswerText: '',
          isCorrect: false
        });
      }
    }

    renderResults();
  }

  function renderResults() {
    var root = getRoot();
    var totalCorrect = 0;
    var sectionStats = {};
    sectionOrder.forEach(function(s) {
      sectionStats[s] = { correct: 0, total: 0 };
    });

    sessionAnswers.forEach(function(a) {
      var s = a.question._section;
      if (!sectionStats[s]) sectionStats[s] = { correct: 0, total: 0 };
      sectionStats[s].total++;
      if (a.isCorrect) {
        totalCorrect++;
        sectionStats[s].correct++;
      }
    });

    var totalQ = sessionAnswers.length;
    var accuracy = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

    var usedTime = timeLimit - timeRemaining;
    var usedMin = Math.floor(usedTime / 60);
    var usedSec = usedTime % 60;

    var gradeLabel = GRADE === 'G1' ? '國一 G1' : GRADE === 'G2' ? '國二 G2' : '國三 G3';

    var html = '<div class="mockexam-result">';
    html += '<h2>📊 模擬考成績</h2>';
    html += '<p class="mockexam-result-grade">' + gradeLabel + ' | 用時 ' + usedMin + ' 分 ' + usedSec + ' 秒</p>';

    html += '<div class="mockexam-score-circle"><span class="mockexam-score-num">' + accuracy + '%</span><span class="mockexam-score-sub">' + totalCorrect + ' / ' + totalQ + ' 題正確</span></div>';

    html += '<div class="mockexam-breakdown"><h4>各題型分析</h4>';
    html += '<table class="mockexam-table"><thead><tr><th>題型</th><th>答對</th><th>總題</th><th>正確率</th></tr></thead><tbody>';

    sectionOrder.forEach(function(s) {
      var st = sectionStats[s];
      var acc = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
      var accClass = acc >= 80 ? 'me-acc-great' : acc >= 60 ? 'me-acc-ok' : 'me-acc-low';
      html += '<tr><td>' + SECTION_NAMES[s] + '</td><td>' + st.correct + '</td><td>' + st.total + '</td><td class="' + accClass + '">' + acc + '%</td></tr>';
    });

    html += '</tbody></table></div>';

    var wrongOnes = sessionAnswers.filter(function(a) { return !a.isCorrect; });
    if (wrongOnes.length > 0) {
      html += '<div class="mockexam-wrong-review"><h4>📝 錯題回顧 (' + wrongOnes.length + ' 題)</h4>';
      wrongOnes.forEach(function(a, idx) {
        var q = a.question;
        html += '<div class="mockexam-wrong-item"><div class="mockexam-wrong-header">';
        html += '<span class="mockexam-wrong-section">' + SECTION_NAMES[q._section] + '</span>';
        html += '<span class="mockexam-wrong-id">' + escHtml(q.id || '') + '</span>';
        html += '</div>';
        html += '<p class="mockexam-wrong-q">' + escHtml(q.question || '') + '</p>';
        if (q.passage) {
          html += '<p class="mockexam-wrong-passage">' + escHtml(q.passage.substring(0, 200)) + '</p>';
        }
        html += '<div class="mockexam-wrong-answers"><span class="me-wrong-label">你的答案：</span><span class="me-wrong">' + escHtml(a.userAnswerText) + '</span></div>';
        html += '<div class="mockexam-wrong-answers"><span class="me-correct-label">正確答案：</span><span class="me-correct">' + escHtml(a.correctAnswerText || (a.question.options && a.question.options[a.correctAnswer]) || '') + '</span></div>';
        if (q.explanation) {
          html += '<p class="mockexam-wrong-explanation">' + escHtml(q.explanation) + '</p>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    html += '<div class="mockexam-actions">';
    html += '<button class="btn" onclick="window.GEPT.MockExam.start()">🔄 重新測驗</button>';
    html += '<button class="btn btn-secondary" onclick="window.GEPT.MockExam._backToMenu()">↩ 返回主選單</button>';
    html += '</div>';

    root.innerHTML = html;
  }

  function _backToMenu() {
    stopTimer();
    isExamStarted = false;
    var root = getRoot();
    root.classList.add('hidden');
    var sm = document.getElementById('start-message');
    if (sm) sm.classList.remove('hidden');

    if (window.GEPT && window.GEPT.App && window.GEPT.App.onGradeChange) {
      document.querySelectorAll('.nav-btn').forEach(function(btn) {
        btn.classList.remove('active');
      });
    }
  }

  return {
    init: init,
    start: start,
    _playAudio: _playAudio,
    _backToMenu: _backToMenu
  };
})();
