module.exports = function (grunt) {
  var fs = require('fs'),
      path = require('path'),
      cmd = require('./buster/cmd'),
      config = require('./buster/config'),
      growl = require('./buster/growl.js'),
      options;

  var shouldRunServer = function (configData) {
    var configFile = config.getConfigSection('test', configData).config;
    if (!configFile) {
      grunt.verbose.writeln(
          'No buster configuration specified. Looking in known locations...');

      if (fs.existsSync('buster.js')) {
        configFile = 'buster.js';
        grunt.verbose.writeln('Found ./buster.js');
      } else if (fs.existsSync('test/buster.js')) {
        configFile = 'test/buster.js';
        grunt.verbose.writeln('Found ./test/buster.js');
      } else if (fs.existsSync('spec/buster.js')) {
        configFile = 'spec/buster.js';
        grunt.verbose.writeln('Found ./spec/buster.js');
      }
    }
    var configs = require(path.join(process.cwd(), configFile));

    for (var key in configs) {
      if ((configs[key].environment || configs[key].env) === 'browser') {
        return true;
      }
    }
  };

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
      if (server) {
        server.kill();
        grunt.verbose.writeln('buster-server stopped');
      }
      if (phantomjs) {
        phantomjs.kill();
        grunt.verbose.writeln('phantomjs stopped');
      }
      done(success);
    };

    if (shouldRunServer()) {
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
