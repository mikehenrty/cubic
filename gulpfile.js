var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('develop', () => {
  nodemon({
    script: 'server/main.js',
    watch: 'server',
  });
});

gulp.task('default', ['develop']);
