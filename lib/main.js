(function() {
  var EventEmitter, coffee, defaultPipe, fs, initThread, mkdirp, p, process, through, walk, watch, watchPipe;

  coffee = require('coffee-script');

  p = require('node-promise');

  fs = require('fs');

  mkdirp = require('mkdirp');

  EventEmitter = require('events').EventEmitter;

  watch = require('watch-tree-maintained');

  walk = require('walk');

  through = require('through');

  initThread = function(file, promise, pipe) {
    return fs.readFile(file, function(err, data) {
      var compiled;

      if (err) {
        return console.log(err);
      } else {
        if (file.match(/\.coffee/)) {
          compiled = coffee.compile(data.toString());
        } else {
          compiled = data.toString();
        }
        pipe.write({
          code: compiled,
          file: file
        });
        return promise.resolve();
      }
    });
  };

  defaultPipe = function(output) {
    if (output == null) {
      output = [];
    }
    return through(function(data) {
      this.queue(data);
      if (data !== 'compiled') {
        if (typeof output === 'string') {
          output = [output];
        }
        return output.forEach(function(dir) {
          var fulldir;

          fulldir = "" + dir + "/" + (data.file.split('/').slice(2, -1).join('/'));
          return fs.stat(fulldir, function(err, res) {
            if (!res) {
              mkdirp.sync(fulldir);
            }
            return fs.writeFile("" + fulldir + "/" + (data.file.split('/').slice(-1)[0].replace('.coffee', '.js')), data.code);
          });
        });
      }
    });
  };

  process = function(pipe, files, callback) {
    var file, promise, promises, _i, _len;

    promises = [];
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      promise = new p.Promise;
      promises.push(promise);
      initThread(file, promise, pipe);
    }
    return p.all(promises).then(function() {
      if (typeof callback === 'function') {
        callback(files);
      }
      return pipe.write('compiled');
    });
  };

  watchPipe = function(dir, callback) {
    var pipe, watcher,
      _this = this;

    watcher = watch.watchTree(dir);
    pipe = through();
    watcher.on('fileModified', function(file) {
      return process(pipe, [file], callback);
    });
    return pipe;
  };

  module.exports = {
    watch: function(dir, output, callback) {
      var pipe;

      pipe = this.build(dir, output, callback);
      return watchPipe(dir, callback).pipe(pipe);
    },
    build: function(dir, output, callback) {
      var files, pipe, walker,
        _this = this;

      walker = walk.walk(dir);
      files = [];
      pipe = defaultPipe(output);
      walker.on('file', function(root, fileStats, next) {
        files.push("" + root + "/" + fileStats.name);
        return next();
      });
      walker.on('end', function() {
        return process(pipe, files, callback);
      });
      return pipe;
    }
  };

}).call(this);
