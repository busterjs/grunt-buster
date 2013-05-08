var exports = module.exports = {

  _exec: require('child_process').exec,

  _spawn: require('child_process').spawn,

  findExecutable: function (cmd, callback) {
    exports._exec('command -v ' + cmd, { env: process.env }, function (error, stdout) {
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
        callback(null, exports._spawn(path, args, {
          env: process.env,
          setsid: true
        }));
      }
    });
  }

};
