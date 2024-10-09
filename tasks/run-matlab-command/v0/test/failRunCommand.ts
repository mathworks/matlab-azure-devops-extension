// Copyright 2020-2024 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("command", "myscript");

tr.registerMock("./utils", {
    platform: () => "linux",
    architecture: () => "x64",
});

// create assertAgent and getVariable mocks, support not added in this version of task-lib
import tl = require("azure-pipelines-task-lib/mock-task");
const tlClone = Object.assign({}, tl);
// @ts-ignore
tlClone.getVariable = (variable: string) => {
    if (variable.toLowerCase() === "agent.tempdirectory") {
        return "temp/path";
    }
    if (variable.toLowerCase() === "system.defaultworkingdirectory") {
        return "work/dir";
    }
    return null;
};
// @ts-ignore
tlClone.assertAgent = (variable: string) => {
    return;
};
tr.registerMock("azure-pipelines-task-lib/mock-task", tlClone);

const runCmdPath = path.join(path.dirname(__dirname), "bin", "glnxa64", "run-matlab-command");
const a: ma.TaskLibAnswers = {
    checkPath: {
        [runCmdPath]: true,
        "temp/path": true,
    },
    exec: {
        [runCmdPath + ` setenv('MW_ORIG_WORKING_FOLDER', cd('temp/path'));command_1_2_3`]: {
            code: 1,
            stdout: "BAM!",
        },
    },
    exist: {
        [runCmdPath]: true,
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

// mock fs
tr.registerMock("fs", {
    chmodSync: () => Promise.resolve(0),
    writeFileSync: (filePath: any, contents: any, options: any) => {
        // tslint:disable-next-line:no-console
        console.log(`writing ${contents} to ${filePath}`);
    },
});

// mock uuidv4
tr.registerMock("uuid", {
    v4: () => "1-2-3",
});

tr.run();
