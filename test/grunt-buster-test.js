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
  var done = context.done || function () {};
  context.args = context.args || [];
  context.async = context.async || function () {
    return done;
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
    // Example: grunt buster::test
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
  },

  'runs the server without stopping if called with `server` arg': function (done) {
    // Example: grunt buster::server
    this.stub(config, 'shouldRunServer').returns(false);

    var context = {
      args: ['server'],
      done: function () {}
    };

    var serverStub = this.deferStub(cmd, 'runBusterServer');
    var phantomStub = this.deferStub(cmd, 'runPhantomjs');
    var testStub = this.deferStub(cmd, 'runBusterTest');
    var stopStub = this.stub(cmd, 'stopOnExit');

    this.stub(context, 'done', function () {
      assert.calledOnce(serverStub);
      refute.called(phantomStub);
      refute.called(testStub);
      assert.calledOnce(stopStub);
      done();
    });

    invokeTask(context);

    serverStub.deferred.resolve('server');
    phantomStub.deferred.resolve('phantomjs');
    testStub.deferred.resolve();
  },

  'runs phantomjs without stopping if called with `phantomjs` arg': function (done) {
    // Example: grunt buster::phantomjs
    this.stub(config, 'shouldRunPhantomjs').returns(false);

    var context = {
      args: ['phantomjs'],
      done: function () {}
    };

    var serverStub = this.deferStub(cmd, 'runBusterServer');
    var phantomStub = this.deferStub(cmd, 'runPhantomjs');
    var testStub = this.deferStub(cmd, 'runBusterTest');
    var stopStub = this.stub(cmd, 'stopOnExit');

    this.stub(context, 'done', function () {
      refute.called(serverStub);
      assert.calledOnce(phantomStub);
      refute.called(testStub);
      assert.calledOnce(stopStub);
      done();
    });

    invokeTask(context);

    serverStub.deferred.resolve('server');
    phantomStub.deferred.resolve('phantomjs');
    testStub.deferred.resolve();
  },

  'runs all tasks if all are passed as args': function (done) {
    // Example: grunt buster::server:phantomjs:test
    this.stub(config, 'shouldRunServer').returns(false);
    this.stub(config, 'shouldRunPhantomjs').returns(false);

    var context = {
      args: ['server', 'phantomjs', 'test'],
      done: function () {}
    };

    var serverStub = this.deferStub(cmd, 'runBusterServer');
    var phantomStub = this.deferStub(cmd, 'runPhantomjs');
    var testStub = this.deferStub(cmd, 'runBusterTest');
    var stopStub = this.stub(cmd, 'stopOnExit');

    this.stub(context, 'done', function () {
      assert.calledOnce(serverStub);
      assert.calledOnce(phantomStub);
      assert.calledOnce(testStub);
      assert.calledOnce(stopStub);
      done();
    });

    invokeTask(context);

    serverStub.deferred.resolve('server');
    phantomStub.deferred.resolve('phantomjs');
    testStub.deferred.resolve();
  },

  'does not call `done` when passing `block` as argument': function (done) {
    // Example: grunt buster::server:block
    this.stub(config, 'shouldRunServer').returns(false);

    var context = {
      args: ['server', 'block'],
      done: function () {}
    };

    var serverStub = this.deferStub(cmd, 'runBusterServer');
    var phantomStub = this.deferStub(cmd, 'runPhantomjs');
    var testStub = this.deferStub(cmd, 'runBusterTest');
    var stopStub = this.stub(cmd, 'stopOnExit');

    var doneSpy = this.spy(context, 'done');
    setTimeout(function () {
      assert.calledOnce(stopStub);
      refute.called(doneSpy);
      done();
    }, 0);

    invokeTask(context);

    serverStub.deferred.resolve('server');
    phantomStub.deferred.resolve('phantomjs');
    testStub.deferred.resolve();
  }
});
