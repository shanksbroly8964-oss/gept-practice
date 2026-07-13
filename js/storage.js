window.GEPT = window.GEPT || {};
window.GEPT.Storage = (function() {
  var KEYS = {
    GRADE: 'gept_grade',
    STATS: 'gept_stats',
    WRONG: 'gept_wrong',
    PROGRESS: 'gept_progress'
  };

  function getPrefix() {
    if (window.GeptAuth && typeof window.GeptAuth.getStoragePrefix === 'function') {
      return window.GeptAuth.getStoragePrefix();
    }
    return '';
  }

  function pk(key) {
    return getPrefix() + key;
  }

  function getGrade() {
    return localStorage.getItem(pk(KEYS.GRADE)) || null;
  }

  function setGrade(grade) {
    localStorage.setItem(pk(KEYS.GRADE), grade);
  }

  function getStats(grade, section) {
    try {
      var all = JSON.parse(localStorage.getItem(pk(KEYS.STATS))) || {};
      if (all[grade] && all[grade][section]) return all[grade][section];
      return { correct: 0, wrong: 0 };
    } catch (e) {
      return { correct: 0, wrong: 0 };
    }
  }

  function saveStats(grade, section, correct, wrong) {
    try {
      var all = JSON.parse(localStorage.getItem(pk(KEYS.STATS))) || {};
      if (!all[grade]) all[grade] = {};
      all[grade][section] = { correct: correct, wrong: wrong };
      localStorage.setItem(pk(KEYS.STATS), JSON.stringify(all));
      trySyncProgress();
    } catch (e) {
      console.error('saveStats error:', e);
    }
  }

  function getWrongAnswers(grade, section) {
    try {
      var all = JSON.parse(localStorage.getItem(pk(KEYS.WRONG))) || {};
      if (all[grade] && all[grade][section]) return all[grade][section];
      return [];
    } catch (e) {
      return [];
    }
  }

  function addWrongAnswer(grade, section, question, userAnswer) {
    try {
      var all = JSON.parse(localStorage.getItem(pk(KEYS.WRONG))) || {};
      if (!all[grade]) all[grade] = {};
      if (!all[grade][section]) all[grade][section] = [];
      all[grade][section].push({
        question: JSON.parse(JSON.stringify(question)),
        userAnswer: userAnswer,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(pk(KEYS.WRONG), JSON.stringify(all));
      trySyncProgress();
    } catch (e) {
      console.error('addWrongAnswer error:', e);
    }
  }

  function getAllWrongAnswers() {
    try {
      var all = JSON.parse(localStorage.getItem(pk(KEYS.WRONG))) || {};
      var result = [];
      Object.keys(all).forEach(function(grade) {
        Object.keys(all[grade]).forEach(function(section) {
          all[grade][section].forEach(function(item, idx) {
            result.push({
              grade: grade,
              section: section,
              index: idx,
              question: item.question,
              userAnswer: item.userAnswer,
              timestamp: item.timestamp
            });
          });
        });
      });
      return result;
    } catch (e) {
      return [];
    }
  }

  function removeWrongAnswer(grade, section, index) {
    try {
      var all = JSON.parse(localStorage.getItem(pk(KEYS.WRONG))) || {};
      if (!all[grade] || !all[grade][section]) return;
      all[grade][section].splice(index, 1);
      if (all[grade][section].length === 0) delete all[grade][section];
      if (Object.keys(all[grade]).length === 0) delete all[grade];
      localStorage.setItem(pk(KEYS.WRONG), JSON.stringify(all));
      trySyncProgress();
    } catch (e) {
      console.error('removeWrongAnswer error:', e);
    }
  }

  function clearWrongAnswers() {
    localStorage.removeItem(pk(KEYS.WRONG));
    trySyncProgress();
  }

  function getProgress() {
    try {
      return JSON.parse(localStorage.getItem(pk(KEYS.PROGRESS))) || {};
    } catch (e) {
      return {};
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(pk(KEYS.PROGRESS), JSON.stringify(data));
      trySyncProgress();
    } catch (e) {
      console.error('saveProgress error:', e);
    }
  }

  var syncTimer = null;
  function trySyncProgress() {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function() {
      if (window.GeptAuth && typeof window.GeptAuth.syncProgress === 'function') {
        window.GeptAuth.syncProgress();
      }
    }, 1000);
  }

  return {
    getGrade: getGrade,
    setGrade: setGrade,
    getStats: getStats,
    saveStats: saveStats,
    getWrongAnswers: getWrongAnswers,
    addWrongAnswer: addWrongAnswer,
    getAllWrongAnswers: getAllWrongAnswers,
    removeWrongAnswer: removeWrongAnswer,
    clearWrongAnswers: clearWrongAnswers,
    getProgress: getProgress,
    saveProgress: saveProgress
  };
})();
