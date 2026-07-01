window.GEPT = window.GEPT || {};
window.GEPT.Speaking = (function() {
  var SUBTYPE_INFO = {
    readaloud: { name: '朗讀', icon: '📢', desc: '跟著示範朗讀英文短文' },
    qa: { name: '回答問題', icon: '💬', desc: '聽問題後用英文口頭回答' }
  };

  var currentGrade = '';
  var currentSubtype = '';
  var questions = [];
  var currentIndex = 0;
  var speechSynth = window.speechSynthesis;
  var isSpeaking = false;
  var mediaRecorder = null;
  var recordedChunks = [];
  var isRecording = false;
  var audioBlob = null;
  var audioUrl = null;
  var stream = null;

  function init(grade) {
    currentGrade = grade;
    resetSession();
  }

  function resetSession() {
    questions = [];
    currentIndex = 0;
    currentSubtype = '';
    cleanupRecorder();
    stopSpeaking();
  }

  function cleanupRecorder() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.stop(); } catch(e) {}
    }
    mediaRecorder = null;
    recordedChunks = [];
    isRecording = false;
    if (audioUrl) { URL.revokeObjectURL(audioUrl); audioUrl = null; }
    audioBlob = null;
    if (stream) {
      stream.getTracks().forEach(function(t) { t.stop(); });
      stream = null;
    }
  }

  function showSubtypeSelection() {
    stopSpeaking();
    cleanupRecorder();
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('speaking-container');
    container.classList.remove('hidden');

    var html = '<div class="subtype-selection">';
    html += '<h2 class="subtype-title">口說測驗</h2>';
    html += '<p class="subtype-hint">選擇題型開始口說練習</p>';
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
    cleanupRecorder();

    GEPT.UIRenderer.showLoading();

    var dataKey = 'speaking_' + subtype;
    GEPT.DataLoader.fetchQuestions(dataKey, currentGrade)
      .then(function(data) {
        questions = shuffle(data);
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
    var container = document.getElementById('speaking-container');
    container.classList.remove('hidden');
    var info = SUBTYPE_INFO[subtype] || { name: subtype };
    container.innerHTML =
      '<div class="state-message">' +
        '<p>「' + info.name + '」題庫準備中</p>' +
        '<p class="error-hint">請稍後再試，或選擇其他題型</p>' +
        '<button id="back-speaking-subtype-btn" class="btn" style="margin-top:1rem">返回口說選單</button>' +
      '</div>';
    document.getElementById('back-speaking-subtype-btn').addEventListener('click', function() {
      showSubtypeSelection();
    });
  }

  function showQuestion() {
    cleanupRecorder();

    if (currentIndex >= questions.length) {
      showComplete();
      return;
    }

    var q = questions[currentIndex];
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('speaking-container');
    container.classList.remove('hidden');

    if (q.type === 'qa') {
      renderQA(q);
    } else {
      renderReadAloud(q);
    }
  }

  function renderReadAloud(q) {
    var progress = (currentIndex + 1) + ' / ' + questions.length;
    var html = buildHeader(q, progress);

    html += '<div class="speaking-subtype-label">📢 朗讀練習</div>';

    html += '<div class="speaking-text">' + escHtml(q.text) + '</div>';

    html += '<div class="speaking-controls">';
    html += '<button id="speaking-demo-btn" class="btn btn-secondary btn-small">🔊 聽示範</button>';
    html += '<span id="speaking-demo-status" class="speaking-demo-status"></span>';
    html += '</div>';

    html += '<div class="speaking-recording-controls" id="speaking-recording-area">';
    html += '<button id="speaking-record-btn" class="recording-btn recording-btn-start">🎤 錄音</button>';
    html += '<button id="speaking-playback-btn" class="recording-btn recording-btn-play hidden">▶ 播放錄音</button>';
    html += '<span id="speaking-recording-status" class="recording-status">準備錄音</span>';
    html += '</div>';

    html += '<div id="speaking-error-area" class="speaking-error hidden"></div>';

    if ((q.tips && q.tips.length > 0) || q.explanation) {
      html += '<div class="speaking-tips">';
      if (q.tips && q.tips.length > 0) {
        html += '<h4>💡 小提示</h4><ul class="checkpoint-list">';
        q.tips.forEach(function(tip) { html += '<li class="checkpoint-item">' + escHtml(tip) + '</li>'; });
        html += '</ul>';
      }
      if (q.explanation) { html += '<h4 style="margin-top:0.75rem">📖 說明</h4><p>' + escHtml(q.explanation) + '</p>'; }
      html += '</div>';
    }

    html += buildNav();
    container.innerHTML = html;
    bindSpeakingEvents(q, 'readaloud');
    bindNavEvents();
  }

  function renderQA(q) {
    var progress = (currentIndex + 1) + ' / ' + questions.length;
    var html = buildHeader(q, progress);

    html += '<div class="speaking-subtype-label">💬 回答問題</div>';

    html += '<div class="speaking-controls">';
    html += '<button id="speaking-demo-btn" class="btn btn-secondary btn-small">🔊 播放題目</button>';
    html += '<span id="speaking-demo-status" class="speaking-demo-status"></span>';
    html += '</div>';

    html += '<div class="writing-prompt">' + escHtml(q.question) + '</div>';

    html += '<div class="speaking-recording-controls" id="speaking-recording-area">';
    html += '<button id="speaking-record-btn" class="recording-btn recording-btn-start">🎤 錄音作答</button>';
    html += '<button id="speaking-playback-btn" class="recording-btn recording-btn-play hidden">▶ 播放錄音</button>';
    html += '<span id="speaking-recording-status" class="recording-status">準備錄音</span>';
    html += '</div>';

    html += '<div id="speaking-error-area" class="speaking-error hidden"></div>';

    html += '<div id="speaking-qa-answer-area" class="hidden">';
    html += '<button id="speaking-show-answer-btn" class="btn btn-secondary btn-small">看參考答案</button>';
    html += '<div id="speaking-sample-area" class="speaking-sample hidden">';
    html += '<div class="sample-answer-box">';
    html += '<h4>📝 參考答案</h4>';
    html += '<p class="sample-answer-text">' + escHtml(q.sample_answer || '') + '</p>';
    html += '</div>';
    if (q.tips && q.tips.length > 0) {
      html += '<div class="speaking-tips" style="margin-top:0.5rem">';
      html += '<h4>💡 小提示</h4><ul class="checkpoint-list">';
      q.tips.forEach(function(tip) { html += '<li class="checkpoint-item">' + escHtml(tip) + '</li>'; });
      html += '</ul>';
      html += '</div>';
    }
    if (q.explanation) {
      html += '<div style="margin-top:0.5rem">';
      html += '<h4>📖 說明</h4><p>' + escHtml(q.explanation) + '</p>';
      html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    html += buildNav();
    container.innerHTML = html;
    bindSpeakingEvents(q, 'qa');
    bindNavEvents();

    document.getElementById('speaking-show-answer-btn').addEventListener('click', function() {
      var area = document.getElementById('speaking-sample-area');
      area.classList.toggle('hidden');
      this.textContent = area.classList.contains('hidden') ? '看參考答案' : '隱藏參考答案';
    });
  }

  function buildHeader(q, progress) {
    var html = '<div class="speaking-question">';
    html += '<div class="listening-header">';
    html += '<span class="question-progress">第 ' + progress + ' 題</span>';
    html += '<span class="question-id">' + escHtml(q.id) + '</span>';
    html += '</div>';
    return html;
  }

  function buildNav() {
    var html = '<div class="speaking-nav">';
    if (currentIndex > 0) {
      html += '<button id="speaking-prev-btn" class="btn btn-secondary btn-small">上一題</button>';
    }
    if (currentIndex < questions.length - 1) {
      html += '<button id="speaking-next-btn" class="btn btn-small">下一題</button>';
    } else {
      html += '<button id="speaking-finish-btn" class="btn btn-small">完成測驗</button>';
    }
    html += '</div>';
    html += '</div>';
    return html;
  }

  function bindSpeakingEvents(q, type) {
    document.getElementById('speaking-demo-btn').addEventListener('click', function() {
      if (isSpeaking) {
        stopSpeaking();
      } else {
        var textToRead = type === 'qa' ? (q.audio_script || q.question) : q.text;
        playDemo(textToRead);
      }
    });

    document.getElementById('speaking-record-btn').addEventListener('click', function() {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    });
  }

  function bindNavEvents() {
    var prevBtn = document.getElementById('speaking-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        currentIndex--;
        showQuestion();
      });
    }

    var nextBtn = document.getElementById('speaking-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        currentIndex++;
        showQuestion();
      });
    }

    var finishBtn = document.getElementById('speaking-finish-btn');
    if (finishBtn) {
      finishBtn.addEventListener('click', function() {
        showComplete();
      });
    }
  }

  function playDemo(text) {
    if (!text || !speechSynth) {
      updateDemoStatus('瀏覽器不支援語音功能');
      return;
    }

    stopSpeaking();

    var statusEl = document.getElementById('speaking-demo-status');
    var playBtn = document.getElementById('speaking-demo-btn');
    if (statusEl) statusEl.textContent = '播放中...';
    if (playBtn) playBtn.textContent = '⏹ 停止';

    isSpeaking = true;

    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    if (currentGrade === 'G1') {
      utterance.rate = 0.7;
    } else if (currentGrade === 'G2') {
      utterance.rate = 0.85;
    } else {
      utterance.rate = 1.0;
    }

    utterance.onend = function() {
      isSpeaking = false;
      if (statusEl) statusEl.textContent = '播放完成';
      if (playBtn) playBtn.textContent = '🔊 重播';
    };

    utterance.onerror = function() {
      isSpeaking = false;
      if (statusEl) statusEl.textContent = '播放失敗';
      if (playBtn) playBtn.textContent = '🔊 聽示範';
    };

    speechSynth.speak(utterance);
  }

  function stopSpeaking() {
    isSpeaking = false;
    if (speechSynth) {
      speechSynth.cancel();
    }
    var statusEl = document.getElementById('speaking-demo-status');
    if (statusEl) statusEl.textContent = '';
    var playBtn = document.getElementById('speaking-demo-btn');
    if (playBtn) {
      var type = currentSubtype === 'qa' ? '播放題目' : '聽示範';
      playBtn.textContent = '🔊 ' + type;
    }
  }

  function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showRecordingError('瀏覽器不支援錄音功能，請使用 Chrome 或 Edge 最新版本。');
      return;
    }

    if (!window.MediaRecorder) {
      showRecordingError('瀏覽器不支援 MediaRecorder，請使用 Chrome 或 Edge 最新版本。');
      return;
    }

    recordedChunks = [];
    hideRecordingError();

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(function(s) {
        stream = s;

        var mimeType = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }

        mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });
        isRecording = true;
        updateRecordingUI(true);

        mediaRecorder.ondataavailable = function(e) {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };

        mediaRecorder.onstop = function() {
          isRecording = false;
          updateRecordingUI(false);
          if (recordedChunks.length > 0) {
            audioBlob = new Blob(recordedChunks, { type: mimeType });
            enablePlayback();

            if (currentSubtype === 'qa') {
              document.getElementById('speaking-qa-answer-area').classList.remove('hidden');
            }
          }
        };

        mediaRecorder.onerror = function() {
          isRecording = false;
          updateRecordingUI(false);
          showRecordingError('錄音過程中發生錯誤，請重試。');
        };

        mediaRecorder.start(100);
      })
      .catch(function(err) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          showRecordingError('麥克風權限被拒，請允許瀏覽器使用麥克風後重試。');
        } else if (err.name === 'NotFoundError') {
          showRecordingError('找不到麥克風裝置，請確認已連接麥克風。');
        } else {
          showRecordingError('無法存取麥克風：' + (err.message || '未知錯誤'));
        }
      });
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    if (stream) {
      stream.getTracks().forEach(function(t) { t.stop(); });
      stream = null;
    }
  }

  function enablePlayback() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    audioUrl = URL.createObjectURL(audioBlob);

    var playbackBtn = document.getElementById('speaking-playback-btn');
    playbackBtn.classList.remove('hidden');

    playbackBtn.onclick = function() {
      var audio = document.getElementById('speaking-audio-player');
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'speaking-audio-player';
        document.getElementById('speaking-recording-area').appendChild(audio);
      }
      audio.src = audioUrl;
      audio.play();
    };
  }

  function updateRecordingUI(recording) {
    var recordBtn = document.getElementById('speaking-record-btn');
    var statusEl = document.getElementById('speaking-recording-status');

    if (recording) {
      recordBtn.textContent = '⏹ 停止錄音';
      recordBtn.className = 'recording-btn recording-btn-stop';
      if (statusEl) {
        statusEl.textContent = '🔴 錄音中...';
        statusEl.className = 'recording-status recording-active';
      }
    } else {
      recordBtn.textContent = '🎤 錄音';
      recordBtn.className = 'recording-btn recording-btn-start';
      if (statusEl) {
        statusEl.textContent = '錄音完成';
        statusEl.className = 'recording-status';
      }
    }
  }

  function showRecordingError(msg) {
    var el = document.getElementById('speaking-error-area');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  function hideRecordingError() {
    var el = document.getElementById('speaking-error-area');
    if (el) {
      el.classList.add('hidden');
    }
  }

  function updateDemoStatus(msg) {
    var el = document.getElementById('speaking-demo-status');
    if (el) el.textContent = msg;
  }

  function showComplete() {
    cleanupRecorder();
    stopSpeaking();
    GEPT.UIRenderer.hideAllMain();
    var container = document.getElementById('speaking-container');
    container.classList.remove('hidden');
    container.innerHTML =
      '<div class="quiz-complete">' +
        '<h2>口說練習完成！</h2>' +
        '<p>你已完成所有題目，持續練習口說會越來越流利！</p>' +
        '<button id="speaking-restart-btn" class="btn">再做一次</button>' +
        '<button id="speaking-back-btn" class="btn btn-secondary" style="margin-top:0.5rem">返回口說選單</button>' +
      '</div>';

    document.getElementById('speaking-restart-btn').addEventListener('click', function() {
      loadSubtype(currentSubtype);
    });
    document.getElementById('speaking-back-btn').addEventListener('click', function() {
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
