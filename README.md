# grunt-buster

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
npm install grunt-buster --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile
with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-buster');
```

Then, you must install Buster.JS globally:

``` shell
npm install -g buster
```

### Browser tests

If you want to run tests for the browser environment, you also need to [install
PhantomJS](http://phantomjs.org/).

### Growl notifications

Growl support is optional, but if you would like to use it follow the
instructions on how to install it on
[this site](https://github.com/visionmedia/node-growl).


## The "buster" task

### Overview

In your project's Gruntfile, add a section named `buster` to the data object
passed into `grunt.initConfig()`:

```js
buster: {
  test: {
    config: 'path/to/my/buster.js'
  },
  server: {
    port: 1111
  }
}
```

### Options

This is entierly optional, as grunt-buster will use default values if none is
specified.

For available options for `buster test` run:

``` shell
buster test --help
```

For available options for `buster server` run:

``` shell
buster server --help
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


## Release history

#### v0.2.0 (UNRELEASED)
* Updated project URLs
* Require Node.js >= 0.8.0
* Fix `path.existsSync` deprecation warning
* Declare a peer dependency on Grunt ~0.4.0

#### v0.1.2
* Looks for buster.js in test/ and spec/ in addition to the root folder
* Fixed corrupt error.png and ok.png (Thanks to [Paweł Maciejewski](https://github.com/fragphace))
* Removed console non-printable characters from growl text message (Thanks to [Paweł Maciejewski](https://github.com/fragphace))

#### v0.1.1
* Ensure that tests is not run until PhantomJS finished starting (thanks to [Harrison](https://github.com/Harrison))

#### v0.1.0
* Initial release
