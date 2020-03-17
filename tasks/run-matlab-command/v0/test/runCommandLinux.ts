// Copyright 2020 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("command", "myscript");

tr.registerMock("./utils", {
    platform: () => "linux",
});

const runCmdPath = path.join(path.dirname(__dirname), "bin", "run_matlab_command.sh");
const a: ma.TaskLibAnswers = {
    checkPath: {
        [runCmdPath]: true,
    },
    exec: {
        [runCmdPath + " myscript"]: {
            code: 0,
            stdout: "hello world",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
