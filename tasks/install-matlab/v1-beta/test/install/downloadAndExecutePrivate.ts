// Copyright 2023 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("release", "R2020a");

process.env.MATHWORKS_ACCOUNT = "euclid@mathworks.com";
process.env.MATHWORKS_TOKEN = "token123456";

const matlabRoot = path.join("opt", "toolcache", "MATLAB", "2022.2.0");
const batchInstallRoot =  path.join("/", "opt", "matlab-batch");

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
        if (url === "https://ssd.mathworks.com/supportfiles/ci/matlab-deps/v0/install.sh") {
            return "install.sh";
        } else if (url === "https://ssd.mathworks.com/supportfiles/ci/ephemeral-matlab/v0/ci-install.sh") {
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

tr.registerMock("./src/utils", {
    platform: () => "linux",
    architecture: () => "x64",
});

const a: ma.TaskLibAnswers = {
    which: {
        bash: "/bin/bash",
    },
    checkPath: {
        "/bin/bash": true,
    },
    exec: {
        "sudo -E /bin/bash install.sh R2020a": {
            code: 0,
            stdout: "Installed MATLAB dependencies",
        },
        "sudo -E /bin/bash ci-install.sh --release R2020a --skip-activation": {
            code: 0,
            stdout: "Installed MATLAB without activating",
        },
        "sudo -E /bin/bash install.sh /opt/matlab-batch": {
            code: 0,
            stdout: "Installed matlab-batch",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
