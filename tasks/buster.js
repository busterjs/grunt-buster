module.exports = function (grunt) {
  var fs = require('fs'),
      path = require('path'),
      cmd = require('./buster/cmd'),
      growl = require('./buster/growl.js'),
      data,
      options;

  var getConfigSection = function (cmd) {
    return (data || {})[cmd] || {};
  };

  var getArguments = function (cmd) {
    var args = [];
    var config = getConfigSection(cmd);
    var serverPort = getConfigSection('server').port || 1111;

    if (cmd === 'phantomjs') {
      args.push(__dirname + '/buster/phantom.js');
      args.push('http://localhost:' + serverPort + '/capture');
      return args;
    }

    if (cmd === 'test') {
      args.push('--server', 'http://localhost:' + serverPort);
    }

    for (var arg in config) {
      var value = config[arg];
      if (value !== false) {
        args.push('--' + arg);
        if (value !== true) {
          args.push(value);
        }
      }
    }
    return args;
  };

  var shouldRunServer = function () {
    var configFile = getConfigSection('test').config;
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

    for (var config in configs) {
      if ((configs[config].environment || configs[config].env) === 'browser') {
        return true;
      }
    }
  };

  grunt.registerMultiTask('buster', 'Run Buster.JS tests.', function () {
    data = this.data;
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
      cmd.runBusterServer(grunt, getArguments('server')).then(
        function (server) {
          cmd.runPhantomjs(grunt, getArguments('phantomjs')).then(
            function (phantomjs) {
              cmd.runBusterTest(grunt, getArguments('test')).then(
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
      cmd.runBusterTest(grunt, getArguments('test')).then(
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
