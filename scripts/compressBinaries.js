// Copyright 2024 The MathWorks, Inc.

"use strict";

const project = require("./project");
const sh = require("shelljs");
const path = require("path");

sh.config.fatal = true;

sh.exec("sudo apt-get update -y");
sh.exec("sudo apt-get install -y upx");

const supportedPlatforms = ["glnxa64", "win64", "maci64"];
for (let task of project.taskList) {
    if (task.name == "install-matlab") {
        continue
    }
    let binext;
    for (let platformDir of supportedPlatforms) {
        if (platformDir == "win64") {
            binext = ".exe";
        } else {
            binext = "";
        }

        let binPath = path.join(task.packagePath, "bin", platformDir, `run-matlab-command${binext}`);
        sh.exec(`upx ${binPath}`);
    }
}

