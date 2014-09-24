# grunt-buster [![Build Status](https://travis-ci.org/busterjs/grunt-buster.png?branch=master)](https://travis-ci.org/busterjs/grunt-buster)

> [Grunt](http://gruntjs.com/) task for running
> [Buster.JS](http://busterjs.org/) tests in [Node.js](http://nodejs.org/) or
> headless in [PhantomJS](http://phantomjs.org/)


## Getting started

This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out
the [Getting started](http://gruntjs.com/getting-started) guide, as it explains
how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins. Once you're familiar with that process, you may
install this plugin with this command:

``` shell
npm install grunt-buster
```

Once the plugin has been installed, it may be enabled inside your Gruntfile
with this line of JavaScript:

``` js
grunt.loadNpmTasks('grunt-buster');
```

Then, you must install Buster.JS:

``` shell
npm install buster
```

### Browser tests

If you want to run tests for the browser environment, you also need to [install
PhantomJS](http://phantomjs.org/):

``` shell
npm install phantomjs
```


## The "buster" task

### Overview

In your project's Gruntfile, add a section named `buster` to the data object
passed into `grunt.initConfig()`. You then need to define at least one target
for `grunt buster` to have any effect.

Example of a minimal working configuration:

``` js
buster: {
  foo: {}
}
```

The `buster` object can have an arbitrary number of targets, like `foo` in the
above example. If you run `grunt buster`, all targets are executed. If you run
`grunt buster:foo`, only the `foo` target is executed.

### Options

No options are needed to get started, as grunt-buster will use default values
if none is specified.

#### test

An object with options passed as command line arguments to `buster test`. For
available options for `buster test` run:

``` shell
buster test --help
```

#### server

An object with options passed as command line arguments to `buster server`. For
available options for `buster server` run:

``` shell
buster server --help
```

#### options.growl

Growl support is optional. If you would like to use it follow the instructions
on [how to install node-growl](https://github.com/visionmedia/node-growl), then
enable Growl notifications in the `buster` task in your Gruntfile.

Example:

``` js
buster: {
  options: {
    growl: true
  }
}
```

You should now get notifications whenever your test suite passes or fails.

### Examples

``` js
buster: {
  foo: {
    test: {
      config: 'path/to/my/buster.js'
    },
    server: {
      port: 1111
    }
  },
  bar: {
    options: {
      growl: false
    }
  },
  options: {
    growl: true
  }
}
```

The above config will for the `foo` target run `buster test` with the
argument `--config path/to/my/buster.js`, and run `buster server` with the
argument `--port 1111`, with Growl notifications when the tests complete.

For the `bar` target, default configuration will be used, and Growl
notifications will be turned off.

## Running servers, tests and PhantomJS separately

It is possible to start one or more Buster.JS servers, PhantomJS instances or
individual Buster.JS test runs by passing Grunt arguments when invoking tasks.

Grunt allows for command line arguments to be passed to multitasks, like so:
`grunt task:subtask:argument1:argument2`. To pass arguments to, and execute all
subtasks of a multitask, skip the subtask name: `grunt task::argument`. In
`grunt-buster`, we use that to gain more granular control over which Buster.JS
components are executed, as described below in this section.

#### Start all configured Buster.JS servers

```
grunt buster::server
```

This starts all configured Buster.JS servers, without starting a Phantom.JS
instance nor running any tests.

Note: Grunt will not block the `server` and `phantomjs` tasks by default. They
are intended to be used in combination with blocking tasks like
`grunt-contrib-watch`. If you do not want to run either of the two in
combination with a watch command, you can supply the `block` argument:

```
grunt buster::server:block
```

#### Start instances of PhantomJS

```
grunt buster::phantomjs
```

This allows you to capture browsers manually before executing the tests
separately (see below).

#### Run tests

Execute the tests only and not spawn neither a Buster.JS server nor PhantomJS,
as they are assumed to be started manually in some other way.

```
grunt buster::test
```

## Development

If you wish to contribute, please ensure a green test suite.

Install development dependencies:

```
npm install
```

Running the test suite:

```
npm test
```

Starting a watch loop listening to file changes and running the test suite:

```
npm start
```

#### Making releases

* Update the `Release history`
* Update the `package.json` version number
* Tag the release commit with correct version number
* Push new release to `npm`: `npm publish`


## Release history

#### v0.3.2 (2014-09-24)

* Use `resolve-bin` to find `buster` and `phantomjs` executables
* Add `buster` as a peer dependency
* Clean escape characters in Growl

#### v0.3.1 (2013-11-07)

* Fix issue where failing tests make grunt-buster hang

#### v0.3.0 (2013-10-31)

* Fix #9 - Allow for more granular control over `buster-server`, `PhantomJS`
  and `buster-test` execution
* Only log buster-server output if Grunt is run with `verbose`

#### v0.2.1 (2013-05-13)

* Fix broken URLs in package description

#### v0.2.0 (2013-05-13)

* Updated project URLs after move to busterjs organization on GitHub
* Require Node.js >= 0.8.0
* Fix `path.existsSync` deprecation warning
* Declare a peer dependency on Grunt ~0.4.0
* Made Growl notifications optional. You must now install the `growl` package
  from npm and set `options.growl` to `true` to get notifications.
* Added support for Grunt multi-tasks. You must now define at least one target
  for the `buster` task to have any work to do. See the above docs for a
  minimal config example. (Thanks to Richard Nespithal)
* Add `--server` option to `buster-test`
  (Thanks to [Andreas Köberle](https://github.com/eskimoblood))
* Add support for locally installed versions of Buster.JS and PhantomJS
  (Thanks to [Stein Martin Hustad](https://github.com/smh))

#### v0.1.2 (2012-10-03)

* Looks for buster.js in test/ and spec/ in addition to the root folder
* Fixed corrupt error.png and ok.png (Thanks to [Paweł Maciejewski](https://github.com/fragphace))
* Removed console non-printable characters from growl text message (Thanks to
  [Paweł Maciejewski](https://github.com/fragphace))

#### v0.1.1 (2012-07-29)

* Ensure that tests is not run until PhantomJS finished starting (thanks to
  [Harrison](https://github.com/Harrison))

#### v0.1.0 (2012-07-24)

* Initial release
