const cp = require('child_process');
const fse = require('fs-extra');
const fs = require('fs');
const config = require('../config');
const path = require('path');

const CONFIG = '--config';
const STAT = '--stat';
const CONFIG_FILE = './config.js';
const DOT = '.';
const EQUAL = '=';
const NEWLINE = '\n';

function setCommands(server) {
	const commands = process.argv.slice(2);
	let configFlag = false, statFlag = false;
	let mochaCommands = [];

	commands.forEach(x => {
		if (x) {
			if (x.indexOf(CONFIG) >= 0) {
				configFlag = x;
			}
			else if (x.indexOf(STAT) >= 0) {
				statFlag = x;
			}
			else if (/^[./]/.test(x)) {
				server = x;
			}
			else {
				mochaCommands.push(x);
			}
		}
	});
	return [mochaCommands, configFlag, statFlag, server]
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

function setStat(statFlag) {
    if (statFlag) {
        config.commands.stat = statFlag.split(EQUAL)[1] || 7;
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
		let configFlag, statFlag;
		[mochaCommands, configFlag, statFlag, server] = setCommands(server);
		server = setServer(server);
		setConfig(configFlag, server);
		setStat(statFlag);
		if (!fse.pathExistsSync(tempPath)) {
			fs.mkdirSync(tempPath)
		}
		return [mochaCommands, server];
	},

};

