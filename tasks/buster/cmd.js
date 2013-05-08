var cp = require('child_process');
var fs = require('fs');
var path = require('path');

var exports = module.exports = {

  findExecutable: function (cmd, callback) {
    var candiate = path.join('node_modules', '.bin', cmd);

    callback = callback || function () {};

    if (fs.existsSync(candiate)) {
      callback(null, candiate);
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
