var exports = module.exports = {

  exec: require('child_process').exec,

  findExecutable: function (cmd, callback) {
    exports.exec('command -v ' + cmd, { env: process.env }, function (_, stdout) {
      callback(null, stdout.split('\n')[0]);
    });
  },

  run: function (cmd, args) {
    exports.findExecutable(cmd, function (_, path) {
      exports.spawn(path, args);
    });
  },

  spawn: require('child_process').spawn

};
