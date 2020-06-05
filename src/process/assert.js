const AssertionError = require("./errors/assertionError.js");
const _ = require('lodash');

const STRING_TYPE = 'string';
const NUMBER_TYPE = 'number';
const BOOL_TYPE = 'boolean';
const ARRAY_TYPE = 'array';
const OBJECT_TYPE = 'object';
const NULL_TYPE = 'null';
const ERROR_ERROR = 'error';
const FUNCTION_TYPE = 'function';

const TYPE_ERROR = 'type';
const VALUE_ERROR = 'value';
const SIZE_ERROR = 'size';
const STATUS_ERROR = 'status';
const STRUCTURE_ERROR = 'structure';
const MAX_ERROR = 'max';
const MIN_ERROR = 'min';


function isNumber(actual) {
	return !!actual && (typeof actual).toLowerCase() === NUMBER_TYPE;
}

function isString(actual) {
	return !!actual && (typeof actual).toLowerCase() === STRING_TYPE;
}

function isArray(actual) {
	return !!actual && (actual.constructor === Array ||
		Object.prototype.toString.call(actual) === '[object Array]');
}


function isError(obj){
    return Object.prototype.toString.call(obj) === "[object Error]";
}

function isUrl(str) {
	return isString(str) && (str.startsWith('/') || /^http(s):\/\//.test(str));
}

function isFunction(actual) {
    return !!actual && typeof actual === FUNCTION_TYPE;
}

function isStringWithObject(str) {
	return /[[{]/.test(str);
}

function checkTypeByType(actual, expectType) {
	let actualType = typeof actual;
	actualType = actualType.toLowerCase();
	expectType = expectType.toLowerCase();
	let isEqual = false;
	switch (expectType) {
		case STRING_TYPE: {
			isEqual = isString(actual);
			break;
		}
		case NUMBER_TYPE: {
			isEqual = isNumber(actual);
			break;
		}
		case ARRAY_TYPE: {
			isEqual = isArray(actual);
			break;
		}
        case BOOL_TYPE: {
            isEqual = !!actual && actualType === BOOL_TYPE;
            break;
        }
		case OBJECT_TYPE: {
			isEqual = !!actual && actual.constructor === Object;
			break;
		}
		case NULL_TYPE: {
			isEqual = actual === null;
			break;
		}

	}
	return isEqual;
}

function checkParams(actual, property, propertyValue) {
	//let errors = [];
	let valid = true;
	// проверка значения
	if (propertyValue.value) {
		valid = _.isEqual(propertyValue.value, actual[property]);
		if (!valid) {
			return [valid, new AssertionError(propertyValue.value, actual[property], VALUE_ERROR, property)];
		}
	}
	// проверка типа
	if (propertyValue.type) {
		valid = checkTypeByType(actual[property], propertyValue.type);
		if (!valid) {
			return [valid, (new AssertionError(propertyValue.type, typeof actual[property],
				TYPE_ERROR, property))];
		}
	}
	// проверка диапазона
	if (isNumber(actual[property])) {
		if (propertyValue.maxValue) {
			valid = (actual[property] <= propertyValue.maxValue);
			if (!valid) {
				return [valid, (new AssertionError(propertyValue.maxValue, actual[property],
					MAX_ERROR, property))];
			}
		}
		if (propertyValue.minValue) {
			valid = (actual[property] >= propertyValue.minValue);
			if (!valid) return [valid, (new AssertionError(propertyValue.minValue, actual[property],
				MIN_ERROR, property))]
		}
	}

	// проверка размера массива
	if (isArray(actual[property])){
		if (propertyValue.size) {
			valid = _.isEqual(actual[property].length, propertyValue.size);
			if (!valid) {
				return [valid, (new AssertionError(propertyValue.size, actual[property].length,
					SIZE_ERROR, property))];
			}
		}
	}
	return [valid, false]
}

function checkJSON(expect, actual) {
	let valid = true;
	if (expect.properties) {
		for (var property in expect.properties) {
			let propertyValue = expect.properties[property];
			if (actual[property]) {
				// проверка properties
				if (propertyValue.properties) {
					[valid, propError] = checkJSON(propertyValue, actual[property]);
					if (propError) return [false, propError];
				}
				else {
					[valid, errorParam] = checkParams(actual, property, propertyValue);
                    if (errorParam) return [false, errorParam];
				}
			} else {
				return [valid, (new AssertionError(null, null, STRUCTURE_ERROR, property))];
			}
		}
	} else {
		[valid, errorParam] = checkParams(actual, expect, expect);
		if (errorParam) return [false, errorParam];
	}
	return [valid, false];
}

function checkErrorType(actual, expect) {
    if (expect instanceof Error) {
        return actual.constructor === expect.constructor || actual instanceof expect.constructor;
    } else if (expect.prototype instanceof Error || expect === Error) {
        return actual.constructor === expect || actual instanceof expect;
    }

    return false;
}

function checkErrorMsg(actual, expect) {
    let comparisonString = typeof actual === STRING_TYPE ? actual : actual.message;
    if (expect instanceof RegExp) {
        return expect.test(comparisonString);
    } else if (typeof expect === STRING_TYPE) {
        return comparisonString.indexOf(expect) !== -1;
    }

    return false;
}

module.exports = {
	isNumber,

	isString,

	isArray,

	isError,

	isUrl,

	isFunction,

	isStringWithObject,

	checkTypeByType,

	checkJSON,

	checkErrorMsg,

	checkErrorType

};


