String.prototype.toDash = function(){
    return this.replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
};

module.exports = function (grunt) {
    var childProcess = require('child_process'),
        path = require('path'),
        fs = require('fs'),
        when = require('when'),
        phantomjs = require('phantomjs'),
        globalConfig;

    try {
        growl = require('growl');
    } catch (e) {
        growl = Function.prototype;
        grunt.verbose.writeln('Growl not found, `npm install growl` for Growl support'.yellow);
    }

    var getConfigSection = function (cmd) {
        return globalConfig[cmd] || {};
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
                args.push('--' + arg.toDash());
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
            output = getConfigSection('options').reportDest,
            xml;

        var run = childProcess.spawn(busterTestPath, getArguments('test'), {
            env: process.env,
            setsid: true
        });

        if (getConfigSection('test').reporter === 'xml') {
            if (!fs.existsSync(output)) {
                fs.mkdirSync(path.dirname(output));
            }

            xml = fs.createWriteStream(output, {'flags': 'a'});
        }

        run.stdout.on('data', function (data) {
            if (xml) {
                var buffer = new Buffer(data);

                return xml.write(buffer.toString());
            }

            return process.stdout.write(data);
        });

        run.stderr.on('data', function (data) {
            process.stderr.write(data);
        });

        run.on('exit', function (code) {
            if (xml) {
                grunt.log.ok('Report written to file.')
            }
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

    grunt.registerMultiTask('buster', 'Run Buster.JS tests.', function () {
        globalConfig = this.data;

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
