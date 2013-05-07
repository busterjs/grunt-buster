var buster = require('buster');
var growl = require('../tasks/buster/growl.js');
var when = require('when');

buster.testCase('Growl', {

  '.passed': {
    'makes a Growl notice with the given text': function (done) {
      var growlSpy = this.spy();
      this.stub(growl, 'init', function () {
        return when.resolve(growlSpy);
      });

      growl.passed('A great success!').then(done(function () {
        buster.assert.calledOnceWith(growlSpy, 'A great success!');
        buster.assert.match(growlSpy.firstCall.args[1], {
          title: 'Tests Passed'
        });
      }));
    },

    'rejects if Growl is not found': function (done) {
      this.stub(growl, 'init', function () {
        return when.reject('Growl not found');
      });

      growl.passed('A great success!').otherwise(done(function (error) {
        buster.assert.equals(error, 'Growl not found');
      }));
    }
  },

  '.failed': {
    'makes a Growl notice with the given text': function (done) {
      var growlSpy = this.spy();
      this.stub(growl, 'init', function () {
        return when.resolve(growlSpy);
      });

      growl.failed('A major failure!').then(done(function () {
        buster.assert.calledOnceWith(growlSpy, 'A major failure!');
        buster.assert.match(growlSpy.firstCall.args[1], {
          title: 'Tests Failed'
        });
      }));
    },

    'rejects if Growl is not found': function (done) {
      this.stub(growl, 'init', function () {
        return when.reject('Growl not found');
      });

      growl.failed('A major failure!').otherwise(done(function (error) {
        buster.assert.equals(error, 'Growl not found');
      }));
    }
  }

});
