window.GEPT = window.GEPT || {};
window.GEPT.DataLoader = (function() {
  var BASE = 'data/';
  var cache = {};

  function fetchQuestions(section, grade) {
    var key = section + '_' + grade;
    if (cache[key]) {
      return Promise.resolve(cache[key]);
    }
    var url = BASE + section + '_' + grade + '.json';
    return fetch(url)
      .then(function(response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function(data) {
        cache[key] = data;
        return data;
      });
  }

  function clearCache() {
    cache = {};
  }

  return {
    fetchQuestions: fetchQuestions,
    clearCache: clearCache
  };
})();
