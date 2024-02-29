// Copyright 2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as path from "path";
import * as matlab from "./matlab";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const options: IRunBuildOptions = {
            Tasks: taskLib.getInput("tasks"),
        };
        const platform = process.platform;
        const architecture = process.arch;
        const startupOpts: string | undefined = taskLib.getInput("startupOptions");
        const buildtoolCommand = generateCommand(options);
        await matlab.runCommand(buildtoolCommand, platform, architecture, startupOpts);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

function generateCommand(options: IRunBuildOptions): string {
    let buildtoolCommand: string = "buildtool";
    if (options.Tasks) {
        buildtoolCommand = buildtoolCommand + " " + options.Tasks;
    }
    return buildtoolCommand;
}

interface IRunBuildOptions {
    Tasks?: string;
}

run();
