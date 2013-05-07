module.exports = function(grunt) {
  var childProcess = require('child_process'),
      fs = require('fs'),
      path = require('path'),
      when = require('when'),
      growl = require('./buster/growl.js');

  var getConfigSection = function(cmd){
    return (grunt.config('buster') || {})[cmd] || {};
  };

  var getArguments = function(cmd) {
    if(cmd === 'phantomjs'){
      var port = getConfigSection('server').port || 1111,
          url = 'http://localhost:' + port + '/capture';
      return [__dirname + '/buster/phantom.js', url];
    }

    var args = [],
        config = getConfigSection(cmd);

    for(var arg in config){
      var value = config[arg];
      if(value !== false) {
        args.push('--' + arg);
        if(value !== true){
          args.push(value);
        }
      }
    }
    return args;
  };

  var shouldRunServer = function(){
    var configFile = getConfigSection('test').config;
    if(!configFile){
      grunt.verbose.writeln('No buster configuration specified. Looking for buster.js...');

      if(fs.existsSync('buster.js')) {
        configFile = 'buster.js';
        grunt.verbose.writeln('Found buster.js');
      } else if(fs.existsSync('test/buster.js')) {
        configFile = 'test/buster.js';
        grunt.verbose.writeln('Found test/buster.js');
      } else if(fs.existsSync('spec/buster.js')) {
        configFile = 'spec/buster.js';
        grunt.verbose.writeln('Found spec/buster.js');
      }
    }
    var configs = require(path.join(process.cwd(), configFile));

    for(var config in configs){
      if((configs[config].environment || configs[config].env) === 'browser'){
        return true;
      }
    }
  };

  var busterNotFound = function(){
    grunt.log.errorlns(
          'In order for this task to work properly, Buster.JS must be ' +
          'installed and in the system PATH (if you can run "buster" at' +
          'the command line, this task should work).' +
          'To install Buster.JS, run `npm install -g buster`.'
        );
  };

  var phantomjsNotFound = function(){
    grunt.log.errorlns(
          'In order for this task to work properly, PhantomJS must be ' +
          'installed and in the system PATH (if you can run "phantomjs" at' +
          'the command line, this task should work). Unfortunately, ' +
          'PhantomJS cannot be installed automatically via npm or grunt. ' +
          'See the grunt FAQ for PhantomJS installation instructions: ' +
          'https://github.com/cowboy/grunt/blob/master/docs/faq.md'
        );
  };

  var runBusterServer = function(){
    var deferred = when.defer();
    childProcess.exec('command -v buster-server', { env: process.env }, function(error, stdout) {
      if (error) {
        busterNotFound();
        deferred.reject();
      }
      else {
        var mod = stdout.split('\n')[0];
        var server = childProcess.spawn(mod, getArguments('server'), {
          env: process.env,
          setsid: true
        });

        server.stdout.once('data', function() {
          deferred.resolve(server);
        });

        server.stderr.once('data', function() {
          deferred.reject(server);
        });

        server.stdout.on('data', function(data) {
          process.stdout.write(data);
        });

        server.stderr.on('data', function(data) {
          process.stderr.write(data);
        });
      }
    });

    return deferred.promise;
  };

  var runBusterTest = function(){
    var deferred = when.defer();
    childProcess.exec('command -v buster-test', { env: process.env }, function(error, stdout) {
      if (error) {
        busterNotFound();
        deferred.reject();
      }
      else {
        var output = [],
            mod = stdout.split('\n')[0];
        var run = childProcess.spawn(mod, getArguments('test'), {
          env: process.env,
          setsid: true
        });

        run.stdout.on('data', function(data) {
          output.push(data);
          process.stdout.write(data);
        });

        run.stderr.on('data', function(data) {
          process.stderr.write(data);
        });

        run.on('exit', function(code) {
          var text = '';
          if(output[output.length - 2]){
            text = output[output.length - 2].toString().split(', ').join('\n') + output[output.length - 1];
          }
          text = text.replace(/\u001b\[.*m/g, '').trim();
          if (code === 0) {
            if (getConfigSection('growl') === true) {
              growl.passed(text).otherwise(function (error) {
                grunt.log.writeln(error.yellow);
              });
            }
            deferred.resolve();
          } else {
            if (getConfigSection('growl') === true) {
              growl.failed(text).otherwise(function (error) {
                grunt.log.writeln(error.yellow);
              });
            }
            deferred.reject();
          }
        });
      }
    });
    return deferred.promise;
  };

  var runPhantomjs = function() {
    var deferred = when.defer();
    childProcess.exec('command -v phantomjs', { env: process.env }, function(error, stdout) {
      if (error) {
        phantomjsNotFound();
        deferred.reject();
      }
      else {
        var mod = stdout.split('\n')[0];

        var server = childProcess.spawn(mod, getArguments('phantomjs'), {
          env: process.env,
          setsid: true
        });

        server.stdout.on('data', function(data) {
          grunt.verbose.writeln(data);
        });

        server.stderr.on('data', function(data) {
          grunt.verbose.writeln(data);
        });

        server.stdout.once('data', function() {
          deferred.resolve(server);
        });
      }
    });

    return deferred.promise;
  };

  grunt.registerTask('buster', 'Run Buster.JS tests.', function() {
    var done = this.async();
    var stop = function(success, server, phantomjs){
      if(server){
        server.kill();
        grunt.verbose.writeln('buster-server stopped');
      }
      if(phantomjs){
        phantomjs.kill();
        grunt.verbose.writeln('phantomjs stopped');
      }
      done(success);
    };

    if(shouldRunServer()){
      runBusterServer().then(
        function(server){
          runPhantomjs().then(
            function(phantomjs){
              runBusterTest().then(
                function(){
                  stop(null, server, phantomjs);
                },
                function(){
                  stop(false, server, phantomjs);
                }
              );
            },
            function(phantomjs) {
              stop(false, server, phantomjs);
            }
          );
        },
        function(server){
          stop(false, server);
        }
      );
    }
    else {
      runBusterTest().then(
        function(){
          done(null);
        },
        function(){
          done(false);
        }
      );
    }
  });
};
