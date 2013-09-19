var buster = require('buster');
var assert = buster.assert;

var config = require('../tasks/buster/config');

buster.testCase('grunt-buster config.getConfigSection', {

  'returns an empty object for non-matching sections': function () {
    var section = config.getConfigSection('foo', {
      'bar': 'baz'
    });
    assert.equals(section, {});
  },

  'returns sub-object for matching sections': function () {
    var section = config.getConfigSection('foo', {
      'foo': {
        'bar': 'baz'
      }
    });
    assert.equals(section, { 'bar': 'baz' });
  }

});

buster.testCase('grunt-buster config.getArguments', {

  'adds "--server" to "test" command': function () {
    var args = config.getArguments('test');
    assert.match(args, ['--server', 'http://localhost']);
  },

  'adds "--" argument for each config key': function () {
    var args = config.getArguments('test', {
      test: {
        foo: 'bar',
        baz: 'quux'
      }
    });
    assert.match(args, ['--foo', 'bar', '--baz', 'quux']);
  }

});
