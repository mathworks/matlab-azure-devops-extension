// Copyright 2020 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");
import {runCmdArg, runCmdPath} from "./common";

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("testResultsJUnit", "results.xml");
tr.setInput("codeCoverageCobertura", "coverage.xml");
tr.setInput("sourceFolder", "source");
tr.setInput("selectByFolder", "tests/filteredTest");
tr.setInput("selectByTag", "FILTERED");
tr.setInput("coberturaModelCoverage","modelcoverage.xml");
tr.setInput("simulinkTestResults","stmresults.mldatx");
tr.setInput("testResultsPDF","results.pdf");

tr.registerMock("./utils", {
    platform: () => "win32",
});

const a: ma.TaskLibAnswers = {
    checkPath: {
        [runCmdPath]: true,
    },
    exec: {
        [runCmdPath + ".bat " + runCmdArg("results.xml", "coverage.xml", "source", "tests/filteredTest", "FILTERED", "modelcoverage.xml", "stmresults.mldatx", "results.pdf")]: {
            code: 0,
            stdout: "ran tests",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
