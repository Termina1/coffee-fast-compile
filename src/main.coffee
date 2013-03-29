coffee = require 'coffee-script'
p = require 'node-promise'
fs = require 'fs'
mkdirp = require 'mkdirp'
EventEmitter = require('events').EventEmitter
watch = require 'watch-tree'
walk = require 'walk'
through = require 'through'

initThread = (file, promise, pipe) ->
  fs.readFile file, (err, data) ->
    if err
      console.log(err)
    else
      if file.match /\.coffee/
        compiled = coffee.compile(data.toString())
      else
        compiled = data.toString()
      pipe.write code: compiled, file: file
      promise.resolve()

defaultPipe = (output = []) ->
  through (data) ->
    @queue data
    output = [output] if typeof output is 'string'
    output.forEach (dir) ->
      fulldir = "#{dir}/#{data.file.split('/').slice(2, -1).join('/')}"
      fs.stat fulldir, (err, res) ->
        mkdirp.sync fulldir unless res
        fs.writeFile "#{fulldir}/#{data.file.split('/').slice(-1)[0].replace('.coffee', '.js')}", data.code

watchPipe: (dir, callback) ->
  watcher = watch.watchTree dir
  pipe = through()
  watcher.on 'fileModified', (file) =>
    @process pipe, [file], callback
  pipe

module.exports =
  process: (pipe, files, callback) ->
    promises = []
    #pipe.resume()
    for file in files
      promise = new p.Promise
      promises.push promise
      initThread file, promise, pipe

    p.all(promises).then -> 
      callback files if typeof callback is 'function'
      #pipe.pause()

  watch: (dir, output, callback) ->
    pipe = @build dir, output, callback
    watchPipe(dir, callback).pipe pipe

  build: (dir, output, callback) ->
    walker = walk.walk dir
    files = []
    pipe = defaultPipe output
    walker.on 'file', (root, fileStats, next) ->
      files.push "#{root}/#{fileStats.name}"
      do next
    walker.on 'end', => @process pipe, files, callback
    pipe