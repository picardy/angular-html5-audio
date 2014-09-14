module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
      }
    },
    connect: {
      server: {
        options: {
          port: 8016,
          hostname: '*',
        },
      },
    },
    concat: {
      options: {
        sourceMap: true,
        banner: grunt.file.read('lib/umdwrapper.start'),
        footer: grunt.file.read('lib/umdwrapper.end'),
        separator: '\n',
        process: function (src, filepath) {
          var spaces = '  ';
          return '\n' +
            spaces + '// filepath: ' + filepath + '\n' +
            spaces + src.replace(/[\n]/g, '\n' + spaces);
        },
      },
      dist: {
        src: ['src/*.js'],
        dest: 'dist/angular-html5-audio.js',
      },
    },
    open: {
      dev: {
        path: 'http://0.0.0.0:8016/demo',
        app: 'Google Chrome'
      },
    },
    watch: {
      scripts: {
        files: ['src/**/*.js', 'lib/umdwrapper*'],
        tasks: ['concat:dist'],
      },
    },
    uglify: {
      options: {
        sourceMap: true,
      },
      dist: {
        files: {
          'dist/angular-html5-audio.min.js': ['dist/angular-html5-audio.js'],
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('dist', ['concat:dist', 'uglify:dist']);
  grunt.registerTask('server', ['dist', 'connect:server', 'open:dev', 'watch']);
  grunt.registerTask('release', ['dist', 'bump']);
};