var buster = require('buster');
var assert = buster.assert;

var when = require('when');

var task;
var grunt = require('grunt');
grunt.registerMultiTask = function (name, desc, fn) {
  task = fn;
};
require('../tasks/buster')(grunt);


var invokeTask = function (context) {
  context = context || {};
  context.args = context.args || [];
  context.async = context.async || function () {
    return function () {};
  };
  context.options = context.options || function () {
    return {};
  };
  task.call(context);
};


buster.testCase('grunt-buster task', {

  setUp: function () {
    this.deferStub = function (obj, attr) {
      var stub = this.stub(obj, attr);
      stub.deferred = when.defer();
      return stub.returns(stub.deferred.promise);
    };
  },

  'is a function': function () {
    assert.isFunction(task);
  },

  'runs only tests when there are no browser tests defined': function () {
    var stub = this.stub(require('../tasks/buster/cmd'), 'runBusterTest');
    stub.returns(when.defer().promise);
    invokeTask();
    assert.calledOnceWith(stub, grunt);
  },

  'runs server and phantomjs if browser tests are defined': function (done) {
    var config = require('../tasks/buster/config');
    this.stub(config, 'shouldRunServer').returns(true);

    var cmd = require('../tasks/buster/cmd');
    var serverStub = this.deferStub(cmd, 'runBusterServer');
    var phantomStub = this.deferStub(cmd, 'runPhantomjs');
    var testStub = this.deferStub(cmd, 'runBusterTest');

    invokeTask();

    when.all([
      serverStub.deferred.resolve(),
      phantomStub.deferred.resolve(),
      testStub.deferred.resolve()
    ]).then(function () {
      assert.callOrder(serverStub, phantomStub, testStub);
      assert.calledOnce(serverStub);
      assert.calledOnce(phantomStub);
      assert.calledOnce(testStub);
      done();
    });
  }

});
