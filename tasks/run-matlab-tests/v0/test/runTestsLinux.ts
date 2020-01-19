import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("testResultsJUnit", "results.xml");
tr.setInput("codeCoverageCobertura", "coverage.xml");
tr.setInput("codeCoverageSource", "source");

tr.registerMock("./utils", {
    platform: () => "linux",
});

const runCmdPath = path.join(path.dirname(__dirname), "bin", "run_matlab_command.sh");
const a: ma.TaskLibAnswers = {
    checkPath: {
        [runCmdPath]: true,
    },
    exec: {
        [runCmdPath + " " +
        "addpath('" + path.join(path.dirname(__dirname), "scriptgen") + "');" +
        "testScript = genscript('Test','WorkingFolder','..'," +
        "'JUnitTestResults','results.xml'," +
        "'CoberturaCodeCoverage','coverage.xml'," +
        "'CodeCoverageSource',{'source'});" +
        "run(testScript.writeToFile('.mw/runAllTests.m'));"]: {
            code: 0,
            stdout: "ran tests",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
