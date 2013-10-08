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

    var block = false;
    var keepalive = false;
    var runServer = config.shouldRunServer(configData);
    var runPhantomjs = config.shouldRunPhantomjs(configData);
    var runTests = true;

    if (this.args.length) {
      runServer = false;
      runPhantomjs = false;
      runTests = false;
    }

    if (this.args.indexOf('server') !== -1) {
      keepalive = true;
      runServer = true;
    }

    if (this.args.indexOf('phantomjs') !== -1) {
      keepalive = true;
      runPhantomjs = true;
    }

    if (this.args.indexOf('test') !== -1) {
      runTests = true;
    }

    if (this.args.indexOf('block') !== -1) {
      block = true;
    }

    var done = this.async();
    var stop = function (success, results) {
      var server = results[0];
      var phantomjs = results[1];

      if (keepalive) {
        cmd.stopOnExit(server, phantomjs);
      } else {
        cmd.stop(server, phantomjs);
      }

      if (!block) {
        done(success);
      }
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
        if (runTests) {
          return cmd.runBusterTest(config.getArguments('test', configData));
        }
        return null;
      }
    ]).then(function (results) {
      stop(null, results);
    }, function (results) {
      stop(false, results);
    });
  });
};
