// Copyright 2020 The MathWorks, Inc.

"use strict";

const path = require("path");
const sh = require("shelljs");

const rootPath = path.dirname(__dirname);
const buildPath = path.join(rootPath, "_build");
const packagePath = path.join(rootPath, "_package");

const tasksDir = "tasks";
const taskList = [];
for (let task of sh.ls(path.join(rootPath, tasksDir))) {
    for (let ver of sh.ls(path.join(rootPath, tasksDir, task))) {
        taskList.push({
            name: task,
            version: ver,
            fullName: task + " " + ver,
            sourcePath: path.join(rootPath, tasksDir, task, ver),
            buildPath: path.join(buildPath, tasksDir, task, ver),
            packagePath: path.join(packagePath, tasksDir, task, ver)
        });
    }
}

module.exports = {
    rootPath: rootPath,
    buildPath: buildPath,
    packagePath: packagePath,
    taskList: taskList
};
