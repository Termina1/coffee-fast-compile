(function() {
  var EventEmitter, coffee, fs, initThread, mkdirp, p, walk, watch;

  coffee = require('coffee-script');

  p = require('node-promise');

  fs = require('fs');

  mkdirp = require('mkdirp');

  EventEmitter = require('events').EventEmitter;

  watch = require('watch-tree');

  walk = require('walk');

  initThread = function(file, promise, output) {
    return fs.readFile(file, function(err, data) {
      var compiled, emitter;

      if (err) {
        return console.log(err);
      } else {
        if (file.match(/\.coffee/)) {
          compiled = coffee.compile(data.toString());
        } else {
          compiled = data.toString();
        }
        emitter = new EventEmitter;
        emitter.once('wrote', function() {
          return promise.resolve();
        });
        if (typeof output === 'string') {
          output = [output];
        }
        return output.forEach(function(dir) {
          var fulldir;

          fulldir = "" + dir + "/" + (file.split('/').slice(2, -1).join('/'));
          return fs.stat(fulldir, function(err, res) {
            if (!res) {
              mkdirp.sync(fulldir);
            }
            return fs.writeFile("" + fulldir + "/" + (file.split('/').slice(-1)[0].replace('.coffee', '.js')), compiled, function(err) {
              return emitter.emit('wrote');
            });
          });
        });
      }
    });
  };

  module.exports = {
    process: function(output, files, callback) {
      var file, promise, promises, _i, _len;

      promises = [];
      for (_i = 0, _len = files.length; _i < _len; _i++) {
        file = files[_i];
        promise = new p.Promise;
        promises.push(promise);
        initThread(file, promise, output);
      }
      return p.all(promises).then(function() {
        if (typeof callback === 'function') {
          return callback(files);
        }
      });
    },
    watch: function(dir, output, callback) {
      var watcher,
        _this = this;

      watcher = watch.watchTree(dir);
      return this.build(dir, output, function() {
        return watcher.on('fileModified', function(file) {
          return _this.process(output, [file], callback);
        });
      });
    },
    build: function(dir, output, callback) {
      var files, walker,
        _this = this;

      walker = walk.walk('./src');
      files = [];
      walker.on('file', function(root, fileStats, next) {
        files.push("" + root + "/" + fileStats.name);
        return next();
      });
      return walker.on('end', function() {
        return _this.process(output, files, callback);
      });
    }
  };

}).call(this);
