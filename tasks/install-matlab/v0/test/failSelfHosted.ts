// Copyright 2020 The MathWorks, Inc.

import mr = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const tp = path.join(__dirname, "..", "main.js");
const tr = new mr.TaskMockRunner(tp);

process.env.SYSTEM_SERVERTYPE = "self-hosted";

tr.run();
