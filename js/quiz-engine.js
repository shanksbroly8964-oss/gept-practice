window.GEPT = window.GEPT || {};
window.GEPT.QuizEngine = (function() {
  var MAX_QUESTIONS = 10;

  var questions = [];
  var currentIndex = 0;
  var answered = false;
  var sessionCorrect = 0;
  var sessionWrong = 0;
  var currentGrade = '';
  var currentSection = '';
  var statsCb = null;

  function init(grade) {
    currentGrade = grade;
    questions = [];
    currentIndex = 0;
    answered = false;
    sessionCorrect = 0;
    sessionWrong = 0;
    currentSection = '';
  }

  function loadSection(section) {
    currentSection = section;
    currentIndex = 0;
    answered = false;
    sessionCorrect = 0;
    sessionWrong = 0;
    questions = [];

    return GEPT.DataLoader.fetchQuestions(section, currentGrade)
      .then(function(data) {
        questions = shuffle(data).slice(0, MAX_QUESTIONS);
        return { success: true, total: questions.length };
      })
      .catch(function() {
        questions = [];
        return { success: false };
      });
  }

  function getCurrentQuestion() {
    if (currentIndex >= questions.length) return null;
    return questions[currentIndex];
  }

  function getProgress() {
    return { current: currentIndex + 1, total: questions.length };
  }

  function getCorrectLetter(q) {
    var letters = ['A', 'B', 'C', 'D'];
    if (q.answer.length === 1 && letters.indexOf(q.answer) !== -1) {
      return q.answer;
    }
    var idx = q.options.indexOf(q.answer);
    return idx !== -1 ? letters[idx] : '';
  }

  function selectAnswer(answerIndex) {
    if (answered) return null;
    if (currentIndex >= questions.length) return null;

    var q = questions[currentIndex];
    var letters = ['A', 'B', 'C', 'D'];
    var userAnswer = letters[answerIndex] || '';
    var correctLetter = getCorrectLetter(q);
    var isCorrect = userAnswer === correctLetter;

    answered = true;

    if (isCorrect) {
      sessionCorrect++;
    } else {
      sessionWrong++;
      GEPT.Storage.addWrongAnswer(currentGrade, currentSection, q, userAnswer);
    }

    var stats = GEPT.Storage.getStats(currentGrade, currentSection);
    GEPT.Storage.saveStats(currentGrade, currentSection,
      stats.correct + (isCorrect ? 1 : 0),
      stats.wrong + (isCorrect ? 0 : 1)
    );

    if (statsCb) statsCb();

    return {
      isCorrect: isCorrect,
      correctAnswer: correctLetter,
      userAnswer: userAnswer,
      explanation: q.explanation
    };
  }

  function nextQuestion() {
    if (currentIndex < questions.length - 1) {
      currentIndex++;
      answered = false;
      return {
        hasNext: true,
        question: getCurrentQuestion(),
        progress: getProgress()
      };
    }
    return {
      hasNext: false,
      isComplete: true,
      stats: getSessionStats()
    };
  }

  function getSessionStats() {
    var total = sessionCorrect + sessionWrong;
    return {
      correct: sessionCorrect,
      wrong: sessionWrong,
      total: total,
      accuracy: total > 0 ? Math.round((sessionCorrect / total) * 100) : 0
    };
  }

  function onStatsUpdate(cb) {
    statsCb = cb;
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

  function loadCustomQuestions(qs) {
    currentSection = '';
    currentIndex = 0;
    answered = false;
    sessionCorrect = 0;
    sessionWrong = 0;
    questions = qs.slice();
    return { success: true, total: questions.length };
  }

  return {
    init: init,
    loadSection: loadSection,
    loadCustomQuestions: loadCustomQuestions,
    getCurrentQuestion: getCurrentQuestion,
    getProgress: getProgress,
    selectAnswer: selectAnswer,
    nextQuestion: nextQuestion,
    getSessionStats: getSessionStats,
    onStatsUpdate: onStatsUpdate
  };
})();
