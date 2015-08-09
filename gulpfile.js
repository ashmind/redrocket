var browserify = require('browserify');
var babelify = require('babelify');
var uglifyify = require('uglifyify');
var watchify = require('watchify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var extend = require('extend');
var g = require('gulp-load-plugins')();

// add custom browserify options here
var opts = extend({}, watchify.args, {
  entries: ['redrocket.js'],
  debug: true
});
var b = watchify(browserify(opts))
    .transform(babelify)
    .transform({ global: true }, uglifyify)
    .on('update', bundle)
    .on('log', g.util.log);

function bundle() {
  return b.bundle()
    .on('error', g.util.log.bind(g.util, 'Browserify Error'))
    .pipe(source('bundle.js'))
    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
       // Add transformation tasks to the pipeline here.
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./dist'));
}

gulp.task('html', function() {
    return gulp.src('*.html')
        .pipe(gulp.dest('./dist'));
});
gulp.task('js', bundle);
gulp.task('less', function() {
    return gulp.src('*.less')
        .pipe(g.lessWatcher('*.less'))
        .pipe(g.less())
        .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['html', 'less', 'js']);