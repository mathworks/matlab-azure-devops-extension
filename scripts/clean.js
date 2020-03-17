// Copyright 2020 The MathWorks, Inc.

"use strict";

const project = require("./project");
const sh = require("shelljs");

sh.config.fatal = true;

sh.rm("-rf", project.buildPath);
sh.rm("-rf", project.packagePath);
