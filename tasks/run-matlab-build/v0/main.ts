// Copyright 2022 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import { chmodSync } from "fs";
import * as path from "path";
import {architecture, platform} from "./utils";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const options: IRunBuildOptions = {
            Tasks: taskLib.getInput("tasks"),
        };
        await runBuild(options);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

async function runBuild(options: IRunBuildOptions) {
    if (architecture() !== "x64") {
        const msg = `This task is not supported on ${platform()} runners using the ${architecture()} architecture.`;
        throw new Error(msg);
    }
    let ext;
    let platformDir;
    switch (platform()) {
        case "win32":
            ext = ".exe";
            platformDir = "win64";
            break;
        case "darwin":
            ext = "";
            platformDir = "maci64";
            break;
        case "linux":
            ext = "";
            platformDir = "glnxa64";
            break;
        default:
            throw new Error(`This task is not supported on ${platform()} runners using the ${architecture()} architecture.`);
    }
    const runToolPath = path.join(__dirname, "bin", platformDir, `run-matlab-command${ext}`);
    chmodSync(runToolPath, "777");
    const runTool = taskLib.tool(runToolPath);
    runTool.arg(`buildtool`);
    if (options.Tasks) {
        runTool.arg(options.Tasks);
    }
    const exitCode = await runTool.exec();
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("BuildFailed"));
    }
}

interface IRunBuildOptions {
    Tasks?: string;
}

run();
