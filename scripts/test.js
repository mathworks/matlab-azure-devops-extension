"use strict";

const project = require("./project");
const sh = require("shelljs");

sh.config.fatal = true;

for (let task of project.taskList) {
    sh.echo(`> testing ${task.fullName}`);

    sh.cd(task.buildPath);

    sh.exec("mocha");
}