import ma = require("azure-pipelines-task-lib/mock-answer");
import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.registerMock("azure-pipelines-tool-lib/tool", {
    downloadTool(url: string) {
        if (url !== "https://storage.googleapis.com/matlabimagesus/public/ephemeral-matlab/v0/install.sh") {
            throw new Error("Incorrect URL");
        }
        return "install.sh";
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
        "bash.exe install.sh": {
            code: 0,
            stdout: "Installed MATLAB",
        },
    },
} as ma.TaskLibAnswers;
tr.setAnswers(a);

tr.run();
