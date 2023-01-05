// Copyright 2020 The MathWorks, Inc.

import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "src", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("release", "R2020a");

// create assertAgent and getVariable mocks, support not added in this version of task-lib
import tl = require("azure-pipelines-task-lib/mock-task");
const tlClone = Object.assign({}, tl);
// @ts-ignore
tlClone.getVariable = (variable: string) => {
    if (variable.toLocaleLowerCase() === "system.servertype") {
        return "self-hosted";
    }
    return null;
};
// @ts-ignore
tlClone.assertAgent = (variable: string) => {
    return;
};
tr.registerMock("azure-pipelines-task-lib/mock-task", tlClone);

tr.run();
