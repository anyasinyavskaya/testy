const cp = require('child_process');
const fse = require('fs-extra');
const fs = require('fs');
const config = require('../config');
const path = require('path');

const CONFIG = '--config';
const CONFIG_FILE = './config.js';
const DOT = '.';
const EQUAL = '=';
const NEWLINE = '\n';

function setCommands(server) {
	const commands = process.argv.slice(2);
	let configFlag = false;

	commands.forEach(x => {
		if (x) {
			if (x.indexOf(CONFIG) >= 0) {
				configFlag = x;
			}
			else if (/^[./]/.test(x)) {
				server = x;
			}
		}
	});
	return [configFlag, server]
}

function setConfig(configFlag, server) {
	if (configFlag) {
		config.commands.customConfig = configFlag.split(EQUAL)[1] || CONFIG_FILE;

		const customConfig = config.commands.customConfig;
		if (customConfig) {
			const filePath = path.resolve(server, customConfig);
			const userConfig = require(filePath);
			Object.assign(config.server, userConfig);
		}
	}
}

function setServer(server) {
	const pwd = (cp.execSync('pwd')).toString().split(NEWLINE)[0];

	if (!server || server === DOT) {
		server = pwd;
	}
	else {
		if (server.startsWith(DOT)) server = path.resolve(pwd, server);

		if (!fse.pathExistsSync(server)) {
			console.log(`Не найдено: ${server}`);
			return false;
		}
	}
	return server;
}

module.exports = {
	build: function (server, tempPath) {
		let configFlag;
		[configFlag, server] = setCommands(server);
		server = setServer(server);
		setConfig(configFlag, server);
		if (!fse.pathExistsSync(tempPath)) {
			fs.mkdirSync(tempPath)
		}
		return server;
	},

};

