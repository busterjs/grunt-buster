var buster = require('buster');
var assert = buster.assert;
var refute = buster.refute;
var when = require('when');

var utils = require('../tasks/buster/utils');

buster.testCase('utils', {
  '.sequence': {
    'resolves scalar directly': function (done) {
      var spy = this.spy();

      utils.sequence([ null ]).then(spy);

      setTimeout(function () {
        assert.calledOnceWith(spy, [ null ]);
        done();
      }, 10);
    },

    'accepts tasks as deferreds': function (done) {
      var spy = this.spy();
      var deferred = when.defer();

      utils.sequence([ deferred.promise ]).then(spy);

      setTimeout(function () {
        refute.called(spy);
        deferred.resolve('foo');
        setTimeout(function () {
          assert.calledOnceWith(spy, [ 'foo' ]);
          done();
        }, 10);
      }, 10);
    },

    'accepts tasks as functions': function (done) {
      var spy = this.spy();

      utils.sequence([
        function () {
          return 'foo';
        }
      ]).then(spy);

      setTimeout(function () {
        assert.calledOnceWith(spy, [ 'foo' ]);
        done();
      }, 0);
    },

    'accepts tasks as functions returning promises': function (done) {
      var spy = this.spy();
      var deferred = when.defer();

      utils.sequence([
        function () {
          return deferred.promise;
        }
      ]).then(spy);

      setTimeout(function () {
        refute.called(spy);
        deferred.resolve('foo');
        setTimeout(function () {
          assert.calledOnceWith(spy, [ 'foo' ]);
          done();
        }, 10);
      }, 10);
    },

    'does not evaluate second task before the first is resolved': function (done) {
      var deferred1 = when.defer();
      var deferred2 = when.defer();
      var stub1 = this.stub().returns(deferred1.promise);
      var stub2 = this.stub().returns(deferred2.promise);
      var spy = this.spy();

      utils.sequence([ stub1, stub2 ]).then(spy);

      setTimeout(function () {
        assert.calledOnce(stub1);
        refute.called(stub2);
        refute.called(spy);

        deferred1.resolve('foo');

        setTimeout(function () {
          assert.calledOnce(stub2);
          refute.called(spy);

          deferred2.resolve('bar');

          setTimeout(function () {
            assert.calledOnceWith(spy, [ 'foo', 'bar' ]);
            assert.callOrder(stub1, stub2, spy);
            done();
          }, 10);
        }, 10);
      }, 10);
    },

    'does not evaluate second task if the first is rejected': function (done) {
      var deferred1 = when.defer();
      var deferred2 = when.defer();
      var stub1 = this.stub().returns(deferred1.promise);
      var stub2 = this.stub().returns(deferred2.promise);
      var success = this.spy();
      var failure = this.spy();

      utils.sequence([ stub1, stub2 ]).then(success, failure);

      setTimeout(function () {
        assert.calledOnce(stub1);
        refute.called(stub2);
        refute.called(success);
        refute.called(failure);

        deferred1.reject('foo');

        setTimeout(function () {
          refute.calledOnce(stub2);
          refute.called(success);
          assert.calledOnceWith(failure, [ 'foo' ]);
          done();
        }, 10);
      }, 10);
    }
  }
});
