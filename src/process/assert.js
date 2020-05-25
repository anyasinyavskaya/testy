const AssertionError = require("./assertionError.js");
const _ = require('lodash');

const STRING_TYPE = 'string';
const NUMBER_TYPE = 'number';
const BOOL_TYPE = 'boolean';
const ARRAY_TYPE = 'array';
const OBJECT_TYPE = 'object';
const NULL_TYPE = 'null';

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

function isUrl(str) {
	return str.startsWith('/') || /^http(s):\/\//.test(str);
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
	let isOK = true;
	// проверка значения
	if (propertyValue.value) {
		isOK = _.isEqual(propertyValue.value, actual[property]);
		if (!isOK) {
			errors.push(new AssertionError(propertyValue.value, actual[property], VALUE_ERROR, property));
		}
	}
	// проверка типа
	if (propertyValue.type) {
		isOK = checkTypeByType(actual[property], propertyValue.type);
		if (!isOK) {
			errors.push(new AssertionError(propertyValue.type, typeof actual[property],
				TYPE_ERROR, property));
		}
	}
	// проверка диапазона
	if (isNumber(actual[property])) {
		if (propertyValue.maxValue) {
			isOK = (actual[property] <= propertyValue.maxValue);
			if (!isOK) {
				errors.push(new AssertionError(propertyValue.maxValue, actual[property],
					MAX_ERROR, property));
			}
		}
		if (propertyValue.minValue) {
			isOK = (actual[property] >= propertyValue.minValue);
			if (!isOK) errors.push(new AssertionError(propertyValue.minValue, actual[property],
				MIN_ERROR, property))
		}
	}
	return [isOK, errors]
}

function checkJSON(expect, actual) {
	let isOK = true;
	let errors = [];
	if (expect.properties) {
		for (var property in expect.properties) {
			let propertyValue = expect.properties[property];
			if (actual[property]) {
				// проверка properties
				if (propertyValue.properties) {
					[isOK, propErrors] = checkJSON(propertyValue, actual[property]);
					errors = errors.concat(propErrors);
				}
				else {
					[isOK, errorsParam] = checkParams(actual, property, propertyValue);
					errors = errors.concat(errorsParam);
				}
			} else {
				errors.push(new AssertionError(null, null, STRUCTURE_ERROR, property));
			}
		}
	} else {
		[isOK, errorsParam] = checkParams(actual, expect, expect);
		errors = errors.concat(errorsParam);
	}
	return [isOK, errors];
}

module.exports = {
	isNumber,

	isString,

	isUrl,

	isStringWithObject,

	checkTypeByType,

	checkJSON,

};


