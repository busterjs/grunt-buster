module.exports = function (grunt) {

  'use strict';

  var files = [
    'Gruntfile.js',
    'tasks/**/*.js',
    'test/**/*.js'
  ];

  grunt.initConfig({
    buster: {
      all: {},
      options: {
        growl: true
      }
    },

    jshint: {
      all: files,
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      all: {
        files: files,
        tasks: ['test']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.loadTasks('./tasks');

  grunt.registerTask('test', ['jshint', 'buster']);
  grunt.registerTask('default', ['test']);
};
