"use strict";

const project = require("./project");
const sh = require("shelljs");
const path = require("path");
const util = require("./util");

sh.config.fatal = true;

sh.mkdir("-p", project.packagePath);

sh.cp(path.join(project.rootPath, "vss-extension.json"), project.packagePath);
sh.cp("-r", path.join(project.rootPath, "images"), project.packagePath);

const ignored = [".taskkey", ".map"];

for (let task of project.taskList) {
    sh.mkdir("-p", task.packagePath);

    util.cpdir(task.buildPath, task.packagePath, {
        filter: (file) =>
            !file.startsWith("node_modules") &&
            !file.startsWith("test") &&
            ignored.every(e => !file.endsWith(e))
    });

    sh.cp("-R", path.join(task.buildPath, "node_modules"), path.join(task.packagePath, "node_modules"));
}