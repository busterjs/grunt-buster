module.exports = function (grunt) {
  var cmd = require('./buster/cmd'),
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
    var stop = function (success, server, phantomjs) {
      cmd.stop(grunt, done.bind(null, success), server, phantomjs);
    };

    if (config.shouldRunServer(configData)) {
      cmd.runBusterServer(grunt, config.getArguments('server', configData)).then(
        function (server) {
          cmd.runPhantomjs(grunt, config.getArguments('phantomjs', configData)).then(
            function (phantomjs) {
              cmd.runBusterTest(grunt, config.getArguments('test', configData)).then(
                function () {
                  stop(null, server, phantomjs);
                },
                function () {
                  stop(false, server, phantomjs);
                }
              );
            },
            function (phantomjs) {
              stop(false, server, phantomjs);
            }
          );
        },
        function (server) {
          stop(false, server);
        }
      );
    } else {
      cmd.runBusterTest(grunt, config.getArguments('test', configData)).then(
        function () {
          done(null);
        },
        function () {
          done(false);
        }
      );
    }
  });
};
