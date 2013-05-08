var exports = module.exports = {

  exec: require('child_process').exec,

  findExecutable: function (cmd, callback) {
    exports.exec('command -v ' + cmd, { env: process.env }, function (error, stdout) {
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
        callback(null, exports.spawn(path, args, {
          env: process.env,
          setsid: true
        }));
      }
    });
  },

  spawn: require('child_process').spawn

};
