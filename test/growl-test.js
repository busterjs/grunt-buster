var buster = require('buster');
var growl = require('../tasks/buster/growl.js');
var grunt = require('grunt');

var assert = buster.assert;

buster.testCase('Growl', {

  'logs an error if Growl is not found': function () {
    var logStub = this.stub(grunt.log, 'error');
    this.stub(growl, 'requireGrowl', function () {});

    growl.init(grunt);

    assert.calledOnceWith(
      logStub, 'Growl not found; run `npm install growl` for Growl support');
  },

  'sends a Growl notice when "buster:success" is emitted': function () {
    var growlSpy = this.spy();
    this.stub(growl, 'requireGrowl', function () {
      return growlSpy;
    });
    growl.init(grunt);

    grunt.event.emit('buster:success', 'A great success!');

    assert.calledOnceWith(growlSpy, 'A great success!');
    assert.match(growlSpy.firstCall.args[1], {
      title: 'Tests Passed'
    });
  },

  'sends a Growl notice when "buster:failure" is emitted': function () {
    var growlSpy = this.spy();
    this.stub(growl, 'requireGrowl', function () {
      return growlSpy;
    });
    growl.init(grunt);

    grunt.event.emit('buster:failure', 'A major failure!');

    assert.calledOnceWith(growlSpy, 'A major failure!');
    assert.match(growlSpy.firstCall.args[1], {
      title: 'Tests Failed'
    });
  },

  'cleans up colors': function () {
    var growlSpy = this.spy();
    this.stub(growl, 'requireGrowl', function () {
      return growlSpy;
    });
    growl.init(grunt);

    /* jshint -W100 */
    /* jshint -W113 */
    grunt.event.emit('buster:success', 'Results:\n[1m[32m  ✓ resultViewer should exist[0m\n');
    assert.calledOnceWith(growlSpy, 'Results:\n  ✓ resultViewer should exist');

    assert.match(growlSpy.firstCall.args[1], {
      title: 'Tests Passed'
    });
  }

});
