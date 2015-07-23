module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        files: {
          'target/js/<%= pkg.name %>.js': ['target/js/templates.js', 'src/scripts/**/*.js'],
          'target/js/vendor.js': ['src/vendor/scripts/**/*.js']
        }
      }
    },
    uglify: {
      my_target: {
        files: {
          'target/js/<%= pkg.name %>.min.js': 'target/js/<%= pkg.name %>.js',
          'target/js/vendor.min.js': 'target/js/vendor.js',
        }
      }
    },
    stylus: {
      compile: {
        files: {
          'target/css/<%= pkg.name %>.css': ['src/**/*.styl'] // compile and concat into single file
        }
      }
    },
    handlebars: {
      compile: {
        options: {
          namespace: 'rummy'
        },
        files: {
          'target/js/templates.js': 'src/templates/rummy.hbs'
        }
      }
    },
    watch: {
      stylus: {
        files: ['src/**/*.styl'],
        tasks: ['stylus']
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['handlebars', 'concat', 'uglify', 'stylus']);

};
