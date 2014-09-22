var cp = require('child_process');
var buster = require('buster');
var path = require('path');

var assert = buster.assert;
var refute = buster.refute;

var cmd = require('../tasks/buster/cmd');

buster.testCase('Cmd', {

  '.run': {

    setUp: function () {
      this.spawnStub = this.stub(cp, 'spawn');
    },

    'calls .spawn with resolved binary (via node) and passes correct arguments': function (done) {
      var spawnStub = this.spawnStub;
      cmd.run('buster', 'buster-test', [ 1, 2, 3 ], function () {
        assert.calledOnceWith(spawnStub, process.execPath, [ path.resolve(__dirname, '../node_modules/buster/bin/buster-test'), 1, 2, 3 ], {
          env: process.env,
          setsid: true
        });
        done();
      });
    },

    'calls callback with error when resolve-bin fails': function (done) {
      cmd.run('no-such-module', 'no-such-file', [], function (err, actualHandle) {
        refute.isNull(err);
        assert.match(err.message, 'cannot find');
        refute(actualHandle);
        done();
      });
    },

    'calls callback with return value from .spawn': function (done) {
      var handle = {};
      this.spawnStub.returns(handle);

      cmd.run('buster', 'buster-test', [], function (err, actualHandle) {
        assert.isNull(err);
        assert.same(actualHandle, handle);
        done();
      });
    }

  },

  '.runBusterServer calls .run with "buster-server"': function () {
    var stub = this.stub(cmd, 'run');
    cmd.runBusterServer();
    assert.calledOnceWith(stub, 'buster', 'buster-server');
  },

  '.runBusterTest calls .run with "buster-test"': function () {
    var stub = this.stub(cmd, 'run');
    cmd.runBusterTest();
    assert.calledOnceWith(stub, 'buster', 'buster-test');
  },

  '.runPhantomjs calls .run with "phantomjs"': function () {
    var stub = this.stub(cmd, 'run');
    cmd.runPhantomjs();
    assert.calledOnceWith(stub, 'phantomjs', 'phantomjs');
  },

  '.stop': {
    'kills server if defined': function () {
      var server = { kill: this.spy() };
      cmd.stop(server, null);
      assert.calledOnce(server.kill);
    },

    'kills phantomjs if defined': function () {
      var phantomjs = { kill: this.spy() };
      cmd.stop(null,  phantomjs);
      assert.calledOnce(phantomjs.kill);
    }
  },

  '.stopOnExit calls .stop with args on process.exit': function () {
    var stopStub = this.stub(cmd, 'stop');
    var processStub = this.stub(process, 'on');

    cmd.stopOnExit('server', 'phantomjs');

    assert.calledOnceWith(processStub, 'exit');
    processStub.args[0][1]();

    assert.calledOnceWith(stopStub, 'server', 'phantomjs');
  }

});
