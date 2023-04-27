// Copyright 2023 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

const flags = "-nojvm -nodesktop -logfile file";
tr.setInput("command", "myscript");
tr.setInput("startupOptions", flags);

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
        return "temp's/path";
    }
    if (variable.toLowerCase() === "system.defaultworkingdirectory") {
        return "work's/dir";
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
        "temp's/path": true,
    },
    exec: {
        [runCmdPath + " cd('temp''s/path');command_1_2_3" + " " + flags]: {
            code: 0,
            stdout: "hello world",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

// mock fs
import fs = require("fs");
const fsClone = Object.assign({}, fs);
fsClone.writeFileSync = (filePath: any, contents: any, options: any) => {
    // tslint:disable-next-line:no-console
    console.log(`writing ${contents} to ${filePath}`);
};
tr.registerMock("fs", fsClone);

// mock uuidv4
tr.registerMock("uuid/v4", () => {
    return "1-2-3";
});

tr.run();
