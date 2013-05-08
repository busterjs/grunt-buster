var buster = require('buster');
var assert = buster.assert;

var cmd = require('../tasks/buster/cmd');

buster.testCase('Exec', {

  '._exec is an alias of child_process._exec': function () {
    assert.same(cmd._exec, require('child_process').exec);
  },

  '._spawn is an alias of child_process.spawn': function () {
    assert.same(cmd._spawn, require('child_process').spawn);
  },

  '.findExecutable': {

    'calls .exec with `command -v` and argument': function () {
      var stub = this.stub(cmd, '_exec');
      cmd.findExecutable('ls');
      assert.calledOnceWith(stub, 'command -v ls');
    },

    'passes along environment to ._exec': function () {
      var stub = this.stub(cmd, '_exec');
      cmd.findExecutable('ls');
      assert.calledOnceWith(stub, 'command -v ls', {
        env: process.env
      });
    },

    'calls callback with executable path': function () {
      this.stub(cmd, '_exec', function (_, __, callback) {
        callback(null, '/foo/bar/ls');
      });
      var spy = this.spy();
      cmd.findExecutable('ls', spy);
      assert.calledOnceWith(spy, null, '/foo/bar/ls');
    },

    'fetches first result': function () {
      this.stub(cmd, '_exec', function (_, __, callback) {
        callback(null, '/foo/bar/ls\n/baz/quux/ls\n');
      });
      var spy = this.spy();
      cmd.findExecutable('ls', spy);
      assert.calledOnceWith(spy, null, '/foo/bar/ls');
    },

    'calls callback with error': function () {
      this.stub(cmd, '_exec', function (_, __, callback) {
        callback('some error');
      });
      var spy = this.spy();
      cmd.findExecutable('ls', spy);
      assert.calledOnceWith(spy, 'some error');
    },

    '// looks up in node_modules/.bin first': function () {
    }

  },

  '.run': {

    setUp: function () {
      this.spawnStub = this.stub(cmd, '_spawn');
    },

    'calls .findExecutable with cmd name': function () {
      var stub = this.stub(cmd, 'findExecutable');
      cmd.run('ls');
      assert.calledOnceWith(stub, 'ls');
    },

    'calls ._spawn with results of .findExecutable': function () {
      this.stub(cmd, 'findExecutable', function (_, callback) {
        callback(null, '/foo/bar/ls');
      });
      cmd.run('ls');
      assert.calledOnceWith(this.spawnStub, '/foo/bar/ls');
    },

    'calls ._spawn with environment and setsid': function () {
      this.stub(cmd, 'findExecutable', function (_, callback) {
        callback(null, 'ls');
      });
      cmd.run('ls', []);
      assert.calledOnceWith(this.spawnStub, 'ls', [], {
        env: process.env,
        setsid: true
      });
    },

    'calls ._spawn with correct arguments': function () {
      this.stub(cmd, 'findExecutable', function (_, callback) {
        callback(null, 'ls');
      });
      cmd.run('ls', [ 1, 2, 3 ]);
      assert.calledOnceWith(this.spawnStub, 'ls', [ 1, 2, 3 ]);
    },

    'calls callback with error when .findExecutable fails': function () {
      this.stub(cmd, 'findExecutable', function (_, callback) {
        callback('some error');
      });

      var spy = this.spy();
      cmd.run('ls', [], spy);

      assert.calledOnceWith(spy, 'some error');
    },

    'calls callback with return value from ._spawn': function () {
      this.stub(cmd, '_exec', function (cmd, __, callback) {
        callback(null, cmd);
      });

      this.spawnStub.restore();
      var handle = {};
      this.stub(cmd, '_spawn', function () {
        return handle;
      });

      var spy = this.spy();
      cmd.run('ls', [], spy);

      assert.calledOnceWith(spy, null, handle);
    }

  }

});
