'use strict';

const PATH_JS = __dirname + '/client/js/';
const PATH_LIB = __dirname + '/client/js/lib/';
const PATH_DIST = __dirname + '/client/dist/';

const BOOTSTRAP_FILE = 'bootstrap.js';
const BUNDLE_FILE = 'bundle.js';

var concat = require('concat-files');
var del = require('del');
var ff = require('ff');
var fs = require('fs');
var glob = require('glob');
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var shell = require('gulp-shell');
var mkdirp = require('mkdirp');
var nodemon = require('gulp-nodemon');
var path = require('path');
var sequence = require('run-sequence');

function getFilesWithPath(dir, cb) {
  glob(path.join(dir, '*.js'), cb);
}

gulp.task('clean', () => {
  return del([PATH_DIST]);
});

gulp.task('lint', () => {
  var task = gulp.src(path.join(PATH_JS, '/**/*.js'));
  return task.pipe(jshint()).pipe(jshint.reporter('default'));
});

gulp.task('npm-install', shell.task(['npm install']));

gulp.task('bundle', ['clean', 'lint'], (done) => {
  var f = ff(() => {
    getFilesWithPath(PATH_JS, f());
    getFilesWithPath(PATH_LIB, f());
    mkdirp(PATH_DIST, f());

  }, (jsFiles, libFiles) => {
    concat(libFiles, path.join(PATH_DIST, BOOTSTRAP_FILE), f());
    concat(jsFiles, path.join(PATH_DIST, BUNDLE_FILE), f());
  }).onComplete(done);
});

gulp.task('watch', () => {
  gulp.watch(path.join(PATH_JS + '/**/*.js'), ['bundle']);
  gulp.watch(path.join('package.json'), ['npm-install']);
});

gulp.task('listen', () => {
  nodemon({
    script: 'server/main.js',
    // Use [l] here to workaround nodemon bug #951
    watch: ['server', '[l]ocal_config.json'],
  });
});

gulp.task('develop', (done) => {
  sequence(['npm-install', 'watch', 'bundle'], 'listen', done);
});

gulp.task('default', ['develop']);
