module.exports = function (grunt) {
    var childProcess = require('child_process'),
        path = require('path'),
        when = require('when'),
        phantomjs = require('phantomjs'),
        growl;

    try {
        growl = require('growl');
    } catch (e) {
        growl = Function.prototype;
        grunt.verbose.writeln('Growl not found, `npm install growl` for Growl support'.yellow);
    }

    var getConfigSection = function (cmd) {
        return (grunt.config('buster') || {})[cmd] || {};
    };

    var getArguments = function (cmd) {
        if (cmd === 'phantomjs') {
            var port = getConfigSection('server').port || 1111,
                url = 'http://localhost:' + port + '/capture';
            return [__dirname + '/buster/phantom.js', url];
        }

        var args = [],
            config = getConfigSection(cmd);

        for (var arg in config) {
            var value = config[arg];
            if (value !== false) {
                args.push('--' + arg);
                if (value !== true) {
                    args.push(value);
                }
            }
        }
        return args;
    };

    var shouldRunServer = function () {
        var configFile = getConfigSection('test').config;
        if (!configFile) {
            grunt.verbose.writeln('No buster configuration specified. Looking for buster.js...');

            if (path.existsSync('buster.js')) {
                configFile = 'buster.js';
                grunt.verbose.writeln('Found buster.js');
            } else if (path.existsSync('test/buster.js')) {
                configFile = 'test/buster.js';
                grunt.verbose.writeln('Found test/buster.js');
            } else if (path.existsSync('spec/buster.js')) {
                configFile = 'spec/buster.js';
                grunt.verbose.writeln('Found spec/buster.js');
            }
        }
        var configs = require(path.join(process.cwd(), configFile));

        for (var config in configs) {
            if ((configs[config].environment || configs[config].env) === 'browser') {
                return true;
            }
        }
    };

    var runBusterServer = function () {
        var deferred = when.defer(),
            busterServerPath = path.resolve(__dirname, '../node_modules/.bin/buster-server');

        var server = childProcess.spawn(busterServerPath, getArguments('server'), {
            env: process.env,
            setsid: true
        });

        server.stdout.once('data', function () {
            deferred.resolve(server);
        });

        server.stderr.once('data', function () {
            deferred.reject(server);
        });

        server.stdout.on('data', function (data) {
            process.stdout.write(data);
        });

        server.stderr.on('data', function (data) {
            process.stderr.write(data);
        });

        return deferred.promise;
    };

    var runBusterTest = function () {
        var deferred = when.defer(),
            busterTestPath = path.resolve(__dirname, '../node_modules/.bin/buster-test'),
            output = [];

        var run = childProcess.spawn(busterTestPath, getArguments('test'), {
            env: process.env,
            setsid: true
        });

        run.stdout.on('data', function (data) {
            output.push(data);
            process.stdout.write(data);
        });

        run.stderr.on('data', function (data) {
            process.stderr.write(data);
        });

        run.on('exit', function (code) {
            if (code === 0) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
        });

        return deferred.promise;
    };

    var runPhantomjs = function () {
        var deferred = when.defer();
        var server = childProcess.spawn(phantomjs.path, getArguments('phantomjs'), {
            env: process.env,
            setsid: true
        });

        server.stdout.on('data', function (data) {
            grunt.verbose.writeln(data);
        });

        server.stderr.on('data', function (data) {
            grunt.verbose.writeln(data);
        });

        server.stdout.once('data', function () {
            deferred.resolve(server);
        });

        return deferred.promise;
    };

    grunt.registerTask('buster', 'Run Buster.JS tests.', function () {
        var done = this.async();
        var stop = function (success, server, phantomjs) {
            if (server) {
                server.kill();
                grunt.verbose.writeln('buster-server stopped');
            }
            if (phantomjs) {
                phantomjs.kill();
                grunt.verbose.writeln('phantomjs stopped');
            }
            done(success);
        };

        if (shouldRunServer()) {
            runBusterServer().then(
                function (server) {
                    runPhantomjs().then(
                        function (phantomjs) {
                            runBusterTest().then(
                                function () {
                                    stop(null, server, phantomjs);
                                },
                                function () {
                                    stop(false, server, phantomjs);
                                }
                            );
                        },
                        function (phantomjs) {
                            stop(false, server, phantomjs);
                        }
                    );
                },
                function (server) {
                    stop(false, server);
                }
            );
        } else {
            runBusterTest().then(
                function () {
                    done(null);
                },
                function () {
                    done(false);
                }
            );
        }
    });
};
