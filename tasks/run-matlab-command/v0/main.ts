// Copyright 2020 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import { chmodSync } from "fs";
import * as fs from "fs";
import * as path from "path";
import * as uuidV4 from "uuid/v4";
import { architecture, platform } from "./utils";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const command = taskLib.getInput("command", true);
        await runCommand(command as string);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

async function runCommand(command: string) {
    // write command to script
    console.log(taskLib.loc("GeneratingScript", command));
    taskLib.assertAgent("2.115.0");
    const workingDirectory = taskLib.getVariable("System.DefaultWorkingDirectory") || "";
    const tempDirectory = taskLib.getVariable("agent.tempDirectory") || "";
    taskLib.checkPath(tempDirectory, `${tempDirectory} (agent.tempDirectory)`);
    const scriptName = "command_" + uuidV4().replace(/-/g, "_");
    const scriptPath = path.join(tempDirectory, scriptName + ".m");
    await fs.writeFileSync(
        scriptPath,
        "cd('" + workingDirectory.replace(/'/g, "''") + "');\n" + command,
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
    runTool.arg("cd('" + tempDirectory.replace(/'/g, "''") + "');" + scriptName);
    const exitCode = await runTool.exec();
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToRunCommand"));
    }
}

run();
