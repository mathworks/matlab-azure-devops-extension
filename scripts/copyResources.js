// Copyright 2020 The MathWorks, Inc.

"use strict";

const project = require("./project");
const sh = require("shelljs");
const path = require("path");
const util = require("./util");

sh.config.fatal = true;

const ignored = [".ts", "tsconfig.json"];

for (let task of project.taskList) {
    sh.echo(`> copying resources for ${task.fullName}`);

    util.cpdir(task.sourcePath, task.buildPath, {
        filter: (file) =>
            !file.includes("node_modules") &&
            ignored.every(e => !file.endsWith(e))
    });

    sh.cp("-r", path.join(task.sourcePath, "node_modules"), path.join(task.buildPath, "node_modules"));
}
