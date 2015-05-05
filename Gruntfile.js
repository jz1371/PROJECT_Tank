module.exports = function(grunt) {

  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        eqnull: true,
        browser: true,
        strict: true,
        undef: true,
        unused: true,
        bitwise: true,
        forin: true,
        freeze: true,
        latedef: true,
        noarg: true,
        nocomma: true,
        nonbsp: true,
        nonew: true,
        notypeof: true,
        jasmine: true,
        globals: {
          handleDragEvent: false,
          module: false, require: false, // for Gruntfile.js
          angular: false,
          console: false,
        },
      },
      all: ['src/*.js', 'realTimeService.js']
    },
      concat: {
          options: {
              separator: ';',
          },
          dist: {
              // Order is important! gameLogic.js must be first because it defines myApp angular module.
              src: ['src/index.js', 'src/config.js', 'src/draw.js', 'src/levels.js'],
              dest: 'dist/tank.js',
          },
      },
    uglify: {
      options: {
        sourceMap: true,
      },
      my_target: {
        files: {
          'dist/tank.min.js': ['dist/tank.js']
        }
      }
    },
    processhtml: {
      dist: {
        files: {
          'index.min.html': ['index.html']
        }
      }
    },
    manifest: {
      generate: {
        options: {
          basePath: '.',
          cache: [
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.8/angular.min.js',
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.8/angular-touch.min.js',
            'http://cdnjs.cloudflare.com/ajax/libs/angular-ui-bootstrap/0.12.1/ui-bootstrap-tpls.min.js',
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css',
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/fonts/glyphicons-halflings-regular.woff',
            'http://maxcdn.bootstrapcdn.com/bootstrap/3.3.1/fonts/glyphicons-halflings-regular.ttf',
            'http://cdnjs.cloudflare.com/ajax/libs/seedrandom/2.3.11/seedrandom.min.js',
            'http://yoav-zibin.github.io/emulator/dist/realTimeServices.2.min.js',
            'dist/tank.min.js',
            'lib/fpsmeter.min.js',
            'imgs/help1.png',
            'imgs/help2.png',
            'http://yoav-zibin.github.io/emulator/main.css'
          ],
          network: [
            'languages/en.js',
            'languages/zh.js',
            'dist/tank.min.js.map',
            'dist/tank.js'
          ],
          timestamp: true
        },
        dest: 'index.appcache',
        src: []
      }
    },
    'http-server': {
        'dev': {
            // the server root directory
            root: '.',
            port: 9000,
            host: "0.0.0.0",
            cache: 1,
            showDir : true,
            autoIndex: true,
            // server default file extension
            ext: "html",
            // run in parallel with other tasks
            runInBackground: true
        }
    },
  });

  require('load-grunt-tasks')(grunt);

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'processhtml', 'manifest']);

};
