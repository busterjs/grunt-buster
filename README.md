# grunt-buster v0.1.1

[Grunt](https://github.com/cowboy/grunt) plugin for running [Buster.JS](http://busterjs.org/) tests in [Node.js](http://nodejs.org/) or headless in [PhantomJS](http://phantomjs.org/).

<iframe class="github-btn" src="http://markdotto.github.com/github-buttons/github-btn.html?user=thedersen&repo=grunt-buster&type=watch&count=true" allowtransparency="true" frameborder="0" scrolling="0" width="112px" height="20px"></iframe>
<iframe class="github-btn" src="http://markdotto.github.com/github-buttons/github-btn.html?user=thedersen&repo=grunt-buster&type=fork&count=true" allowtransparency="true" frameborder="0" scrolling="0" width="112px" height="20px"></iframe>

## Getting Started

First, you must install buster globally:

    npm install -g buster

Then install the plugin via npm:

    npm install grunt-buster

Finally add this line to your project's `grunt.js` gruntfile at the bottom:

```js
grunt.loadNpmTasks('grunt-buster');
```
Now you can run the buster task with `grunt buster`.

### Browser Tests

If you want to run tests for the browser environment, you also need to [install PhantomJS](https://github.com/cowboy/grunt/blob/master/docs/faq.md#why-does-grunt-complain-that-phantomjs-isnt-installed).

### Configuration

To configure buster, add this to the grunt.initConfig object:

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

This is entierly optional, and buster will use default values if none is specified.

For available options for buster test run:

    buster test --help

For available options for buster server run:

    buster server --help

### Growl

Growl support is optional, but if you would like to use it follow the instructions on how to install it on [this site](https://github.com/visionmedia/node-growl).

## Release notes

#### v0.1.1
* Ensure that tests is not run until PhantomJS finished starting (thanks to [Harrison](https://github.com/Harrison))

#### v0.1.0
* Initial release

## License
http://thedersen.mit-license.org/

(Package and README format heavily borrowed from [grunt-mocha](https://github.com/kmiyashiro/grunt-mocha))