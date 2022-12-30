// Copyright 2020-2022 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import * as fs from "fs";
import * as os from "os";
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("release", "R2020a");

const matlabRoot = path.join("C:", "toolcache", "MATLAB", "2022.2.0");
const batchInstallRoot = path.join("C:", "Program Files", "matlab-batch");

// create assertAgent and getVariable mocks, support not added in this version of task-lib
import tl = require("azure-pipelines-task-lib/mock-task");
const tlClone = Object.assign({}, tl);
// @ts-ignore
tlClone.getVariable = (variable: string) => {
    if (variable.toLocaleLowerCase() === "system.servertype") {
        return "hosted";
    }
    return null;
};
// @ts-ignore
tlClone.assertAgent = (variable: string) => {
    return;
};
tr.registerMock("azure-pipelines-task-lib/mock-task", tlClone);

tr.registerMock("azure-pipelines-tool-lib/tool", {
    downloadTool(url: string) {
        if (url === "https://ssd.mathworks.com/supportfiles/ci/ephemeral-matlab/v0/ci-install.sh") {
            return "ci-install.sh";
        } else if (url === "https://ssd.mathworks.com/supportfiles/ci/matlab-batch/v0/install.sh") {
            return "install.sh";
        } else {
            throw new Error("Incorrect URL");
        }
    },
    prependPath(toolPath: string) {
        if ( !toolPath.includes(matlabRoot) && toolPath !== batchInstallRoot) {
            throw new Error(`Unexpected path: ${toolPath}`);
        }
    },
});

tr.registerMock("./utils", {
    platform: () => "win32",
    architecture: () => "x64",
});

const a: ma.TaskLibAnswers = {
    which: {
        bash: "bash.exe",
    },
    checkPath: {
        "bash.exe": true,
    },
    exec: {
        "bash.exe ci-install.sh --release R2020a": {
            code: 0,
            stdout: "Installed MATLAB",
        },
        "bash.exe install.sh C:\\Program Files\\matlab-batch": {
            code: 0,
            stdout: "Installed matlab-batch",
        },
        "bash.exe install.sh C:/Program Files/matlab-batch": {
            code: 0,
            stdout: "Installed matlab-batch",
        },
        "bash.exe chmod +x mpm\\bin\\win64\\mpm.exe": {
            code: 0,
            stdout: "Installed matlab-batch",
        },
        "bash.exe chmod +x mpm/bin/win64/mpm.exe": {
            code: 0,
            stdout: "Installed matlab-batch",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
