/*global module:false*/
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      test: {
        options: {
          banner: '/*! <%= pkg.name %> <%= pkg.version %> (dev) <%= grunt.template.today("yyyy-mm-dd") %> */\n',
          mangle: false,
          compress: false,
          beautify: true
        },
        src: 'src/<%= pkg.name %>.js',
        dest: 'test/lib/<%= pkg.name %>.js'
      },
      dist: {
        options: {
          banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        src: 'src/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.<%= pkg.version %>.min.js'
      }
    },
    jshint: {
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        options: {
          globals: {
            "DS": true
          }
        },
        src: ['src/*.js']
      },
      test: {
        options: {
          globals: {
            "test": true,
            "ok": true
          }
        },
        src: ['test/specs/*.js']
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    watch: {
      src: {
        files: 'src/*.js',
        tasks: ['jshint:src', 'uglify:test', 'qunit']
      },
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      specs: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test', 'qunit']
      },
      browserTest: {
        files: 'src/*.js',
        tasks: ['uglify:test']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['jshint', 'uglify:test', 'qunit']);
  grunt.registerTask('dist', ['uglify:dist']);

};
