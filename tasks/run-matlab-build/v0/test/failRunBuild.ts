// Copyright 2022 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

const runCmdPath = path.join(path.dirname(__dirname), "bin", "glnxa64", "run-matlab-command");

tr.registerMock("./utils", {
    platform: () => "linux",
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
        [runCmdPath + " buildtool"]: {
            code: 1,
            stdout: "BAM!",
        },
    },
    exist: {
        [runCmdPath]: true,
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
