var success = function (growl, text) {
  growl(text, {
    title: 'Tests Passed',
    image: __dirname + '/ok.png'
  });
};

var failure = function (growl, text) {
  growl(text, {
    title: 'Tests Failed',
    image: __dirname + '/error.png'
  });
};

module.exports = {
  init: function (grunt) {
    var growl = module.exports.requireGrowl();

    if (!growl) {
      grunt.log.error(
        'Growl not found; run `npm install growl` for Growl support');
      return;
    }

    grunt.event.on('buster:success', success.bind(this, growl));
    grunt.event.on('buster:failure', failure.bind(this, growl));
  },

  requireGrowl: function () {
    try {
      return require('growl');
    } catch (e) {
    }
  }
};
