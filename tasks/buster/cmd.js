var cp = require('child_process');
var grunt = require('grunt');
var when = require('when');
var resolveBin = require('resolve-bin');

exports.run = function (moduleName, cmd, args, callback) {
  callback = callback || function () {};
  resolveBin(moduleName, { executable: cmd }, function (error, path) {
    if (error) {
      callback(error);
    } else {
      args.unshift(path);
      callback(null, cp.spawn(process.execPath, args, {
        env: process.env,
        setsid: true
      }));
    }
  });
};


var busterNotFound = function () {
  grunt.log.error(
    'Buster.JS not found. Run `npm install buster` to install.');
};


exports.runBusterServer = function (args) {
  var deferred = when.defer();

  exports.run('buster', 'buster-server', args, function (error, serverProcess) {
    if (error) {
      busterNotFound();
      deferred.reject();
    } else {
      serverProcess.stdout.once('data', function () {
        deferred.resolve(serverProcess);
      });

      serverProcess.stderr.once('data', function () {
        deferred.reject(serverProcess);
      });

      serverProcess.stdout.on('data', function (data) {
        grunt.verbose.write(data);
      });

      serverProcess.stderr.on('data', function (data) {
        grunt.log.error(data);
      });
    }

    return deferred;
  });

  return deferred.promise;
};


exports.runBusterTest = function (args) {
  var deferred = when.defer();

  exports.run('buster', 'buster-test', args, function (error, runnerProcess) {
    if (error) {
      busterNotFound();
      deferred.reject();
    } else {
      var output = [];

      runnerProcess.stdout.on('data', function (data) {
        output.push(data);
        grunt.log.write(data);
      });

      runnerProcess.stderr.on('data', function (data) {
        grunt.log.error(data);
      });

      runnerProcess.on('exit', function (code) {
        var text = '';
        if (output[output.length - 2]) {
          text = output[output.length - 2].toString().split(', ').join('\n') +
            output[output.length - 1];
        }
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


exports.runPhantomjs = function (args) {
  var deferred = when.defer();

  exports.run('phantomjs', 'phantomjs', args, function (error, phantomProcess) {
    if (error) {
      grunt.log.error(
        'PhantomJS not found. Run `npm install phantomjs` to install.');
      deferred.reject();
    } else {
      phantomProcess.stdout.on('data', function (data) {
        grunt.verbose.writeln(data);
      });

      phantomProcess.stderr.on('data', function (data) {
        grunt.verbose.writeln(data);
      });

      phantomProcess.stdout.once('data', function () {
        deferred.resolve(phantomProcess);
      });
    }
  });

  return deferred.promise;
};


exports.stop = function (server, phantomjs) {
  if (server) {
    server.kill();
    grunt.verbose.writeln('buster-server stopped');
  }
  if (phantomjs) {
    phantomjs.kill();
    grunt.verbose.writeln('phantomjs stopped');
  }
};

exports.stopOnExit = function () {
  var args = Array.prototype.slice.call(arguments);
  process.on('exit', function () {
    exports.stop.apply(null, args);
  });
};
