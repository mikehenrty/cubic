'use strict';

const APP_NAME = 'cubic';

const PATH_JS = __dirname + '/client/js/';
const PATH_LIB = __dirname + '/client/js/lib/';
const PATH_DIST = __dirname + '/client/dist/';

const BOOTSTRAP_FILE = 'bootstrap.js';
const BUNDLE_FILE = 'bundle.js';
const CONFIG_FILE = 'local_config.json';

var concat = require('concat-files');
var del = require('del');
var ff = require('ff');
var fs = require('fs');
var glob = require('glob');
var gulp = require('gulp');
var pm2 = require('pm2');
var jshint = require('gulp-jshint');
var jsonfile = require('jsonfile');
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
  var bootstrap_file = path.join(PATH_DIST, BOOTSTRAP_FILE);
  var bundle_file = path.join(PATH_DIST, BUNDLE_FILE);

  var f = ff(() => {
    getFilesWithPath(PATH_JS, f());
    getFilesWithPath(PATH_LIB, f());
    mkdirp(PATH_DIST, f());

  }, (jsFiles, libFiles) => {
    jsonfile.readFile(CONFIG_FILE, f());
    concat(libFiles, bootstrap_file, f());
    concat(jsFiles, bundle_file, f());
  }, (config) => {

    // Merge local config values with client CONST.
    var config_str = `CONST.override(${JSON.stringify(config)})`;
    fs.appendFile(bootstrap_file, config_str, f());
  }).onComplete(done);
});

gulp.task('watch', () => {
  gulp.watch([CONFIG_FILE, PATH_JS + '/**/*.js'], ['bundle']);
  gulp.watch('package.json', ['npm-install']);
});

gulp.task('db-start', shell.task(['systemctl start mongodb.service']));

gulp.task('db-create', done => {
  var createDB = require('./server/create_db');
  createDB(err => {
    if (err) {
      console.error('unable to create database', err);
    } else {
      console.log('database created');
    }
    done();
  });
});

gulp.task('listen', () => {
  nodemon({
    script: 'server/main.js',
    // Use [l] here to workaround nodemon bug #951
    watch: ['server', '[l]ocal_config.json'],
  });
});

gulp.task('develop', (done) => {
  sequence('npm-install', ['watch', 'bundle', 'db-start'], 'listen', done);
});

gulp.task('prod', ['npm-install', 'bundle'], (done) => {
  var f = ff(() => {
    pm2.connect(true, f.wait());
  }, () => {
    jsonfile.readFile(CONFIG_FILE, f());
    pm2.stop(APP_NAME, f.waitPlain());
  }, (config) => {
    pm2.start({
      name: APP_NAME,
      script: "server/main.js",
      output: config.logfile,
      error: config.logfile,
    }, f());
  }).onComplete((err) => {
    err && console.log('prod error', err);
    pm2.disconnect();
    done();
  });
});

gulp.task('default', ['develop']);
