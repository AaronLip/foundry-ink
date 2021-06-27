'use strict';

const fs = require('fs');

// Fail fast file access insulates the rest of the doc-gen
const module_json = JSON.parse(fs.readFileSync('./src/module.json', 'utf8'));

module.exports = {
    plugins: ['plugins/markdown'],
    recurseDepth: 4,
    source: {
        include: [
            './README.md',
        ],
        includePattern: '.+\\.js(doc|x)?$',
        excludePattern: '((^|\\/|\\\\)_|docs|node_modules/)'
    },
    sourceType: 'module',
    tags: {
        allowUnknownTags: true,
        dictionaries: ['jsdoc', 'closure']
    },
    opts: {
        template: './node_modules/docdash',
        encoding: 'utf8',
        destination: './docs',
        recurse: true,
    },
    templates: {
        default: {
            outputSourceFiles: false,
            useLongnameInNav: true,
            includeDate: false
        }
    },
    docdash: {
        meta: {
            title: module_json.title,
            description: module_json.description,
            keyword: 'ink inkle foundryvtt interactive fiction cyoa story chat'
        },
        sort: true,
        search: true,
        collapse: true,
        typedefs: true,
        menu: {
            'Github': {
                href: module_json.url,
                target: '_blank',
                class: 'menu-item',
                id: 'website_link'
            }
        }
    }
}