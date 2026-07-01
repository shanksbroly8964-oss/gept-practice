window.GEPT = window.GEPT || {};
window.GEPT.App = (function() {
  var currentGrade = '';
  var currentSection = '';

  function init() {
    GEPT.UIRenderer.init();

    currentGrade = GEPT.Storage.getGrade();
    if (currentGrade) {
      startApp(currentGrade);
    } else {
      GEPT.UIRenderer.showGradePicker();
    }

    document.querySelectorAll('.grade-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var g = this.dataset.grade;
        GEPT.Storage.setGrade(g);
        startApp(g);
      });
    });

    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        GEPT.Listening.resetSession();
        GEPT.Speaking.resetSession();
        GEPT.MockExam.init(currentGrade);
        var section = this.dataset.section;
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
      });
    });

    GEPT.QuizEngine.onStatsUpdate(updateStatsDisplay);
  }

  function loadWriting() {
    currentSection = 'writing';
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.section === 'writing');
    });
    GEPT.Writing.showSubtypeSelection();
  }

  function loadSpeaking() {
    currentSection = 'speaking';
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.section === 'speaking');
    });
    GEPT.Speaking.showSubtypeSelection();
  }

  function startApp(grade) {
    currentGrade = grade;
    document.getElementById('section-nav').classList.remove('hidden');
    GEPT.UIRenderer.hideGradePicker();
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

  function loadListening() {
    currentSection = 'listening';
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.section === 'listening');
    });
    GEPT.Listening.showSubtypeSelection();
  }

  function loadWrongBook() {
    currentSection = 'wrongbook';
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.section === 'wrongbook');
    });
    GEPT.WrongBook.show();
  }

  function loadMockExam() {
    currentSection = 'mockexam';
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.section === 'mockexam');
    });
    GEPT.MockExam.start();
  }

  function loadProgress() {
    currentSection = 'progress';
    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.section === 'progress');
    });
    GEPT.Progress.show();
  }

  function loadSection(section) {
    currentSection = section;
    GEPT.UIRenderer.resetQuestionUI();

    document.querySelectorAll('.nav-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.section === section);
    });

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
    currentGrade = grade;
    GEPT.QuizEngine.init(grade);
    GEPT.Listening.init(grade);
    GEPT.Writing.init(grade);
    GEPT.Speaking.init(grade);
    GEPT.MockExam.init(grade);
    GEPT.Progress.init(grade);
    GEPT.UIRenderer.updateGradeDisplay(grade);
    GEPT.UIRenderer.showStartMessage();
    GEPT.UIRenderer.resetQuestionUI();
    updateStatsDisplay();
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    onGradeChange: onGradeChange,
    onAnswer: onAnswer,
    onNextQuestion: onNextQuestion,
    onRestartSection: onRestartSection
  };
})();
