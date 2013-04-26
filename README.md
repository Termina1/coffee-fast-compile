# coffee-fast-compile

There are situations when you start thinking for coffee-script support in you lib/module. But interface provided by
official cooffee-script module is ugly and don't allow you to watch dir inside your script. This module is
built to solve such problems providing simple interface for compiling and watching whole directories built on top nodejs
streams.

## build

It just compiles everything from example dir and outputs code to output dir saving all relatives paths.

```js
compile = require('coffee-fast-compile');
var pipe = compile.build('example', 'output', function(files) {
  console.log(files, ' was compiled');
});

pipe.on('data', function(file) {
  if(file === 'compiled') {
    console.log('compiled');
  } else {
    console.log(file, ' compiled');
  }
});

```

## watch

The same as build, but recompiles changed files on the fly. You also can use ```pipe``` to monitor results. When initially
called, it invokes build, so first compilation can be long. While watching it only compiles changed files.

```js
compile = require('coffee-fast-compile');
var pipe = compile.watch('example', 'output', function(files) {
  console.log(files, ' was compiled');
});
```
