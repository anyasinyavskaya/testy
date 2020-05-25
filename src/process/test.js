const assert = require('./assert');
const AssertionError = require("./assertionError.js");

const urlBuilder = require('./url');
const total = require('./assertionError');
const request = require('request');
const _ = require('lodash');

const DOT = '.';
const SLASH = '/';
const GET_METHOD = 'get';
const POST_METHOD = 'post';
const OBJECT = 'object';
const ARRAY = 'array';

const TYPE_ERROR = 'type';
const VALUE_ERROR = 'value';
const SIZE_ERROR = 'size';
const STATUS_ERROR = 'status';
const STRUCTURE_ERROR = 'structure';

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
	let errors = [];

	if (expect.status || expect.data) {
		if (expect.status) {
			try {
				valid = _.isEqual(status, expect.status);
				if (!valid) {
					error = new AssertionError(expect.status, status, STATUS_ERROR, '');
					errors.push(error);
				}

			} catch (e) {
				console.log(e);
				return false;
			}
		}
		if (expect.data) {
			const data = expect.data;
			if (data.type) {
				if (data.type === 'json') {
					if (isResultJson && assert.checkTypeByType(result, OBJECT)) {
						[valid, errorsJSON] = assert.checkJSON(data, result);
						errors = errors.concat(errorsJSON);
					}
				} else {
					valid = assert.checkTypeByType(result, data.type);
					if (!valid) {
						error = new AssertionError(data.type, typeof result, TYPE_ERROR, '');
						errors.push(error);
					}
				}
			}

			if (data.value) {
				try {
					valid = _.isEqual(result, data.value);
					if (!valid) {
						error = new AssertionError(data.value, result, VALUE_ERROR, '');
						errors.push(error);
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
						errors.push(error);
					}
				}
			}

		}

	}

	return errors;
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
		request[type](data, async (error, response, body) => {
			let status;
			if (error) {
				console.log(error);
				return resolve(false);
			}
			if (!body) return resolve(false);

			if (response) status = response.statusCode;

			// result -- это фактический результат
			const result = url ? await getUrlRes(url, filename) : getRes(body);

			if (after) {
				await goUrls(after);
			}
			const errors = matchResults(result, status, test);
			resolve(errors);
		});
	})
};
