coffee = require 'coffee-script'
p = require 'node-promise'
fs = require 'fs'
mkdirp = require 'mkdirp'
EventEmitter = require('events').EventEmitter
watch = require 'watch-tree'
walk = require 'walk'

initThread = (file, promise, output) ->
  fs.readFile file, (err, data) ->
    if err
      console.log(err)
    else
      if file.match /\.coffee/
        compiled = coffee.compile(data.toString())
      else
        compiled = data.toString()
      emitter = new EventEmitter
      emitter.once 'wrote', -> do promise.resolve
      output = [output] if typeof output is 'string'
      output.forEach (dir) ->
        fulldir = "#{dir}/#{file.split('/').slice(2, -1).join('/')}"
        fs.stat fulldir, (err, res) ->
          mkdirp.sync fulldir unless res
          fs.writeFile "#{fulldir}/#{file.split('/').slice(-1)[0].replace('.coffee', '.js')}", compiled, (err) ->
            emitter.emit 'wrote'

module.exports =
  process: (output, files, callback) ->
    promises = []
    for file in files
      promise = new p.Promise
      promises.push promise
      initThread file, promise, output

    p.all(promises).then -> 
      callback files if typeof callback is 'function'

  watch: (dir, output, callback) ->
    watcher = watch.watchTree dir
    @build dir, output, =>
      watcher.on 'fileModified', (file) =>
        @process output, [file], callback

  build: (dir, output, callback) ->
    walker = walk.walk './src'
    files = []
    walker.on 'file', (root, fileStats, next) ->
      files.push "#{root}/#{fileStats.name}"
      do next
    walker.on 'end', => @process output, files, callback