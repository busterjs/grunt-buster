exports.getConfigSection = function (cmd, config) {
  return (config || {})[cmd] || {};
};

exports.getArguments = function (cmd, config) {
  var args = [];
  var configSection = exports.getConfigSection(cmd, config);
  var serverPort = exports.getConfigSection('server', config).port || 1111;

  if (cmd === 'phantomjs') {
    args.push(__dirname + '/buster/phantom.js');
    args.push('http://localhost:' + serverPort + '/capture');
    return args;
  }

  if (cmd === 'test') {
    args.push('--server', 'http://localhost:' + serverPort);
  }

  for (var arg in configSection) {
    var value = configSection[arg];
    if (value !== false) {
      args.push('--' + arg);
      if (value !== true) {
        args.push(value);
      }
    }
  }
  return args;
};
