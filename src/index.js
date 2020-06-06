const {spawnSync} = require('child_process');
const fse = require('fs-extra');
const fs = require('fs');
const path = require('path');
const caller = require('caller');
const environment = require('./environment');
const config = require('./config');

const VAR_FILE = '/variables.json';

const PATH_TO_MOCHA = "/mocha/bin/mocha";
const NODE_MODULES = '/node_modules';
const LIB_DIR = './process';
const TEMP_DIR = '../.temp';
const UTF = 'utf-8';
const TITLE = 'title';
const SERVER = 'server';
const CONFIG = 'config';
const STAT = 'stat';
const COMMANDS = 'commands';
const LODASH = 'lodash';
const REQUEST = 'request';
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

function makeVars(dir, statFlag, nodeModules) {
    const serverDir = path.basename(server);
    const title = serverDir.replace(/-/g, ' ');
    let vars = {};
    vars[TITLE] = title;
    vars[SERVER] = server;
    vars[STAT] = statFlag;
    vars[CONFIG] = config.server;
    vars[COMMANDS] = config.commands;
    vars[LODASH] = nodeModules + SLASH + LODASH;
    vars[REQUEST] = nodeModules + SLASH + REQUEST;
    return vars;
}

module.exports = () => {
    const temp = path.resolve(__dirname, TEMP_DIR);
    const source = path.resolve(__dirname, LIB_DIR);
    let statFlag;
    [mochaCommands, server] = environment.build(server, temp);
    const nodeModules = getNodeModules(server);
    const mocha = nodeModules + PATH_TO_MOCHA;
    const app = path.basename(server);
    const tempDir = temp + SLASH + app;
    const vars = makeVars(source, statFlag, nodeModules);

    fse.copySync(source, tempDir);
    fse.writeFileSync(tempDir + SLASH + VAR_FILE, JSON.stringify(vars), UTF);

    spawnSync('node', [mocha, tempDir, ...mochaCommands], {stdio: "inherit"});
    fse.removeSync(tempDir);
};

