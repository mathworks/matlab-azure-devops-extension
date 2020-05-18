// Copyright 2020 The MathWorks, Inc.

"use strict";

const project = require("./project");
const sh = require("shelljs");
const path = require("path");

sh.config.fatal = true;

for (let task of project.taskList) {
    sh.echo(`> testing ${task.fullName}`);
    sh.exec("mocha " + path.join(task.buildPath, "test", "suite.js") + " --timeout 10000");
}
