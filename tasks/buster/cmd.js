var cp = require('child_process');
var fs = require('fs');
var os = require('os');
var path = require('path');

var exports = module.exports = {

  findExecutable: function (cmd, callback) {
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
  },

  run: function (cmd, args, callback) {
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
  }

};
