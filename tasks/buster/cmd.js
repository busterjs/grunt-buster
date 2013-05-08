var cp = require('child_process');

var exports = module.exports = {

  findExecutable: function (cmd, callback) {
    cp.exec('command -v ' + cmd, { env: process.env }, function (error, stdout) {
      if (error) {
        callback(error);
      } else {
        callback(null, stdout.split('\n')[0]);
      }
    });
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
