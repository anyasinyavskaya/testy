const assert = require('./assert');
const AssertionError = require("./errors/assertionError.js");
const GrammarError = require("./errors/grammarError.js");
const getFunctionName = require('get-func-name');
const _ = require('lodash');
const {performance} = require('perf_hooks');

const OBJECT = 'object';
const ARRAY = 'array';
const NUMBER = 'number';
const ERROR = 'error';
const JSON = 'json';

const TYPE_ERROR = 'type';
const VALUE_ERROR = 'value';
const SIZE_ERROR = 'size';
const MAX_ERROR = 'max';
const MIN_ERROR = 'min';
const ERROR_ERROR = 'error';
const ERROR_TYPE_ERROR = 'error_type';
const ERROR_MSG_ERROR = 'error_msg';
const STRUCTURE_ERROR = 'structure';
const ARGUMENTS_ERROR = 'arguments';

let isResultJson = false;

function matchResults(result, test) {
    const expect = test.result;
    let valid = true;
    let error = null;
    let errors = [];
    let testErrors = [];
    let GrammarErrors = [];


    if (expect.data) {
        const data = expect.data;

        if (!data.type && !data.value && !data.size && !data.maxValue && !data.minValue && !data.error)
            return [[], [new GrammarError("data: type или data: value или data: size и т.д."), STRUCTURE_ERROR]];

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

        if (data.error) {
            function getType(actual) {
                let type = actual;
                if (actual instanceof Error) {
                    type = getFunctionName(actual.constructor);
                } else if (typeof actual === 'function') {
                    type = getFunctionName(actual);
                    if (type === '') {
                        let newConstructorName = getFunctionName(new actual());
                        type = newConstructorName || type;
                    }
                }
                return type;
            }
            if (!data[ERROR].type && !data[ERROR].msg) return [[], [new GrammarError('error: type или error: msg'), STRUCTURE_ERROR]];

            if (!assert.isError(result)) {
                error = new AssertionError(data[ERROR].type? getType(data[ERROR].type):data[ERROR].msg, result, ERROR_ERROR, '');
                testErrors.push(error);
            }
            else {
                if (data[ERROR].type) {
                    valid = assert.checkErrorType(result, data[ERROR].type);
                    if (!valid) {
                        error = new AssertionError(getType(data[ERROR].type), getType(result), ERROR_TYPE_ERROR, '');
                        testErrors.push(error);
                    }
                }
                if (data[ERROR].msg){
                    valid = assert.checkErrorMsg(result, data[ERROR].msg);
                    if (!valid) {
                        function getMessage(actual) {
                            let msg = '';
                            if (actual && actual.message) {
                                msg = actual.message;
                            } else if (typeof actual === 'string') {
                                msg = actual;
                            }

                            return msg;
                        }
                        error = new AssertionError(data[ERROR].msg, getMessage(result), ERROR_MSG_ERROR, '');
                        testErrors.push(error);
                    }
                }
            }
        }
    } else return [[], [new GrammarError('result: data', STRUCTURE_ERROR)]];
    return [testErrors, GrammarErrors];
}

function parseTest(test) {
    let {func, funcName, funcCall, params} = test;
    let args = [];
    let res;
    let sourceParams = getParams(func);
    if (sourceParams.length > 0) {
        if (params && sourceParams) {
            for (let p in params) {
                let i = sourceParams.indexOf(p);
                if (i >= 0) args[i] = params[p];
                else return [new GrammarError('', ARGUMENTS_ERROR), res, 0];
            }
        } else if (!params && !sourceParams) {

        } else {
            return [new GrammarError('', ARGUMENTS_ERROR), res, 0];
        }
    }
    let start = performance.now();
    try {
        res = funcCall(...args);
    } catch (e) {
        res = e;
    }
    let end = performance.now();
    return [null, res, end - start];
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


function getParams(str) {
    str = str.replace(/\/\*[\s\S]*?\*\//, '')
        .replace(/\/\/(.)*/g, '')
        .replace(/{[\s\S]*}/, '')
        .replace(/=>/g, '')
        .trim();

    let start = str.indexOf("(") + 1;
    let end = str.length - 1;
    let result = str.substring(start, end).split(", ");
    let params = [];

    result.forEach(element => {
        element = element.replace(/=[\s\S]*/g, '').trim();
        if (element.length > 0)
            params.push(element);
    });

    return params;
}


module.exports = async (test, filename, testDict) => {
    let result;
    let [err, body, time] = parseTest(test);
    if (body) result = getRes(body);
    return new Promise(resolve => {
        if (err !== null) resolve([[], [err], 0]);
        else {
            let [testErrors, GrammarErrors] = matchResults(result, test);
            resolve([testErrors, GrammarErrors, time]);
        }
    })
};