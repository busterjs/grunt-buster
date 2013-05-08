var buster = require('buster');
var assert = buster.assert;

var cmd = require('../tasks/buster/cmd');

buster.testCase('Exec', {

  '.exec is an alias of child_process.exec': function () {
    assert.same(cmd.exec, require('child_process').exec);
  },

  '.findExecutable': {

    'calls .exec with `command -v` and argument': function () {
      var stub = this.stub(cmd, 'exec');
      cmd.findExecutable('ls');
      assert.calledOnceWith(stub, 'command -v ls');
    },

    'passes along environment to .exec': function () {
      var stub = this.stub(cmd, 'exec');
      cmd.findExecutable('ls');
      assert.calledOnceWith(stub, 'command -v ls', {
        env: process.env
      });
    },

    'calls callback with executable path': function () {
      this.stub(cmd, 'exec', function (_, __, callback) {
        callback(null, '/foo/bar/ls');
      });
      var spy = this.spy();
      cmd.findExecutable('ls', spy);
      assert.calledOnceWith(spy, null, '/foo/bar/ls');
    },

    'fetches first result': function () {
      this.stub(cmd, 'exec', function (_, __, callback) {
        callback(null, '/foo/bar/ls\n/baz/quux/ls\n');
      });
      var spy = this.spy();
      cmd.findExecutable('ls', spy);
      assert.calledOnceWith(spy, null, '/foo/bar/ls');
    }

  },

  '.run': {

    setUp: function () {
      this.execStub = this.stub(cmd, 'exec');
      this.spawnStub = this.stub(cmd, 'spawn');
    },

    'calls .findExecutable with cmd name': function () {
      var stub = this.stub(cmd, 'findExecutable');
      cmd.run('ls');
      assert.calledOnceWith(stub, 'ls');
    },

    'calls .spawn with results of .findExecutable': function () {
      this.stub(cmd, 'findExecutable', function (_, callback) {
        callback(null, '/foo/bar/ls');
      });
      cmd.run('ls');
      assert.calledOnceWith(this.spawnStub, '/foo/bar/ls');
    },

    'calls .spawn with correct arguments': function () {
      this.stub(cmd, 'findExecutable', function (_, callback) {
        callback(null, 'ls');
      });
      cmd.run('ls', [ 1, 2, 3 ]);
      assert.calledOnceWith(this.spawnStub, 'ls', [ 1, 2, 3 ]);
    },

    '// calls callback with error when .findExecutable fails': function () {
      // cmd.run('ls', [], function (error, child) {
      // });
    }

  },

  '.spawn is an alias of child_process.spawn': function () {
    assert.same(cmd.spawn, require('child_process').spawn);
  }

});
