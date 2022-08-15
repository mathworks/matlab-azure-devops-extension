// Copyright 2020-2022 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import * as fs from "fs";
import * as os from "os";
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("release", "R2020a");

process.env.SYSTEM_SERVERTYPE = "hosted";

const matlabRoot = "C:\\path\\to\\matlab";
const batchInstallRoot = path.join("C:", "Program Files", "matlab-batch");
console.log(batchInstallRoot);
fs.writeFileSync(path.join(os.tmpdir(), "ephemeral_matlab_root"), matlabRoot);

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
        // if (toolPath !== path.join(matlabRoot, "bin") || toolPath !== batchInstallRoot) {
        //     throw new Error(`Unexpected path: ${toolPath}`);
        // }
    },
});

tr.registerMock("./utils", {
    platform: () => "win32",
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
        "bash.exe install.sh 'C:/Program Files/matlab-batch'": {
            code: 0,
            stdout: "Installed matlab-batch",
        },
        "bash.exe install.sh 'C:\\Program Files\\matlab-batch'": {
            code: 0,
            stdout: "Installed matlab-batch",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
