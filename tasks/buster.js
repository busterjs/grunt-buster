module.exports = function (grunt) {
  var sequence = require('./buster/utils').sequence,
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
      block = this.args.indexOf('block') !== -1;
      runServer = this.args.indexOf('server') !== -1;
      runPhantomjs = this.args.indexOf('phantomjs') !== -1;
      keepalive = runServer || runPhantomjs;
      runTests = this.args.indexOf('test') !== -1;
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
        return runServer ?
          cmd.runBusterServer(config.getArguments('server', configData)) :
          null;
      },
      function () {
        return runPhantomjs ?
          cmd.runPhantomjs(config.getArguments('phantomjs', configData)) :
          null;
      },
      function () {
        return runTests ?
          cmd.runBusterTest(config.getArguments('test', configData)) :
          null;
      }
    ]).then(function (results) {
      stop(null, results);
    }, function (results) {
      stop(false, results);
    });
  });
};
