const parse = require('url').parse;
const _ = require('lodash');
const assert = require('./assert');

const SLASH = '/';
const DOT = '.';
const COLON = ':';

function getTitles(tests, filename) {
	let titles = [], urls = [], defs = [];
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
		}
		else {
			if (!titles[i]) titles[i] = urls[i];
			defs[i] = item;
			i++;
		}
	});

	return [titles, urls, defs];
}

function getUrls(config, tests) {
	let {protocol, host, port} = config;

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

function getTests(testDefs) {
	const [titles, urls, defs] = testDefs;
	const tests = [];

	for (let i = 0; i < urls.length; i++) {
		let test = {};
		if (_.isPlainObject(defs[i].result)) test = defs[i];
		else test.result = defs[i];
		test.title = titles[i];
		test.originalUrl = urls[i];
		tests.push(test);
	}
	return tests;
}


module.exports = (sourceTests, filename, server) => {
	const titles = getTitles(sourceTests, filename);
	let tests = getTests(titles);
	tests = getUrls(server, tests);
	return tests;
};
