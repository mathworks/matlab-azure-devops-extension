import * as taskLib from "azure-pipelines-task-lib/task";
import { chmodSync } from "fs";
import * as path from "path";
import {platform} from "./utils";

async function run() {
    try {
        const command = taskLib.getInput("command", true);
        await runCommand(command as string);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, err.message);
    }
}

async function runCommand(command: string) {
    const runToolPath = path.join(__dirname, "bin", "run_matlab_command." + (platform() === "win32" ? "bat" : "sh"));
    chmodSync(runToolPath, "777");
    const runTool = taskLib.tool(runToolPath);
    runTool.arg(command);
    const exitCode = await runTool.exec();
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToRunCommand"));
    }
}

run();
