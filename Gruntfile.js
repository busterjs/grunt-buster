module.exports = function(grunt) {

    "use strict";

    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/**/*.js',
                'test/**/*.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        watch: {
            all: {
                files: [
                    'tasks/**/*.js',
                    'test/**/*.js'
                ],
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
