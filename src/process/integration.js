const assert = require('./assert');
const AssertionError = require("./errors/assertionError.js");
const GrammarError = require("./errors/grammarError.js");
const TestError = require('./errors/testError');
const variables = require('./variables');

const urlBuilder = require('./url');
const request = require(variables.request);
const _ = require(variables.lodash);
const {performance} = require('perf_hooks');

const DOT = '.';
const SLASH = '/';
const GET_METHOD = 'get';
const POST_METHOD = 'post';
const OBJECT = 'object';
const STRING = 'string';
const ARRAY = 'array';
const _JSON = 'json';
const NUMBER = 'number';

const TYPE_ERROR = 'type';
const VALUE_ERROR = 'value';
const SIZE_ERROR = 'size';
const EACHTYPE_ERROR = 'each_type';
const STATUS_ERROR = 'status';
const MAX_ERROR = 'max';
const MIN_ERROR = 'min';
const STRUCTURE_ERROR = 'structure';
const ARGUMENTS_ERROR = 'arguments';
const TYPEMISMATCH_ERROR = 'mismatch';

let isResultJson = false;
let allTestsDict = {};
let hostDef = {};

// result -- фактический результат

function matchResults(result, status, test) {
    const expect = test.result;
    let valid = true;

    if (expect.status || expect.data) {
        if (expect.status) {
            try {
                valid = _.isEqual(status, expect.status);
                if (!valid) {
                    return [new AssertionError(expect.status, status, STATUS_ERROR, ''), false];
                }

            } catch (e) {
                return [e, false];
            }
        }
        if (expect.data) {
            const data = expect.data;
            if (data.type) {
                if (data.type === _JSON) {
                    if (isResultJson && assert.checkTypeByType(result, OBJECT)) {
                        [valid, errorsJSON] = assert.checkJSON(data, result);
                        if (errorsJSON) return [errorsJSON, false];
                    }
                } else {
                    valid = assert.checkTypeByType(result, data.type);
                    if (!valid) {
                        return [new AssertionError(data.type, typeof result, TYPE_ERROR, ''), false];
                    }
                }
            }

            if (data.value) {
                try {
                    valid = _.isEqual(result, data.value);
                    if (!valid) {
                        return [AssertionError(data.value, result, VALUE_ERROR, ''), false];
                    }
                } catch (e) {
                    return [e, false];
                }
            }

            if (data.eachType) {
                if (assert.isArray(result)) {
                    valid = result.every(x => assert.checkTypeByType(x, data.eachType));
                    if (!valid) {
                        return [new AssertionError(data.eachType, result, EACHTYPE_ERROR, ''), false];
                    }
                } else return [new AssertionError(ARRAY, typeof result, TYPE_ERROR, ''), false];
            }

            if (data.size) {
                if (assert.isArray(result) || assert.isString(result)) {
                    valid = _.isEqual(result.length, data.size);
                    if (!valid) {
                        return [new AssertionError(data.size, result.length, SIZE_ERROR, ''), false];
                    }
                } else return [new AssertionError(ARRAY + " или " + STRING, typeof result, TYPE_ERROR, ''), false];
            }

            if (data.maxValue) {
                if (assert.isNumber(result)) {
                    valid = result <= data.maxValue;
                    if (!valid) {
                        return [new AssertionError(data.maxValue, result, MAX_ERROR, ''), false];
                    }
                } else return [new AssertionError(NUMBER, typeof result, TYPE_ERROR, ''), false];
            }
            if (data.minValue) {
                if (assert.isNumber(result)) {
                    valid = result >= data.minValue;
                    if (!valid) {
                        return [new AssertionError(data.minValue, result, MIN_ERROR, ''), false];
                    }
                } else return [new AssertionError(NUMBER, typeof result, TYPE_ERROR, ''), false];
            }
        }
    } else return [false, [new GrammarError('result: data или result: status', STRUCTURE_ERROR)]];

    return [false, false];
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

function requestType(api) {
    if (api === SLASH || /\.htm[l]$/.test(api)) return GET_METHOD;
    else return POST_METHOD;
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
    let index = tests.findIndex(item => item.title === title);
    if (index < 0) throw new TestError("TestError", `Теста ${title} в ${filename}.js не существует`);
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

async function goUrls(urls, filename) {
    if (assert.isString(urls)) {
        await getUrlRes(urls, filename);
    } else {
        for (const url of urls) {
            await getUrlRes(url, filename);
        }
    }
}

module.exports = async (test, filename, testDict) => {
    allTestsDict = testDict;
    const [type, data] = parseTest(test);
    const {before, after, protocol, host} = test;
    hostDef = {protocol, host};

    if (before) {
        await goUrls(before, filename);
    }

    return new Promise(resolve => {
        let start = performance.now();
        request[type](data, async (error, response, body) => {
            let end = performance.now();
            let time = end - start;
            let status;
            if (error) {
                return resolve([error, false, false, 0]);
            }
            if (!body) return resolve(false, false, false, 0);

            if (response) status = response.statusCode;

            const result = assert.isUrl(test.result) ? await getUrlRes(test.result, filename) : getRes(body);

            if (after) {
                await goUrls(after, filename);
            }
            const [testError, GrammarError] = matchResults(result, status, test);
            resolve([null, testError, GrammarError, time]);
        });
    })
};
