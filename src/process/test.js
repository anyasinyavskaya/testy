const assert = require('./assert');
const AssertionError = require("./errors/assertionError.js");
const GrammarError = require("./errors/grammarError.js");

const urlBuilder = require('./url');
const total = require('./errors/assertionError');
const request = require('request');
const _ = require('lodash');
const { performance } = require('perf_hooks');

const DOT = '.';
const SLASH = '/';
const GET_METHOD = 'get';
const POST_METHOD = 'post';
const OBJECT = 'object';
const ARRAY = 'array';
const JSON = 'json';
const NUMBER = 'number';

const TYPE_ERROR = 'type';
const VALUE_ERROR = 'value';
const SIZE_ERROR = 'size';
const STATUS_ERROR = 'status';
const MAX_ERROR = 'max';
const MIN_ERROR = 'min';
const STRUCTURE_ERROR = 'structure';
const ARGUMENTS_ERROR = 'arguments';

let isResultJson = false;
let allTestsDict = {};
let hostDef = {};

function requestType(api) {
    if (api === SLASH || /\.htm[l]$/.test(api)) {
        return GET_METHOD;
    }
    else {
        return POST_METHOD;
    }
}

// result -- фактический результат

function matchResults(result, status, test) {
    const expect = test.result;
    let valid = true;
    let error = null;
    let testErrors = [];
    let GrammarErrors = [];

    if (expect.status || expect.data) {
        if (expect.status) {
            try {
                valid = _.isEqual(status, expect.status);
                if (!valid) {
                    error = new AssertionError(expect.status, status, STATUS_ERROR, '');
                    testErrors.push(error);
                }

            } catch (e) {
                console.log(e);
                return false;
            }
        }
        if (expect.data) {
            const data = expect.data;
            if (data.type) {
                if (data.type === JSON) {
                    if (isResultJson && assert.checkTypeByType(result, OBJECT)) {
                        [valid, errorsJSON] = assert.checkJSON(data, result);
                        testErrors = testErrors.concat(errorsJSON);
                    }
                } else {
                    valid = assert.checkTypeByType(result, data.type);
                    if (!valid) {
                        error = new AssertionError(data.type, typeof result, TYPE_ERROR, '');
                        testErrors.push(error);
                    }
                }
            }

            if (data.value) {
                try {
                    valid = _.isEqual(result, data.value);
                    if (!valid) {
                        error = new AssertionError(data.value, result, VALUE_ERROR, '');
                        testErrors.push(error);
                    }
                } catch (e) {
                    console.log(e);
                    return false;
                }
            }
            if (data.size) {
                if (assert.checkTypeByType(result, ARRAY)) {
                    valid = _.isEqual(result.length, data.size);
                    if (!valid) {
                        error = new AssertionError(data.size, result.length, SIZE_ERROR, '');
                        testErrors.push(error);
                    }
                }
            }
            if (data.maxValue) {
                if (assert.checkTypeByType(result, NUMBER)) {
                    valid = result <= data.maxValue;
                    if (!valid) {
                        error = new AssertionError(data.maxValue, result, MAX_ERROR, '');
                        testErrors.push(error);
                    }
                }
            }
            if (data.minValue) {
                if (assert.checkTypeByType(result, NUMBER)) {
                    valid = result >= data.minValue;
                    if (!valid) {
                        error = new AssertionError(data.minValue, result, MIN_ERROR, '');
                        testErrors.push(error);
                    }
                }
            }
        }
    } else return [[], [new GrammarError('result: data или result: status', STRUCTURE_ERROR)]];

    return [testErrors, GrammarErrors];
}

function getRes(str) {
    let result = str;

    if (!assert.isStringWithObject(result)) return result;

    try {
        result = JSON.parse(str);
        isResultJson = true;
        return result;
    }
    catch (e) {
        isResultJson = false;
        return str;
    }
}


function parseTest(test) {
    let {protocol, host, method, api, query, params} = test;
    let url, type;
    if (!method) type = requestType(api);
    else type = method.toLowerCase();

    url = urlBuilder.build(protocol, host, api);

    if (type === GET_METHOD) {
        query = params ? urlBuilder.JSONToUrl(params) : query;
        url = urlBuilder.addParams(url, query);
        return [type, {url, jar: true}];
    }
    if (!params) params = query ? urlBuilder.urlToJSON(query) : {};
    return [type, {url, form: params, jar: true}];

}


function getReferencedTest(title, filename) {
    const tests = allTestsDict[filename];
    const index = tests.findIndex(item => item.title === title);
    if (index < 0) throw new Error(`Теста ${title} в ${filename}.js не существует`);
    return tests[index];
}

function titleToUrl(url, type, filename) {
    const ref = getReferencedTest(url, filename);
    const {method, originalUrl, params} = ref;
    if (method) type = method.toLowerCase();
    else type = POST_METHOD;

    if (!params) return [originalUrl, type];
    else url = urlBuilder.addParams(originalUrl.split('?')[0], urlBuilder.JSONToUrl(params));

    return [url, type];
}

function getUrlRes(url, filename) {
    let type = POST_METHOD;

    if (!url.startsWith(SLASH))
        [url, type] = titleToUrl(url, type, filename);
    else {
        const {protocol, host} = hostDef;
        url = urlBuilder.build(protocol, host, url);
    }

    url = encodeURI(url);

    return new Promise(resolve => {
        request[type]({url, jar: true}, (error, response, body) => {
            if (error)
                throw new Error(error);

            const result = getRes(body);
            resolve(result);
        })
    })

}

async function goUrls(urls) {
    if (assert.isString(urls)) {
        await getUrlRes(urls);
    } else {
        for (const url of urls) {
            await getUrlRes(url);
        }
    }
}

module.exports = async (test, filename, testDict) => {
    allTestsDict = testDict;
    const [type, data] = parseTest(test);
    const {before, after, url, protocol, host} = test;
    hostDef = {protocol, host};

    if (before) {
        await goUrls(before);
    }

    return new Promise(resolve => {
        let start = performance.now();
        request[type](data, async (error, response, body) => {
            let end = performance.now();
            let time = end - start;
            let status;
            if (error) {
                return resolve([error, [], [], 0]);
            }
            if (!body) return resolve(false, [], [], 0);

            if (response) status = response.statusCode;

            const result = url ? await getUrlRes(url, filename) : getRes(body);

            if (after) {
                await goUrls(after);
            }
            const [testErrors, GrammarErrors] = matchResults(result, status, test);
            resolve([null, testErrors, GrammarErrors, time]);
        });
    })
};
