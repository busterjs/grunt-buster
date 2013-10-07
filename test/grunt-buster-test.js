var buster = require('buster');
var assert = buster.assert;
var refute = buster.refute;

var when = require('when');

var cmd = require('../tasks/buster/cmd'),
    config = require('../tasks/buster/config');

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

  'runs only tests when there are no browser tests defined and calls stop': function (done) {
    var stub = this.deferStub(cmd, 'runBusterTest');
    this.stub(cmd, 'stop', function () {
      assert.calledOnceWith(stub);
      done();
    });
    invokeTask();
    stub.deferred.resolve();
  },

  'runs server and phantomjs if browser tests are defined and calls stop': function (done) {
    this.stub(config, 'shouldRunServer').returns(true);

    var serverStub = this.deferStub(cmd, 'runBusterServer');
    var phantomStub = this.deferStub(cmd, 'runPhantomjs');
    var testStub = this.deferStub(cmd, 'runBusterTest');

    this.stub(cmd, 'stop', function (server, phantomjs) {
      assert.equals(server, 'server');
      assert.equals(phantomjs, 'phantomjs');

      assert.callOrder(serverStub, phantomStub, testStub);
      assert.calledOnce(serverStub);
      assert.calledOnce(phantomStub);
      assert.calledOnce(testStub);

      done();
    });

    invokeTask();

    serverStub.deferred.resolve('server');
    phantomStub.deferred.resolve('phantomjs');
    testStub.deferred.resolve();
  },

  'runs just the tests with `test` argument': function (done) {
    this.stub(config, 'shouldRunServer').returns(true);

    var serverStub = this.deferStub(cmd, 'runBusterServer');
    var phantomStub = this.deferStub(cmd, 'runPhantomjs');
    var testStub = this.deferStub(cmd, 'runBusterTest');

    this.stub(cmd, 'stop', function () {
      refute.called(serverStub);
      refute.called(phantomStub);
      assert.calledOnce(testStub);
      done();
    });

    invokeTask({ args: ['test'] });

    serverStub.deferred.resolve('server');
    phantomStub.deferred.resolve('phantomjs');
    testStub.deferred.resolve();
  }
});
