// Copyright 2020 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");
import {runCmdArg, runCmdPath} from "./common";

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.registerMock("./utils", {
    platform: () => "linux",
});

const a: ma.TaskLibAnswers = {
    checkPath: {
        [runCmdPath]: true,
    },
    exec: {
        [runCmdPath + ".sh " + runCmdArg("", "", "", "", "")]: {
            code: 1,
            stdout: "tests failed",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
