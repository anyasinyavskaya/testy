const fs = require('fs');
const spawn = require('child_process').spawn;
const test = require('./test');
const TestError = require('./testError');
const parse = require('./parse');

const title = '{title}';
const server = '{server}';
const config = '{config}';

const testDir = server + '/test';
const DOT = '.';
const SLASH = '/';

describe(title, () => {
	const testFiles = [];
	const testDict = [];

	const files = fs.readdirSync(testDir);
	files.forEach(f => {
		const filepath = testDir + SLASH + f;
		if (f.startsWith(DOT)|| !/\.js$/.test(f) || fs.statSync(filepath).isDirectory())
			return;
		testFiles.push(f);
	});

	testFiles.forEach(filename => {
		const sourceTests = require(testDir + '/' + filename);
		let tests = parse(sourceTests, filename, config);
		const name = filename.replace(/\.js$/, '');
		testDict[name] = tests;
	});

	for (let filename in testDict) {
		const tests = testDict[filename];
		tests.forEach(thisTest => {
			it('(' + filename + ') ' + thisTest.title, async () => {
				const errors = await test(thisTest, filename, testDict);
				errors.forEach(e => {
					if (e !== null) {
						throw new TestError(e.getMessages());
					}
				});
			});
		});
	}
});
