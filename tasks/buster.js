String.prototype.toDash = function () {
    return this.replace(/([A-Z])/g, function ($1) {
        return '-' + $1.toLowerCase();
    });
};

module.exports = function (grunt) {
    var childProcess = require('child_process'),
        path = require('path'),
        fs = require('fs'),
        when = require('when'),
        phantomjs = require('phantomjs'),
        globalConfig, getConfigSection, getArguments, shouldRunServer,
        runBusterServer, runBusterTest, runPhantomjs;

    getConfigSection = function (cmd) {
        return globalConfig[cmd] || {};
    };

    getArguments = function (cmd) {
        var args = [],
            config = getConfigSection(cmd),
            port, url, arg, value;

        if (cmd === 'phantomjs') {
            port = getConfigSection('server').port || 1111;
            url = 'http://localhost:' + port + '/capture';

            return [__dirname + '/buster/phantom.js', url];
        }


        for (arg in config) {
            value = config[arg];
            if (value !== false) {
                args.push('--' + arg.toDash());
                if (value !== true) {
                    args.push(value);
                }
            }
        }

        return args;
    };

    shouldRunServer = function () {
        var configFile = getConfigSection('test').config,
            configs, config;

        if (!configFile) {
            grunt.verbose.writeln(
                'No buster configuration specified. Looking for buster.js...'
            );

            if (fs.existsSync('buster.js')) {
                configFile = 'buster.js';
                grunt.verbose.writeln('Found buster.js');
            } else if (fs.existsSync('test/buster.js')) {
                configFile = 'test/buster.js';
                grunt.verbose.writeln('Found test/buster.js');
            } else if (fs.existsSync('spec/buster.js')) {
                configFile = 'spec/buster.js';
                grunt.verbose.writeln('Found spec/buster.js');
            }
        }

        configs = require(path.join(process.cwd(), configFile));

        for (config in configs) {
            if (configs[config].env === 'browser') {
                return true;
            }
        }
    };

    runBusterServer = function () {
        var deferred = when.defer(),
            busterServerPath = path.resolve(
                __dirname, '../node_modules/.bin/buster-server'
            ),
            options = {
                env: process.env,
                setsid: true
            },
            server = childProcess.spawn(
                busterServerPath,
                getArguments('server'),
                options
            );

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

    runBusterTest = function () {
        var deferred = when.defer(),
            busterTestPath = path.resolve(
                __dirname, '../node_modules/.bin/buster-test'
            ),
            output = getConfigSection('options').reportDest,
            run = childProcess.spawn(busterTestPath, getArguments('test'), {
                env: process.env,
                setsid: true
            }),
            xml;

        if (getConfigSection('test').reporter === 'xml') {
            if (!fs.existsSync(path.dirname(output))) {
                fs.mkdirSync(path.dirname(output));
            }

            xml = fs.createWriteStream(output, {'flags': 'w'});
        }

        run.stdout.on('data', function (data) {
            var buffer;

            if (xml) {
                buffer = new Buffer(data);

                return xml.write(buffer.toString());
            }

            return process.stdout.write(data);
        });

        run.stderr.on('data', function (data) {
            process.stderr.write(data);
        });

        run.on('exit', function (code) {
            if (xml) {
                grunt.log.ok('Report written to file.');
            }

            if (code === 0) {
                deferred.resolve();
            } else {
                deferred.reject();
            }
        });

        return deferred.promise;
    };

    runPhantomjs = function () {
        var deferred = when.defer(),
            options = {
                env: process.env,
                setsid: true
            },
            server = childProcess.spawn(
                phantomjs.path,
                getArguments('phantomjs'),
                options
            );

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

    grunt.registerMultiTask('buster', 'Run Buster.JS tests.', function () {
        globalConfig = this.data;

        var done = this.async(),
            stop = function (success, server, phantomjs) {
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
