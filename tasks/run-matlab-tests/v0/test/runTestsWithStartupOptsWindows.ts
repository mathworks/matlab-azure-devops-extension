// Copyright 2023 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");
import { runCmdArg } from "./common";

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("testResultsJUnit", "results.xml");
tr.setInput("codeCoverageCobertura", "coverage.xml");
tr.setInput("sourceFolder", "source");
tr.setInput("selectByFolder", "tests/filteredTest");
tr.setInput("selectByTag", "FILTERED");
tr.setInput("modelCoverageCobertura", "modelcoverage.xml");
tr.setInput("testResultsSimulinkTest", "stmresults.mldatx");
tr.setInput("testResultsPDF", "results.pdf");
tr.setInput("strict", "true");
tr.setInput("useParallel", "true");
tr.setInput("outputDetail", "Verbose");
tr.setInput("loggingLevel", "Verbose");
tr.setInput("startupOptions", "-nojvm -nodisplay");

const runCmdPath = path.join(path.dirname(__dirname), "bin", "win64", "run-matlab-command.exe");

tr.registerMock("./utils", {
    platform: () => "win32",
    architecture: () => "x64",
});

tr.registerMock("fs", {
    chmodSync: () => Promise.resolve(0),
});

const a: ma.TaskLibAnswers = {
    checkPath: {
        [runCmdPath]: true,
    },
    exec: {
        [runCmdPath + " " + runCmdArg("results.xml", "coverage.xml", "source", "tests/filteredTest", "FILTERED", "modelcoverage.xml", "stmresults.mldatx", "results.pdf", true, true, "Verbose", "Verbose") + " -nojvm -nodisplay"]: {
            code: 0,
            stdout: "ran tests",
        },
    },
    exist: {
        [runCmdPath]: true,
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
