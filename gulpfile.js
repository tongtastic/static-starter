var argv = require('minimist')(process.argv.slice(2));
var gulp = require('gulp');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var del = require('del');
var path = require('path');
var lazypipe = require('lazypipe');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var order = require('gulp-order');
var autoprefixer = require('gulp-autoprefixer');
var rev = require('gulp-rev');
var minifyCss = require('gulp-clean-css');
var sass = require('gulp-sass');
var rename = require("gulp-rename");
var flatten = require('gulp-flatten');
var browserSync = require('browser-sync').create();
var image = require('gulp-image');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var concatCss = require('gulp-concat-css');
var runSequence = require('run-sequence');



var assetRoute = './assets/';

var distRoute = './dist/';

var fontDistRoute = path.join(distRoute, 'fonts');

var imageDistRoute = path.join(distRoute, 'img');

var cssDistRoute = path.join(distRoute, 'css');

var jsDistRoute = path.join(distRoute, 'js');

// CLI options
var enabled = {
  // Enable static asset revisioning when `--production`
  rev: argv.production,
  // Disable source maps when `--production`
  maps: !argv.production,
  // Fail styles task on error when `--production`
  failStyleTask: argv.production,
  // Fail due to JSHint warnings only when `--production`
  failJSHint: argv.production,
  // Strip debug statements from javascript when `--production`
  stripJSDebug: argv.production
};

var isWatching = true;

/**
 * Removes dist folder
 */
gulp.task('clean', function () {
  return del(distRoute);
});


/**
 * Places fonts
 */
gulp.task('fonts', function () {
  return gulp.src(path.join(assetRoute, 'fonts/**/*'))
  .pipe(flatten())
  .pipe(gulp.dest(fontDistRoute))
  .pipe(notify({
      message: '<%= file.relative %> moved'
  }));
});

/**
 * Compresses and moves images
 */
gulp.task('images', function () {
  return gulp.src( [path.join(assetRoute, 'img/**/*.*')] )
  .pipe(image({
    pngquant: true,
    optipng: false,
    zopflipng: true,
    jpegRecompress: false,
    mozjpeg: true,
    guetzli: false,
    gifsicle: true,
    svgo: true,
    concurrent: 10,
    quiet: true // defaults to false
  }))
  .pipe(gulp.dest(imageDistRoute))
  .pipe(browserSync.stream())
  .pipe(notify({
      message:  '<%= file.relative %> optimised & moved'
  }));
});
/**
 * Minifies and combines JS
 *
 * Here you can add / remove bootstrap plugins or other scripts
 */
gulp.task('scripts', function () {
  var merged = [
    'node_modules/jquery/dist/jquery.js',
    'node_modules/modernizr/modernizr.js',
    'node_modules/tether/dist/js/tether.js',
    path.join(assetRoute, 'scripts/**/!(main)*.js'),
    path.join(assetRoute, 'scripts/main.js')
  ];

  return gulp
  .src(merged)
  .pipe(order(merged, {
    base: './'
  }))
  .pipe(gulpif(enabled.maps, sourcemaps.init()))
  .pipe(concat('main.js'))
  .pipe(uglify({
      compress: {
          'drop_debugger': enabled.stripJSDebug
      }
  }))
  .pipe(gulpif(enabled.maps, sourcemaps.write('.')))
  .pipe(gulp.dest(jsDistRoute))
  .pipe(notify({
    message: '<%= file.relative %> built'
  }));
});

/**
 * Checks for JS errors
 */
gulp.task('jshint', function () {
  return gulp.src([
    'gulpfile.js'
  ].concat('lint.js'))
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(notify({
    message: 'JShint ran'
  }))
  .pipe(gulpif(enabled.failJSHint, jshint.reporter('fail')));
});

/**
 * Builds Sass
 */
gulp.task('sass', function () {
  return gulp
  .src('assets/sass/main.scss')
  .pipe(gulpif(!enabled.failStyleTask, plumber()))
  .pipe(gulpif(enabled.maps, sourcemaps.init()))
  .pipe(sass({
    outputStyle: 'nested', // libsass doesn't support expanded yet
    precision: 10,
    includePaths: ['.'],
    errLogToConsole: !enabled.failStyleTask
  }, true))
  .pipe(autoprefixer({
    browsers: [
      'last 2 versions',
      'Safari >= 5',
      'Explorer >= 8',
      'Opera >= 12',
      'iOS >= 5',
      'Android >= 4.1',
      'ChromeAndroid >= 18',
      'ExplorerMobile >= 8'
    ]
  }))
  .pipe(rename(function(path) {
    path.basename = 'main';
    path.dirname = '';
  }))
  .pipe(sourcemaps.write('.', {
    sourceRoot: cssDistRoute
  }))
  .pipe(notify({
    message: '<%= file.relative %> built'
  }))
  .pipe(gulp.dest(cssDistRoute));
});

/**
 * Adds any CSS and compresses the lot
 */
gulp.task('css', function() {
  var merged = [
    // path/to/raw/css
    distRoute + '/css/main.css',
  ];
  return gulp
  .src(merged)
  .pipe(concatCss('main.css', {
    rebaseUrls: false
  }))
  .pipe(minifyCss({
      advanced: false,
      rebase: false
  }))
  .pipe(notify({
      message: '<%= file.relative %> compiled'
  }))
  .pipe(gulp.dest(cssDistRoute));
});

gulp.task('styles', function() {
  return runSequence(
    'sass',
    'css'
  );
});

gulp.task('js', function() {
  return runSequence(
    'scripts',
    'jshint'
  );
});

/**
 * Manifest runner
 */
gulp.task('manifest', function () {
  return gulp
  .src([
    distRoute + '/**/*.css',
    distRoute + '/**/*.js'
  ])
  .pipe(gulpif(enabled.rev, createManifest()))
  .pipe(gulpif(enabled.rev, notify({
      message: '<%= file.relative %> Built'
  })));
});

/**
 * Default task
 *
 * Runs tasks in order
 */
gulp.task('default', function () {
  return runSequence(
    'clean',
    [
      'fonts',
      'styles',
      'js',
      'images',
    ],
    'manifest'
  );
});

/**
 * Watch wrapper, watches for changes
 */
gulp.task('watch', function () {
  isWatching = true;
  gulp.watch([assetRoute + '/scripts/**/*.js'], ['js']);
  gulp.watch([assetRoute + '/fonts/**/*'], ['fonts']);
  gulp.watch([assetRoute + '/img/**/*'], ['images']);
  gulp.watch([assetRoute + '/sass/**/**/**/*.scss'], ['styles']);
});

/**
 * Parses the CSS/JS and generates the manifest
 *
 * @returns {*}
 */
var createManifest = function () {
  return lazypipe()
  .pipe(function () {
    return gulpif(enabled.rev, rev());
  }).pipe(function () {
    return gulp.dest(distRoute);
  })
  .pipe(function () {
    return rev.manifest({
      path: path.join(distRoute, 'assets.json'),
      base: distRoute,
      merge: true
    });
  })
  .pipe(function () {
    return gulp.dest(distRoute);
  })();
};
