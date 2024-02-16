// Copyright 2020-2023 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import { chmodSync } from "fs";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidV4 } from "uuid";
import { architecture, platform } from "./utils";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const command: string = taskLib.getInput("command", true) || "";
        const startupOpts: string | undefined = taskLib.getInput("startupOptions");

        await runCommand(command, startupOpts);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

async function runCommand(command: string, args?: string) {
    // write command to script
    console.log(taskLib.loc("GeneratingScript", command));
    taskLib.assertAgent("2.115.0");
    const tempDirectory = taskLib.getVariable("agent.tempDirectory") || "";
    taskLib.checkPath(tempDirectory, `${tempDirectory} (agent.tempDirectory)`);
    const scriptName = "command_" + uuidV4().replace(/-/g, "_");
    const scriptPath = path.join(tempDirectory, scriptName + ".m");
    await fs.writeFileSync(
        scriptPath,
        "cd(getenv('MW_ORIG_WORKING_FOLDER'));\n" + command,
        { encoding: "utf8" });

    // run script
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
    console.log("========================== Starting Command Output ===========================");
    const runToolPath = path.join(__dirname, "bin", platformDir, `run-matlab-command${ext}`);
    chmodSync(runToolPath, "777");
    const runTool = taskLib.tool(runToolPath);
    runTool.arg("setenv('MW_ORIG_WORKING_FOLDER', cd('" + tempDirectory.replace(/'/g, "''") + "'));" + scriptName);

    if (args) {
        runTool.arg(args.split(" "));
    }

    const exitCode = await runTool.exec();
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToRunCommand"));
    }
}

run();
