const parse = require('url').parse;
const _ = require('lodash');
const assert = require('./assert');
const GrammarError = require("./errors/grammarError.js");
const STRUCTURE_ERROR = 'structure';
const DECLARE_ERROR = 'declaration';
const ARGUMENTS_ERROR = 'arguments';


const SLASH = '/';
const DOT = '.';
const COLON = ':';
const INTEGRATION = 'integration';
const UNIT = 'unit';


function getTitles(tests, filename) {
    let titles = [], urls = [], functions = [], defs = [];
    let i = 0;

    tests.forEach(item => {
        if (assert.isString(item)) {
            if (assert.isUrl(item)) {
                urls[i] = item;
            }
            else {
                if (item.indexOf(DOT) >= 0)
                    throw new Error(`Теста ${item} в ${filename}.js не существует "."`);

                titles[i] = item;
            }
        } else if (assert.isFunction(item)) {
            functions[i] = item;
        }
        else {
            if (!titles[i]) {
                if (urls[i]) titles[i] = urls[i];
                else if (functions[i]) {
                    titles[i] = functions[i].name;
                }
            }
            defs[i] = item;
            i++;
        }
    });

    return [titles, urls, functions, defs];
}


function getTests(testDefs) {
    const [titles, urls, functions, defs] = testDefs;
    const unitTests = [], integrationTests = [];

    for (let i = 0; i < titles.length; i++) {
        let test = {};
        if (_.isPlainObject(defs[i].result)) test = defs[i];
        else {
            return [new GrammarError('result', STRUCTURE_ERROR), unitTests, integrationTests];
        }
        test.title = titles[i];
        if (urls[i]) {
            test.type = INTEGRATION;
            test.originalUrl = urls[i];
            integrationTests.push(test);
        }
        else if (functions[i]) {
            test.type = UNIT;
            test.func = functions[i].toString();
            test.funcName = functions[i].name;
            test.funcCall = functions[i];
            unitTests.push(test);
        } else {
            return [new GrammarError('URL / Function', DECLARE_ERROR), unitTests, integrationTests]
        }
    }
    return [null, unitTests, integrationTests];
}


function getUrls(server, tests) {
    let {protocol, host, port} = server;

    if (!/:$/.test(protocol)) protocol = protocol + COLON;

    if (port) host = host + COLON + port;

    tests.forEach(test => {
        let url = test.originalUrl;

        if (url.startsWith(SLASH)) {
            url = protocol + SLASH + SLASH + host + url;
        }

        const thisUrl = parse(url);

        test.protocol = thisUrl.protocol;
        test.host = thisUrl.host;
        test.api = thisUrl.pathname;
        test.query = thisUrl.query;
    });
    return tests;
}

module.exports = (sourceTests, filename, server) => {
    const titles = getTitles(sourceTests, filename);
    let [error, unitTests, integrationTests] = getTests(titles);
    if (error !== null) return [error, unitTests, integrationTests];
    integrationTests = getUrls(server, integrationTests);
    return [error, unitTests, integrationTests];
};
