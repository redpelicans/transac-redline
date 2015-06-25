var gulp = require('gulp');
var babel = require('gulp-babel');
var changed = require('gulp-changed');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var nodemon = require('gulp-nodemon');
var runSequence = require('run-sequence');
var merge = require('merge-stream');
var path = require('path');
const SRV_SRC = 'src/server';

var serverPaths = {
  src: SRV_SRC + '/**/*.js',
  dist:'dist/server',
  sourceRoot: path.join(__dirname, 'src/server'),
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

gulp.task('build', function () {

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

function reportChange(event){
  console.log('File ' + event.path + ' has ' + event.type );
}

// watch (nodemon) changes within /dist/server and reload node
gulp.task('nodemon', function (cb) {
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
gulp.task('watch',  ['nodemon'], function() { 
  gulp.watch(serverPaths.src, ['build']).on('change', reportChange);
});

gulp.task('default', ['watch']);

