const {spawnSync} = require('child_process');
const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');
const caller = require('caller');
const environment = require('./environment');
const config = require('./config');

const TEST_FILE = '/test.js';
const INDEX_FILE = '/index.js';

const temp = path.resolve(__dirname, '../.temp');
const source = path.resolve(__dirname, './process');

const PATH_TO_MOCHA = "/mocha/bin/mocha";
const NODE_MODULES = '/node_modules';
const UTF = 'utf-8';
const TITLE = '{title}';
const SERVER = '{server}';
const CONFIG = `'{config}'`;
const STAT = '{stat}';
const COMMANDS = `'{commands}'`;
const LODASH = `'lodash'`;
const REQUEST = `'request'`;
const SLASH = '/';

// путь к проекту с приложением
let server = '';

function getNodeModules(dir) {
	if (!dir) {
		const pathToCaller = caller();
		dir = path.resolve(pathToCaller, '..');
	}

	let p = dir;

	while (p !== SLASH) {
		const dest = p + NODE_MODULES;
		if (fse.pathExistsSync(dest)) return dest;
		p = path.resolve(p, '..');
	}
}

function replaceNodeModules(content, modules, nodeModules) {
	for (const module in modules) {
		content.replace(module, `'${nodeModules}/${module}'`);
	}
	return content;
}

function replaceIndexFile(dir, statFlag) {
	const file = dir + INDEX_FILE;
	const serverDir = path.basename(server);
	const title = serverDir.replace(/-/g, ' ');

	const content = fs.readFileSync(file, UTF);
	const newContent = content
		.replace(TITLE, title)
		.replace(SERVER, server)
        .replace(STAT, statFlag)
		.replace(CONFIG, JSON.stringify(config.server))
		.replace(COMMANDS, JSON.stringify(config.commands));

	fs.writeFileSync(file, newContent, UTF);
}

function replaceTestFile(dir, nodeModules) {
	const file = dir + TEST_FILE;
	const content = fs.readFileSync(file, UTF);
	let newContent = replaceNodeModules(content, [LODASH, REQUEST], nodeModules);
	fs.writeFileSync(file, newContent, UTF);
}

module.exports = () => {
    let statFlag;
	[mochaCommands, server] = environment.build(server, temp);
	const nodeModules = getNodeModules(server);
	const mocha = nodeModules + PATH_TO_MOCHA;
	const app = path.basename(server);
	const tempDir = temp + SLASH + app;
	fse.copySync(source, tempDir);

	replaceIndexFile(tempDir, statFlag);
	replaceTestFile(tempDir, nodeModules);

	spawnSync('node', [mocha, tempDir, ...mochaCommands], {stdio: "inherit"});
	fse.removeSync(tempDir);
};

