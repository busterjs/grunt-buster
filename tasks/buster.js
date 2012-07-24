module.exports = function(grunt) {
  var childProcess = require('child_process'),
      path = require('path'),
      when = require('when'),
      growl;

  try {
    growl = require('growl');
  } catch(e) {
    growl = Function.prototype;
    grunt.verbose.writeln('Growl not found, `npm install growl` for Growl support'.yellow);
  }

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
    var configFile = getConfigSection('test').config || 'buster.js',
        configs = require(path.join(process.cwd(), configFile));

    for(var config in configs){
      if((configs[config].environment || configs[config].env) === 'browser'){
        return true;
      }
    }
  };

  grunt.registerTask('buster', 'Run Buster.JS tests. Make sure you have started buster server first.', function() {
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
      grunt.helper('buster-server').then(
        function(server){
          grunt.helper('buster-phantomjs').then(
            function(phantomjs){
              grunt.helper('buster-test').then(
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
      grunt.helper('buster-test').then(
        function(){
          done(null);
        },
        function(){
          done(false);
        });
    }
  });

  grunt.registerHelper('buster-server', function(){
    var deferred = when.defer();
    childProcess.exec('command -v buster-server', { env: process.env }, function(error, stdout, stderr) {
      if (error) {
        grunt.log.writeln('Unknown error occurred when running Buster.JS'.red);
        deferred.reject();
      }
      else {
        var mod = stdout.split('\n')[0];

        var server = childProcess.spawn(mod, getArguments('server'), {
          env: process.env,
          setsid: true
        });

        server.stdout.on('data', function(data) {
          process.stdout.write(data);
          deferred.resolve(server);
        });

        server.stderr.on('data', function(data) {
          process.stderr.write(data);
          deferred.reject(server);
        });
      }
    });

    return deferred.promise;
  });

  grunt.registerHelper('buster-test', function(){
    var deferred = when.defer();
    childProcess.exec('command -v buster-test', { env: process.env }, function(error, stdout, stderr) {
      if (error) {
        grunt.log.writeln('Unknown error occurred when running Buster.JS'.red);
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
          if(code === 0){
            growl(text, {
              title: 'Tests Passed',
              image: __dirname + '/buster/ok.png'
            });
            deferred.resolve();
          }
          else {
            growl(text, {
              title: 'Tests Failed',
              image: __dirname + '/buster/error.png'
            });
            deferred.reject();
          }
        });
      }
    });
    return deferred.promise;
  });

  grunt.registerHelper('buster-phantomjs', function() {
      var deferred = when.defer();
      childProcess.exec('command -v phantomjs', { env: process.env }, function(error, stdout, stderr) {
      if (error) {
        grunt.log.errorlns(
          'In order for this task to work properly, PhantomJS must be ' +
          'installed and in the system PATH (if you can run "phantomjs" at' +
          'the command line, this task should work). Unfortunately, ' +
          'PhantomJS cannot be installed automatically via npm or grunt. ' +
          'See the grunt FAQ for PhantomJS installation instructions: ' +
          'https://github.com/cowboy/grunt/blob/master/docs/faq.md'
        );
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

        deferred.resolve(server);
      }
    });

    return deferred.promise;
  });
};