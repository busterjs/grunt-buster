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

    var runServer = config.shouldRunServer(configData);
    var runPhantomjs = config.shouldRunPhantomjs(configData);

    if (this.args.indexOf('test') !== -1) {
      runServer = false;
      runPhantomjs = false;
    }

    var done = this.async();
    var stop = function (success, results) {
      var server = results[0];
      var phantomjs = results[1];
      cmd.stop(server, phantomjs);
      done(success);
    };

    sequence([
      function () {
        if (runServer) {
          return cmd.runBusterServer(config.getArguments('server', configData));
        }
        return null;
      },
      function () {
        if (runPhantomjs) {
          return cmd.runPhantomjs(config.getArguments('phantomjs', configData));
        }
        return null;
      },
      function () {
        return cmd.runBusterTest(config.getArguments('test', configData));
      }
    ]).then(function (results) {
      stop(null, results);
    }, function (results) {
      stop(false, results);
    });
  });
};
