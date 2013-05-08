var cp = require('child_process');
var buster = require('buster');
var path = require('path');

var assert = buster.assert;
var refute = buster.refute;

var cmd = require('../tasks/buster/cmd');

buster.testCase('Cmd', {

  '.findExecutable': {

    'calls .exec with `command -v` and argument': function () {
      var stub = this.stub(cp, 'exec');
      cmd.findExecutable('ls');
      assert.calledOnceWith(stub, 'command -v ls');
    },

    'passes along environment to .exec': function () {
      var stub = this.stub(cp, 'exec');
      cmd.findExecutable('ls');
      assert.calledOnceWith(stub, 'command -v ls', {
        env: process.env
      });
    },

    'calls callback with executable path': function () {
      this.stub(cp, 'exec', function (_, __, callback) {
        callback(null, '/foo/bar/ls');
      });
      var spy = this.spy();
      cmd.findExecutable('ls', spy);
      assert.calledOnceWith(spy, null, '/foo/bar/ls');
    },

    'fetches first result': function () {
      this.stub(cp, 'exec', function (_, __, callback) {
        callback(null, '/foo/bar/ls\n/baz/quux/ls\n');
      });
      var spy = this.spy();
      cmd.findExecutable('ls', spy);
      assert.calledOnceWith(spy, null, '/foo/bar/ls');
    },

    'calls callback with error': function () {
      this.stub(cp, 'exec', function (_, __, callback) {
        callback('some error');
      });
      var spy = this.spy();
      cmd.findExecutable('ls', spy);
      assert.calledOnceWith(spy, 'some error');
    },

    'calls fs.existsSync with node_modules path': function () {
      var fs = require('fs');
      var stub = this.stub(fs, 'existsSync');

      cmd.findExecutable('ls');

      assert.calledOnceWith(stub, path.join('node_modules', '.bin', 'ls'));
    },

    'adds ".cmd" for windows npm-shims': function () {
      var fs = require('fs');
      var stub = this.stub(fs, 'existsSync');
      var os = require('os');

      this.stub(os, 'platform', function () {
        return 'win32';
      });

      cmd.findExecutable('ls');

      assert.calledOnceWith(stub, path.join('node_modules', '.bin', 'ls.cmd'));
    },

    'calls callback with node_modules if it exists': function () {
      var fs = require('fs');
      this.stub(fs, 'existsSync', function () {
        return true;
      });

      var execStub = this.stub(cp, 'exec');
      var spy = this.spy();

      cmd.findExecutable('ls', spy);

      assert.calledOnceWith(spy, null, path.join('node_modules', '.bin', 'ls'));
      refute.called(execStub);
    }

  },

  '.run': {

    setUp: function () {
      this.spawnStub = this.stub(cp, 'spawn');
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

    'calls .spawn with environment and setsid': function () {
      this.stub(cmd, 'findExecutable', function (_, callback) {
        callback(null, 'ls');
      });
      cmd.run('ls', []);
      assert.calledOnceWith(this.spawnStub, 'ls', [], {
        env: process.env,
        setsid: true
      });
    },

    'calls .spawn with correct arguments': function () {
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

    'calls callback with return value from .spawn': function () {
      this.stub(cp, 'exec', function (cmd, __, callback) {
        callback(null, cmd);
      });

      this.spawnStub.restore();
      var handle = {};
      this.stub(cp, 'spawn', function () {
        return handle;
      });

      var spy = this.spy();
      cmd.run('ls', [], spy);

      assert.calledOnceWith(spy, null, handle);
    }

  }

});
