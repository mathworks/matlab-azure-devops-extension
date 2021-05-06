// Copyright 2020 The MathWorks, Inc.

import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

tr.setInput("release", "R2020a");

tr.registerMock("azure-pipelines-tool-lib/tool", {
    downloadTool() {
        throw new Error("Download failed");
    },
});

tr.run();
