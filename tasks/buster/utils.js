var when = require('when');

exports.sequence = function (tasks) {
  var deferred = when.defer();
  var results = [];
  var tasks_ = tasks.slice();

  (function nextTask() {
    var task, value;
    if (tasks_.length) {
      task = tasks_.shift();
      value = task instanceof Function ? task() : task;
      when(value, function (result) {
        results.push(result);
        nextTask();
      }, function (result) {
        results.push(result);
        deferred.reject(results);
      });
    } else {
      deferred.resolve(results);
    }
  }());

  return deferred.promise;
};
