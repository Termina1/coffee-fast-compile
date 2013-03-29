compiler = require './src/main'

task 'build', ->
  compiler.build './src', './lib'

task 'watch', ->
  compiler.watch './src', './lib', -> console.log 'compiled'