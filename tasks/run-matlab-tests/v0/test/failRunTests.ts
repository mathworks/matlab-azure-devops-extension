// Copyright 2020 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

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
            "'JUnitTestResults',''," +
            "'CoberturaCodeCoverage',''," +
            "'SourceFolder','');" +
        "scriptFile = testScript.writeToFile('.matlab/runAllTests.m');" +
        "disp(['Running ''' scriptFile ''':']);" +
        "type(scriptFile);" +
        "fprintf('__________\\n\\n');" +
        "run(scriptFile);"]: {
            code: 1,
            stdout: "tests failed",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
