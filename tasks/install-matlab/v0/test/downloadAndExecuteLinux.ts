// Copyright 2020 The MathWorks, Inc.

import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("release", "R2020a");

tr.registerMock("azure-pipelines-tool-lib/tool", {
    downloadTool(url: string) {
        if (url === "https://ssd.mathworks.com/supportfiles/ci/matlab-deps/v0/install.sh") {
            return "install.sh";
        } else if (url === "https://ssd.mathworks.com/supportfiles/ci/ephemeral-matlab/v0/ci-install.sh") {
            return "ci-install.sh";
        } else {
            throw new Error("Incorrect URL");
        }
    },
});

tr.registerMock("./utils", {
    platform: () => "linux",
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
        "sudo -E /bin/bash ci-install.sh --release R2020a": {
            code: 0,
            stdout: "Installed MATLAB",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
