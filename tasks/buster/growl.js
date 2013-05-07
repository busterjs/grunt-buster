var when = require('when');

module.exports = {
  init: function () {
    try {
      return when.resolve(require('growl'));
    } catch (e) {
      return when.reject(
        'Growl not found; run `npm install growl` for Growl support');
    }
  },

  passed: function (text) {
    var deferred = when.defer();
    module.exports.init().then(function (growl) {
      growl(text, {
        title: 'Tests Passed',
        image: __dirname + '/ok.png'
      });
      deferred.resolve();
    }, function (error) {
      deferred.reject(error);
    });
    return deferred.promise;
  },

  failed: function (text) {
    var deferred = when.defer();
    module.exports.init().then(function (growl) {
      growl(text, {
        title: 'Tests Failed',
        image: __dirname + '/error.png'
      });
      deferred.resolve();
    }, function (error) {
      deferred.reject(error); 
    });
    return deferred.promise;
  }
};
