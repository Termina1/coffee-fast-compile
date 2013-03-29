compiler = require './src/main'
through = require 'through'
task 'build', ->
  compiler.build './src', './lib'

task 'watch', ->
  compiler.watch './src', './lib', -> console.log 'compiled'

task 'pipe', ->
  compiler.watch('./src').pipe(through (data) -> console.log data);