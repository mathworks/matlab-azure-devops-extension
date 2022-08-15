// Copyright 2020-2022 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {platform} from "./utils";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const release = taskLib.getInput("release");
        await install(release);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

async function install(release?: string) {
    const serverType = taskLib.getVariable("System.ServerType");
    if (!serverType || serverType.toLowerCase() !== "hosted") {
        throw new Error(taskLib.loc("InstallNotSupportedOnSelfHosted"));
    }

    const tmpDir = taskLib.getVariable("Agent.TempDirectory");
    if (!tmpDir) {
        throw new Error("Expected Agent.TempDirectory to be set");
    }

    let exitCode = 0;

    // install core system dependencies on Linux
    if (platform() === "linux") {
        const depArgs: string[] = [];
        if (release !== undefined) {
            depArgs.push(release);
        }
        exitCode = await curlsh("https://ssd.mathworks.com/supportfiles/ci/matlab-deps/v0/install.sh", depArgs);
        if (exitCode !== 0) {
            throw new Error(taskLib.loc("FailedToExecuteInstallScript", exitCode));
        }
    }

    // install matlab-batch
    const batchInstallDir = path.join(tmpDir, "matlab-batch");
    const batchInstallArgs: string[] = [];
    batchInstallArgs.push("\"" + batchInstallDir + "\"");
    exitCode = await curlsh("https://ssd.mathworks.com/supportfiles/ci/matlab-batch/v0/install.sh", batchInstallArgs);
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToExecuteInstallScript", exitCode));
    }
    try {
        toolLib.prependPath(batchInstallDir);
    } catch (err: any) {
        throw new Error(taskLib.loc("FailedToAddToPath", err.message));
    }

    // install ephemeral version of MATLAB
    const installArgs: string[] = [];
    if (release !== undefined) {
        installArgs.push("--release", release);
    }
    const skipActivation = skipActivationFlag(process.env);
    if (skipActivation) {
        installArgs.push(skipActivation);
    }

    exitCode = await curlsh("https://ssd.mathworks.com/supportfiles/ci/ephemeral-matlab/v0/ci-install.sh", installArgs);
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToExecuteInstallScript", exitCode));
    }

    // prepend MATLAB to path
    let root: string;
    try {
        root = fs.readFileSync(path.join(os.tmpdir(), "ephemeral_matlab_root")).toString();
        toolLib.prependPath(path.join(root, "bin"));
    } catch (err: any) {
        throw new Error(taskLib.loc("FailedToAddToPath", err.message));
    }
}

export function skipActivationFlag(env: NodeJS.ProcessEnv): string {
    return (env.MATHWORKS_TOKEN !== undefined && env.MATHWORKS_ACCOUNT !== undefined) ? "--skip-activation" : "";
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
