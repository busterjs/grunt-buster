var cp = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');
var grunt = require('grunt');
var when = require('when');


exports.findExecutable = function (cmd, callback) {
  var candidate = path.join('node_modules', '.bin', cmd);

  if (os.platform() === 'win32') {
    candidate += '.cmd';
  }

  callback = callback || function () {};

  if (fs.existsSync(candidate)) {
    callback(null, candidate);
  } else {
    cp.exec('command -v ' + cmd, { env: process.env }, function (error, stdout) {
      if (error) {
        callback(error);
      } else {
        callback(null, stdout.split('\n')[0]);
      }
    });
  }
};


exports.run = function (cmd, args, callback) {
  callback = callback || function () {};
  exports.findExecutable(cmd, function (error, path) {
    if (error) {
      callback(error);
    } else {
      callback(null, cp.spawn(path, args, {
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

  exports.run('buster-server', args, function (error, server) {
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
        grunt.verbose.write(data);
      });

      server.stderr.on('data', function (data) {
        grunt.log.error(data);
      });
    }

    return deferred;
  });

  return deferred.promise;
};


exports.runBusterTest = function (args) {
  var deferred = when.defer();

  exports.run('buster-test', args, function (error, run) {
    if (error) {
      busterNotFound();
      deferred.reject();
    } else {
      var output = [];

      run.stdout.on('data', function (data) {
        output.push(data);
        grunt.log.write(data);
      });

      run.stderr.on('data', function (data) {
        grunt.log.error(data);
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


exports.runPhantomjs = function (args) {
  var deferred = when.defer();

  exports.run('phantomjs', args, function (error, server) {
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
