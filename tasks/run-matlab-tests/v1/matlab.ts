// Copyright 2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidV4 } from "uuid";

export async function runCommand(command: string, platform: string, architecture: string, args?: string) {
    // write command to script
    console.log(taskLib.loc("GeneratingScript", command));
    taskLib.assertAgent("2.115.0");
    const tempDirectory = taskLib.getVariable("agent.tempDirectory") || "";
    taskLib.checkPath(tempDirectory, `${tempDirectory} (agent.tempDirectory)`);
    const scriptName = "command_" + uuidV4().replace(/-/g, "_");
    const scriptPath = path.join(tempDirectory, scriptName + ".m");
    fs.writeFileSync(
        scriptPath,
        "cd(getenv('MW_ORIG_WORKING_FOLDER'));\n" + command,
        { encoding: "utf8" },
    );

    console.log("========================== Starting Command Output ===========================");
    const runToolPath = getRunMATLABCommandScriptPath(platform, architecture);
    fs.chmodSync(runToolPath, "777");
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

export function getRunMATLABCommandScriptPath(platform: string, architecture: string): string {
    if (architecture !== "x64") {
        const msg = `This task is not supported on ${platform} runners using the ${architecture} architecture.`;
        throw new Error(msg);
    }
    let ext;
    let platformDir;
    switch (platform) {
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
            throw new Error(
                `This task is not supported on ${platform} runners using the ${architecture} architecture.`,
            );
    }

    return path.join(__dirname, "bin", platformDir, `run-matlab-command${ext}`);
}
