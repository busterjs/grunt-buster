var fs = require('fs');
var grunt = require('grunt');
var path = require('path');


exports.getConfigSection = function (cmd, config) {
  return (config || {})[cmd] || {};
};


exports.getArguments = function (cmd, config) {
  var args = [];
  var configSection = exports.getConfigSection(cmd, config);
  var serverPort = exports.getConfigSection('server', config).port || 1111;

  if (cmd === 'phantomjs') {
    args.push(__dirname + '/phantom.js');
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


exports.shouldRunServer = function (configData) {
  var configFile = exports.getConfigSection('test', configData).config;
  if (!configFile) {
    grunt.verbose.writeln(
        'No buster configuration specified. Looking in known locations...');

    if (fs.existsSync('buster.js')) {
      configFile = 'buster.js';
      grunt.verbose.writeln('Found ./buster.js');
    } else if (fs.existsSync('test/buster.js')) {
      configFile = 'test/buster.js';
      grunt.verbose.writeln('Found ./test/buster.js');
    } else if (fs.existsSync('spec/buster.js')) {
      configFile = 'spec/buster.js';
      grunt.verbose.writeln('Found ./spec/buster.js');
    }
  }
  var configs = require(path.join(process.cwd(), configFile));

  for (var key in configs) {
    if ((configs[key].environment || configs[key].env) === 'browser') {
      return true;
    }
  }
};

exports.shouldRunPhantomjs = function (configData) {
  return exports.shouldRunServer(configData);
};
