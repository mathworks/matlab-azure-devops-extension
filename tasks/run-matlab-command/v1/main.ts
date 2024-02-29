// Copyright 2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as path from "path";
import * as matlab from "./matlab";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const command: string = taskLib.getInput("command", true) || "";
        const startupOpts: string | undefined = taskLib.getInput("startupOptions");

        await matlab.runCommand(command, process.platform, process.arch, startupOpts);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

run();
