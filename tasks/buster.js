module.exports = function (grunt) {
  var sequence = require('when/sequence'),
      cmd = require('./buster/cmd'),
      config = require('./buster/config'),
      growl = require('./buster/growl.js'),
      options;

  grunt.registerMultiTask('buster', 'Run Buster.JS tests.', function () {
    var configData = this.data;
    options = this.options({
      growl: false
    });

    if (options.growl) {
      growl.init(grunt);
    }

    var done = this.async();
    var stop = function (success, results) {
      var server = results[0];
      var phantomjs = results[1];
      cmd.stop(grunt, server, phantomjs);
      done(success);
    };

    sequence([
      function () {
        if (config.shouldRunServer(configData)) {
          return cmd.runBusterServer(grunt, config.getArguments('server', configData));
        }
        return null;
      },
      function () {
        if (config.shouldRunPhantomjs(configData)) {
          return cmd.runPhantomjs(grunt, config.getArguments('phantomjs', configData));
        }
        return null;
      },
      function () {
        return cmd.runBusterTest(grunt, config.getArguments('test', configData));
      }
    ]).then(function (results) {
      stop(null, results);
    }, function (results) {
      stop(false, results);
    });
  });
};
