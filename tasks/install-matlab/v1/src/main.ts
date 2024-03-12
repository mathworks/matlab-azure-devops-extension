// Copyright 2023-2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as path from "path";
import * as install from "./install";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "..", "task.json"));
        const release = taskLib.getInput("release") || "latest";
        const products = taskLib.getInput("products") || "MATLAB";
        await install.install(process.platform, process.arch, release, products);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

run();
