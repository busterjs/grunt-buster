module.exports = function (grunt) {
  var fs = require('fs'),
      path = require('path'),
      when = require('when'),
      cmd = require('./buster/cmd'),
      growl = require('./buster/growl.js'),
      data,
      options;

  var getConfigSection = function (cmd) {
    return (data || {})[cmd] || {};
  };

  var getArguments = function (cmd) {
    var port, url;

    if (cmd === 'phantomjs') {
      port = getConfigSection('server').port || 1111;
      url = 'http://localhost:' + port + '/capture';
      return [__dirname + '/buster/phantom.js', url];
    }

    var args = [],
        config = getConfigSection(cmd);

    if (cmd === 'test') {
      port = getConfigSection('server').port || 1111;
      args.push('--server', 'http://localhost:' + port + '/capture');
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

  var busterNotFound = function () {
    grunt.log.error(
      'Buster.JS not found. Run `npm install buster` to install.');
  };

  var runBusterServer = function () {
    var deferred = when.defer();

    cmd.run('buster-server', getArguments('server'), function (error, server) {
      if (error) {
        busterNotFound();
        deferred.reject();
      } else {
        server.stdout.once('data', function () {
          deferred.resolve(server);
        });

        server.stderr.once('data', function () {
          deferred.reject(server);
        });

        server.stdout.on('data', function (data) {
          grunt.log.write(data);
        });

        server.stderr.on('data', function (data) {
          grunt.log.error(data);
        });
      }

      return deferred;
    });

    return deferred.promise;
  };

  var runBusterTest = function () {
    var deferred = when.defer();

    cmd.run('buster-test', getArguments('test'), function (error, run) {
      if (error) {
        busterNotFound();
        deferred.reject();
      } else {
        var output = [];

        run.stdout.on('data', function (data) {
          output.push(data);
          process.stdout.write(data);
        });

        run.stderr.on('data', function (data) {
          process.stderr.write(data);
        });

        run.on('exit', function (code) {
          var text = '';
          if (output[output.length - 2]) {
            text = output[output.length - 2].toString().split(', ').join('\n') +
              output[output.length - 1];
          }
          text = text.replace(/\u001b\[.*m/g, '').trim();
          if (code === 0) {
            grunt.event.emit('buster:success', text);
            deferred.resolve();
          } else {
            grunt.event.emit('buster:failure', text);
            deferred.reject();
          }
        });
      }
    });

    return deferred.promise;
  };

  var runPhantomjs = function () {
    var deferred = when.defer();

    cmd.run('phantomjs', getArguments('phantomjs'), function (error, server) {
      if (error) {
        grunt.log.error(
          'PhantomJS not found. Run `npm install phantomjs` to install.');
        deferred.reject();
      } else {
        server.stdout.on('data', function (data) {
          grunt.verbose.writeln(data);
        });

        server.stderr.on('data', function (data) {
          grunt.verbose.writeln(data);
        });

        server.stdout.once('data', function () {
          deferred.resolve(server);
        });
      }
    });

    return deferred.promise;
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
      runBusterServer().then(
        function (server) {
          runPhantomjs().then(
            function (phantomjs) {
              runBusterTest().then(
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
      runBusterTest().then(
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
