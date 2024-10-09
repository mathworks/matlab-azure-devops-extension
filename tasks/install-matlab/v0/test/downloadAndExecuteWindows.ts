// Copyright 2020-2023 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import * as fs from "fs";
import * as os from "os";
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("release", "R2020a");

delete process.env.MATHWORKS_ACCOUNT;
delete process.env.MATHWORKS_TOKEN;

const matlabRoot = "C:\\path\\to\\matlab";
fs.writeFileSync(path.join(os.tmpdir(), "ephemeral_matlab_root"), matlabRoot);
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
    downloadToolWithRetries(url: string) {
        if (url === "https://ssd.mathworks.com/supportfiles/ci/ephemeral-matlab/v0/ci-install.sh") {
            return "ci-install.sh";
        } else if (url === "https://ssd.mathworks.com/supportfiles/ci/matlab-batch/v0/install.sh") {
            return "install.sh";
        } else {
            throw new Error("Incorrect URL");
        }
    },
    prependPath(toolPath: string) {
        if ( toolPath !== path.join(matlabRoot, "bin") && toolPath !== batchInstallRoot) {
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
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
