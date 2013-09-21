var buster = require('buster');
var assert = buster.assert;

var when = require('when');

var task;
var grunt = require('grunt');
grunt.registerMultiTask = function (name, desc, fn) {
  task = fn;
};
require('../tasks/buster')(grunt);


var invokeTask = function (task, context) {
  context = context || {};
  context.async = context.async || function () {
    return function () {};
  };
  context.options = context.options || function () {
    return {};
  };
  task.call(context);
};


buster.testCase('grunt-buster task', {

  'is a function': function () {
    assert.isFunction(task);
  },

  'calls cmd.runBusterTest with grunt': function () {
    var stub = this.stub(require('../tasks/buster/cmd'), 'runBusterTest');
    stub.returns(when.defer().promise);
    invokeTask(task);
    assert.calledOnceWith(stub, grunt);
  },

  '// runs server and phantomjs if browser tests are defined': function () {
    var cmd = require('../tasks/buster/cmd');
    var serverStub = this.stub(cmd, 'runBusterServer');
    var phantomStub = this.stub(cmd, 'runPhantomjs');
    var testStub = this.stub(cmd, 'runBusterTest');
    invokeTask(task);
    assert.calledOnce(serverStub);
    assert.calledOnce(phantomStub);
    assert.calledOnce(testStub);
  }

});
