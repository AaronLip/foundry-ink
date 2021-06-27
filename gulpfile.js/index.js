// Gulp dependencies
const { src, dest, series, parallel, watch } = require('gulp');
const preprocess = require('gulp-preprocess');
const print = require('gulp-print').default;
const stylus = require('gulp-stylus');
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const jsdoc = require('gulp-jsdoc3');

// Library dependencies
const fs = require('fs');
const path = require('path');
const del = require('del');

// File dependencies
const foundryMetadata = require('../src/module.json');

// Config variables
const DEST = 'dist/';

/** Loads a file by passing its relativePath to fs.readFileSync */
function loadFile(relativePath) {
    return fs.readFileSync(path.resolve(__dirname, relativePath), 'utf-8');
}

/** Writes a file by passing its relativePath to fs.writeFileSync */
function saveFile(relativePath, data) {
    return fs.writeFileSync(path.resolve(__dirname, relativePath), data, 'utf-8');
}

/**
 * Generate a preprocessing task that cleans a particular filepath glob.
 */
function cleaner(name, glob) {
    const cleaner = function(cb) {
        const deletedFiles = del.sync(glob, cb());
        for (let file of deletedFiles) {
            console.log(`Deleting ${file}`);
        }
    };
    cleaner.displayName = `${name}Clean`;

    return cleaner;
}

/**
 * Moves files into /dist, where they will be processed further
 */
function makeDirectory() {
    return src('src/**')
    .pipe(dest(DEST));
}

/**
 * Generates a task that moves a subset of files matching glob into /dist
 */
function copier(name, glob) {
    const copier = function() {
        return src(glob)
        .pipe(print(filepath => `Copying file to /dist from ${filepath}`))
        .pipe(dest(DEST));
    }
    copier.displayName = `${name}Copy`;

    return copier;
}

/**
 * Updates NPM Metadata
 */
function npmMetadata(cb) {
    const relativePath = '../package.json';
    var npmMetadata = JSON.parse(loadFile(relativePath));

    // Load metadata from the foundry module and update the node package data.
    const data = Object.assign(npmMetadata, {
        version: foundryMetadata.version,
        description: foundryMetadata.description,
        author: foundryMetadata.author,
        license: foundryMetadata.license
    });

    // Write the updated node package data
    saveFile(relativePath, JSON.stringify(data, null, 4));

    cb();
}

/**
 * Documents the codebase by running jsdoc
 */
function doc(cb) {
    const config = require('./jsdoc.js');

    src('dist/')
    .pipe(jsdoc(config, cb));
}

/**
 * Generate a preprocessing task that inserts foundry manifest metadata.
 * Manifests include system.json or module.json.
 */
function preprocessor(name, extension, relativePath='src/') {
    const preprocessor = function() {
        return src(`${relativePath}**/*.${extension}`)
        .pipe(preprocess({
            context: {
                VERSION: foundryMetadata.version,
                TITLE: foundryMetadata.title,
                NAME: foundryMetadata.name,
                AUTHOR: foundryMetadata.author
            }
        }))
        .pipe(print(filepath => `Preprocessing ${name} file @ ${filepath}`))
        .pipe(dest(DEST, true));
    };
    preprocessor.displayName = `${name}Preprocess`;

    return preprocessor;
}

/**
 * Compile Stylus-lang to CSS
 */
function stylusCompile() {
    return src('dist/**/*.styl')
    .pipe(print(filepath => `Compiling Stylus file ${filepath}`))
    .pipe(stylus())
    .pipe(autoprefixer())
    .pipe(rename((path) => path.extname = ".css"))
    .pipe(dest(DEST, true));
}

/* Javascript file building pipeline */
const javascriptBuild = series(
    npmMetadata,
    cleaner('javascript', ['dist/**/*.js']),
    copier('javascript', ['src/**/*.js']),
    doc);

/* Stylus-lang file building pipeline */
const stylusBuild = series(
    preprocessor('stylus', 'styl'),
    stylusCompile,
    cleaner('stylus', ['dist/**/*.styl']));

/* Building pipelines */
const compile = parallel(
    javascriptBuild,
    stylusBuild);

/* This is the root task */
const root = series(
    cleaner('dist', ['dist/**']),
    copier('dist', ['src/**']),
    compile)
exports.default = function() {
    watch('src/**/*.js', javascriptBuild);
    watch('src/**/*.styl', stylusBuild);
    watch('src/**/*.hbs', series(
        cleaner('handlebarsTemplate', ['dist/**/*.hbs']),
        copier('handlebarsTemplate', ['src/**/*.hbs'])
        ));
    watch([
            'src/**',
            '!src/**/*.js',
            '!src/**/*.styl',
            '!src/**/*.hbs'
        ],
        root);
}