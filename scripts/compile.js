// Copyright 2020 The MathWorks, Inc.

"use strict";

const project = require("./project");
const sh = require("shelljs");

// sh.config.fatal = true;

for (let task of project.taskList) {
    sh.echo(`> compiling ${task.fullName}`);
    sh.exec("npm install", { cwd: task.sourcePath }, "--omit=dev");
    sh.exec("tsc --outDir " + task.buildPath + " --project " + task.sourcePath);
}
