const fs = require('fs');
const integration = require('./integration');
const unit = require('./unit');
const TestError = require('./errors/testError');
const parse = require('./parse');
const statistics = require('./statistics');
const variables = require('./variables');

const testDir = variables.server + '/test';
const DOT = '.';
const SLASH = '/';
const INTEGRATION = 'integration';
const UNIT = 'unit';

const SYNTAX_ERROR = "TestSyntaxError";
const TEST_ERROR = "TestError";

const testFiles = [];
const integrationTestDict = [];
const unitTestDict = [];

function testName(filename, test, stat) {
    return stat ? '(' + filename + ') ' + test.title : '(' + filename + ') ' + test.type + " " + test.title;
}

describe(variables.title, () => {

    const files = fs.readdirSync(testDir);
    files.forEach(f => {
        const filepath = testDir + SLASH + f;
        if (f.startsWith(DOT) || !/\.js$/.test(f) || fs.statSync(filepath).isDirectory()) return;
        testFiles.push(f);
    });

    testFiles.forEach(filename => {
        const sourceTests = require(testDir + '/' + filename);
        let [error, unitTests, integrationTests] = parse(sourceTests, filename, variables.config);
        if (error) throw new TestError(error.getMessages());
        const name = filename.replace(/\.js$/, '');
        integrationTestDict[name] = integrationTests;
        unitTestDict[name] = unitTests;
    });

    for (let filename in unitTestDict) {
        const unitTests = unitTestDict[filename];
        unitTests.forEach(test => {
            it(testName(filename, test), async () => {
                const [testError, grammarError] = await unit(test, filename, unitTestDict);
                if (grammarError) {
                    throw new TestError(SYNTAX_ERROR, grammarError.getMessages());

                } else if (testError) {
                    throw new TestError(TEST_ERROR, testError.getMessages());

                }
            });
        });
    }
    let serverConnectedFlag = true;

    for (let filename in integrationTestDict) {
        const integrationTests = integrationTestDict[filename];
        integrationTests.forEach(test => {
            it(testName(filename, test), async () => {
                const [error, testError, grammarError] = await integration(test, filename, integrationTestDict);
                if (error) {
                    serverConnectedFlag = false;
                    throw error
                }
                if (error !== null) throw new TestError('Получен пустой response');
                if (grammarError) {
                    test = false;
                    throw new TestError(SYNTAX_ERROR, grammarError.getMessages());

                } else if (testError) {
                    throw new TestError(TEST_ERROR, testError.getMessages());

                }

            });
        });
    }

    after(async () => {
        if (variables.commands.stat && serverConnectedFlag) {
            for (let filename in integrationTestDict) {
                const integrationTests = integrationTestDict[filename];
                (async () => {
                    let res = {};
                    for (const test of integrationTests) {
                        if (test) {
                            let results = [];
                            for (let i = 0; i < variables.commands.stat; i++) {
                                let [e0, e1, e2, time] = await integration(test, filename, integrationTestDict);
                                results.push(time);
                            }
                            let table = statistics.print(results);
                            res[testName(filename, test, true)] = table;
                        }
                    }
                    console.log("Статистика производительности");
                    console.table(res);
                })();

            }
        }
    });
});

