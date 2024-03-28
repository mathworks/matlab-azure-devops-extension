// Copyright 2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as path from "path";
import * as buildtool from "./buildtool";
import * as matlab from "./matlab";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const options: buildtool.IRunBuildOptions = {
            Tasks: taskLib.getInput("tasks"),
            BuildOptions: taskLib.getInput("buildOptions"),
        };
        const platform = process.platform;
        const architecture = process.arch;
        const startupOpts: string | undefined = taskLib.getInput("startupOptions");
        const buildtoolCommand = buildtool.generateCommand(options);
        await matlab.runCommand(buildtoolCommand, platform, architecture, startupOpts);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

run();
