import gulp from 'gulp';
import gulpSourcemaps from 'gulp-sourcemaps';
import gulpTs from 'gulp-typescript';
import gulpSass from 'gulp-sass';
import * as dartSass from 'sass';
import {deleteSync} from 'del';

const srcDir = 'src';
const outDir = 'dist';

const tsProject = gulpTs.createProject('tsconfig.json');

const sass = gulpSass(dartSass);

const globsStyles = [`${srcDir}/**/*.scss`];

// Statics = all files other than ".ts" and ".scss", which are compiled separately
const globsStatics = [`${srcDir}/**/*`, `!${srcDir}/**/*.ts`, `!${srcDir}/**/*.scss`];

// See: https://www.npmjs.com/package/del
function clean(cb) {
    deleteSync([`${outDir}/**`]);
    cb();
}

// See: https://www.npmjs.com/package/gulp-typescript
//      https://www.typescriptlang.org/docs/handbook/gulp.html
//      https://github.com/gulp-sourcemaps/gulp-sourcemaps
function buildTs() {
    console.log(`--- [buildTs]`);
    return tsProject.src()
        .pipe(gulpSourcemaps.init())
        .pipe(tsProject())
        .on('error', function (err) {
            console.error('---> [buildTs] error:', err.message);
            this.emit('end'); // Prevent the watch task from stopping
        })
        .pipe(gulpSourcemaps.write('./_sourcemaps'))
        .pipe(gulp.dest(`${outDir}/`));
}

function watchTs() {
    // NOTE: "tsProject.config.include" ignores "files" and "exclude" from "tsconfig.json"
    gulp.watch(tsProject.config.include, {ignoreInitial: false}, function(cb) {
        buildTs();
        cb();
    });
}

// See: https://www.npmjs.com/package/gulp-sass
function buildStyles() {
    console.log(`--- [buildStyles]`);
    return gulp.src(globsStyles)
        // .pipe(sass().on('error', sass.logError)) // async rendering
        .pipe(sass.sync().on('error', sass.logError)) // sync rendering, faster than async
        .pipe(gulp.dest(`${outDir}/`));
}

function watchStyles() {
    gulp.watch(globsStyles, {ignoreInitial: false}, function(cb) {
        buildStyles();
        cb();
    });
}

function copyStatics() {
    console.log(`--- [copyStatics]`);
    // Disable encoding, to avoid corrupting images during this process
    return gulp.src(globsStatics, {encoding: false})
        .pipe(gulp.dest(`${outDir}/`));
}

function watchStatics() {
    gulp.watch(globsStatics, {ignoreInitial: false}, function(cb) {
        copyStatics();
        cb();
    });
}

const build = gulp.series(
    clean,
    gulp.parallel(
        buildTs,
        buildStyles,
        copyStatics,
    )
);

const watch = gulp.series(
    clean,
    gulp.parallel(
        watchTs,
        watchStyles,
        watchStatics,
    )
);

export {
    build,
    watch,
}
