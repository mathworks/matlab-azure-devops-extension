// Copyright 2020 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as path from "path";
import {platform} from "./utils";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const release = taskLib.getInput("release", true);
        await install(release as string);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, err.message);
    }
}

async function install(release: string) {
    const serverType = taskLib.getVariable("System.ServerType");
    if (!serverType || serverType.toLowerCase() !== "hosted") {
        throw new Error(taskLib.loc("InstallNotSupportedOnSelfHosted"));
    }

    // install core system dependencies
    let exitCode = await curlsh("https://ssd.mathworks.com/supportfiles/ci/matlab-deps/v0/install.sh", release);
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToExecuteInstallScript", exitCode));
    }

    // install ephemeral version of MATLAB
    exitCode = await curlsh("https://ssd.mathworks.com/supportfiles/ci/ephemeral-matlab/v0/ci-install.sh",
        ["--release", release]);
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToExecuteInstallScript", exitCode));
    }
}

// similar to "curl | sh"
async function curlsh(url: string, args: string | string[]) {
    // download script
    const scriptPath = await toolLib.downloadTool(url);

    // execute script
    const bashPath = taskLib.which("bash", true);
    let bash;
    if (platform() === "win32") {
        bash = taskLib.tool(bashPath);
    } else {
        bash = taskLib.tool("sudo").arg("-E").line(bashPath);
    }
    bash.arg(scriptPath);
    bash.arg(args);
    return bash.exec();
}

run();
