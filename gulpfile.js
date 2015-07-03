var gulp = require('gulp');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var babel = require('gulp-babel');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var nodemon = require('gulp-nodemon');
var runSequence = require('run-sequence');
var merge = require('merge-stream');
var browserSync = require('browser-sync');
var path = require('path');
const SRV_SRC = 'server/src';

var serverPaths = {
  src: SRV_SRC + '/**/*.js',
  dist:'server/dist',
  sourceRoot: path.join(__dirname, 'server/src'),
};

var clientPaths = {
  source:'public/app/src/**/*.js',
  html:'public/app/src/**/*.html',
  style:'public/app/styles/**/*.css',
  dist:'public/app/dist/',
  doc:'public/app/doc'
};


// need this options to use decorators
var compilerOptions = {
  stage: 0,
  optional: [
    "es7.decorators",
    "regenerator",
    "asyncToGenerator",
    "es7.classProperties",
    "es7.asyncFunctions"
  ]
};

gulp.task('build-server', function () {
  // tanspile from src to dist
  var build =  gulp.src(serverPaths.src)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(changed(serverPaths.dist, {extension: '.js'}))
    .pipe(babel(compilerOptions))
    .pipe(sourcemaps.write('.', { sourceRoot: serverPaths.sourceRoot}))
    .pipe(gulp.dest(serverPaths.dist));

  // package.json is read by main.js, so we need it at root level: /dist/server
  var copy = gulp.src('package.json')
    .pipe(gulp.dest(serverPaths.dist));

  return merge.apply(null, [copy, build]);
});

gulp.task('build-client', function () {
  return gulp.src(clientPaths.source)
    .pipe(plumber())
    .pipe(changed(clientPaths.dist, {extension: '.js'}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(babel(compilerOptions))
    .pipe(sourcemaps.write('.', { includeContent: true, sourceRoot: clientPaths.sourceRoot}))
    .pipe(gulp.dest(clientPaths.dist));
});

gulp.task('build-html', function () {
  return gulp.src(clientPaths.html)
    .pipe(changed(clientPaths.dist, {extension: '.html'}))
    .pipe(gulp.dest(clientPaths.dist));
});

function reportChange(event){
  console.log('File ' + event.path + ' has been ' + event.type );
}

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    ['build-server', 'build-client', 'build-html'],
    callback
  );
});

gulp.task('clean', function() {
 return gulp.src([clientPaths.dist, serverPaths.dist])
    .pipe(vinylPaths(del));
});


gulp.task('browser-sync', ['build', 'nodemon'], function() {
  browserSync.init({
    files: ['public/**/*.*'],
    proxy: 'http://localhost:3005',
    port: 3004,
  });
});


// watch (nodemon) changes within /dist/server and reload node
gulp.task('nodemon', ['build'], function (cb) {
  var called = false;
  return nodemon({
      script: path.join(serverPaths.dist, '/main.js')
    , ext: 'js json'
    , verbose: true
    , watch: serverPaths.dist
    , ignore: ['*.swp',  "*.map" ]
    , env: {
      'DEBUG': 'transac:*'
    }
  })
  .on('start', function () {
    if(!called)cb();
    called = true;
  })
  //.on('restart', function (files) { console.log('server restarted ...') })
});

// watch changes within paths.src and transpile them to dist (see build)
// watch (nodemon) changes within /dist/server and reload node
gulp.task('watch',  ['nodemon', 'browser-sync'], function() { 
  gulp.watch(serverPaths.src, ['build-server']).on('change', reportChange);
  gulp.watch(clientPaths.source, ['build-client', browserSync.reload]).on('change', reportChange);
  gulp.watch(clientPaths.html, ['build-html', browserSync.reload]).on('change', reportChange);
  gulp.watch(clientPaths.style, browserSync.reload).on('change', reportChange);
});

gulp.task('default', ['watch']);

