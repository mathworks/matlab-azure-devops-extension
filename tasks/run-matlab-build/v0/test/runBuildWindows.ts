// Copyright 2022 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("tasks", "test");

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
        [runCmdPath + " buildtool test"]: {
            code: 0,
            stdout: "ran test task",
        },
    },
    exist: {
        [runCmdPath]: true,
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
