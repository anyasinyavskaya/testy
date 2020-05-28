const AssertionError = require("./errors/assertionError.js");
const _ = require('lodash');

const STRING_TYPE = 'string';
const NUMBER_TYPE = 'number';
const BOOL_TYPE = 'boolean';
const ARRAY_TYPE = 'array';
const OBJECT_TYPE = 'object';
const NULL_TYPE = 'null';
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

function isUrl(str) {
	return str.startsWith('/') || /^http(s):\/\//.test(str);
}

function isFunction(item) {
    return typeof item === FUNCTION_TYPE;
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
		case BOOL_TYPE: {
			isEqual = !!actual && actualType === BOOL_TYPE;
			break;
		}
		case ARRAY_TYPE: {
			isEqual = !!actual && (actual.constructor === Array ||
				Object.prototype.toString.call(actual) === '[object Array]');
			break;
		}
		case OBJECT_TYPE: {
			isEqual = !!actual && actual.constructor === Object;
			break;
		}
		case NULL_TYPE: {
			isEqual = actual == null;
			break;
		}

	}
	return isEqual;
}

function checkParams(actual, property, propertyValue) {
	let errors = [];
	let valid = true;
	// проверка значения
	if (propertyValue.value) {
		valid = _.isEqual(propertyValue.value, actual[property]);
		if (!valid) {
			errors.push(new AssertionError(propertyValue.value, actual[property], VALUE_ERROR, property));
		}
	}
	// проверка типа
	if (propertyValue.type) {
		valid = checkTypeByType(actual[property], propertyValue.type);
		if (!valid) {
			errors.push(new AssertionError(propertyValue.type, typeof actual[property],
				TYPE_ERROR, property));
		}
	}
	// проверка диапазона
	if (isNumber(actual[property])) {
		if (propertyValue.maxValue) {
			valid = (actual[property] <= propertyValue.maxValue);
			if (!valid) {
				errors.push(new AssertionError(propertyValue.maxValue, actual[property],
					MAX_ERROR, property));
			}
		}
		if (propertyValue.minValue) {
			valid = (actual[property] >= propertyValue.minValue);
			if (!valid) errors.push(new AssertionError(propertyValue.minValue, actual[property],
				MIN_ERROR, property))
		}
	}

	// проверка размера массива
	if (isArray(actual[property])){
		if (propertyValue.size) {
			valid = _.isEqual(actual[property].length, propertyValue.size);
			if (!valid) {
				errors.push(new AssertionError(propertyValue.size, actual[property].length,
					SIZE_ERROR, property));
			}
		}
	}
	return [valid, errors]
}

function checkJSON(expect, actual) {
	let valid = true;
	let errors = [];
	if (expect.properties) {
		for (var property in expect.properties) {
			let propertyValue = expect.properties[property];
			if (actual[property]) {
				// проверка properties
				if (propertyValue.properties) {
					[valid, propErrors] = checkJSON(propertyValue, actual[property]);
					errors = errors.concat(propErrors);
				}
				else {
					[valid, errorsParam] = checkParams(actual, property, propertyValue);
					errors = errors.concat(errorsParam);
				}
			} else {
				errors.push(new AssertionError(null, null, STRUCTURE_ERROR, property));
			}
		}
	} else {
		[valid, errorsParam] = checkParams(actual, expect, expect);
		errors = errors.concat(errorsParam);
	}
	return [valid, errors];
}

module.exports = {
	isNumber,

	isString,

	isUrl,

	isFunction,

	isStringWithObject,

	checkTypeByType,

	checkJSON,

};


