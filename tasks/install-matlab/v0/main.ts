// Copyright 2020-2022 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as path from "path";
import {architecture, platform} from "./utils";

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

    if (architecture() !== "x64") {
        const msg = `This task is not supported on ${platform()} runners using the ${architecture()} architecture.`;
        throw new Error(msg);
    }

    let exitCode = 0;
    if (!release || release.toLowerCase() === "latest") {
        release = "r2022b";
    }

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

    // setup mpm
    const mpmRootUrl: string = "https://www.mathworks.com/mpm/";
    let mpmUrl: string;
    switch (platform()) {
        case "win32":
            mpmUrl = mpmRootUrl + "win64/mpm";
            break;
        case "linux":
            mpmUrl = mpmRootUrl + "glnxa64/mpm";
            break;
        default:
            return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }
    let mpm: string = await toolLib.downloadTool(mpmUrl);
    if (platform() === "win32") {
       const mpmExtractedPath: string = await toolLib.extractZip(mpm);
       mpm = path.join(mpmExtractedPath, "bin", "win64",  "mpm.exe");
    }

    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to set up mpm."));
    }

    // install MATLAB using mpm
    let toolpath: string = toolLib.findLocalTool("MATLAB", "2022.2.0");
    let alreadyExists = false;
    if (toolpath) {
        // core.info(`Found MATLAB ${release} in cache at ${toolpath}.`);
        alreadyExists = true;
    } else {
        fs.writeFileSync(".keep", "");
        toolpath = await toolLib.cacheFile(".keep", ".keep", "MATLAB", "2022.2.0");
    }

    // remove spaces and flatten product list
    // let parsedProducts = products.flatMap(p => p.split(" "));
    let parsedProducts = [];
    // Add MATLAB and PCT by default
    parsedProducts.push("MATLAB", "Parallel_Computing_Toolbox");
    // Remove duplicates
    parsedProducts = [...new Set(parsedProducts)];
    let mpmArguments: string[] = [
        "install",
        `--release=${release}`,
        `--destination=${toolpath}`,
        "--products",
    ];
    mpmArguments = mpmArguments.concat(parsedProducts);

    exitCode = await taskLib.exec(mpm, mpmArguments);
    try {
        toolLib.prependPath(path.join(toolpath, "bin"));
    } catch (err: any) {
        throw new Error(taskLib.loc("FailedToAddToPath", err.message));
    }

    // install matlab-batch
    const batchInstallDir = installRoot("matlab-batch");
    exitCode = await curlsh("https://ssd.mathworks.com/supportfiles/ci/matlab-batch/v0/install.sh", batchInstallDir);
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToExecuteInstallScript", exitCode));
    }
    try {
        toolLib.prependPath(batchInstallDir);
    } catch (err: any) {
        throw new Error(taskLib.loc("FailedToAddToPath", err.message));
    }

    if (exitCode !== 0) {
        return Promise.reject(Error(`Script exited with non-zero code ${exitCode}`));
    }

}

function installRoot(programName: string) {
    let installDir: string;
    if (platform() === "win32") {
        installDir = path.join("C:", "Program Files", programName);
    } else {
        installDir = path.join("/", "opt", programName);
    }
    return installDir;
}

// similar to "curl | sh"
async function curlsh(url: string, args: string | string[]) {
    // download script
    const scriptPath = await toolLib.downloadTool(url);

    const bash = sh();
    bash.arg(scriptPath);
    bash.arg(args);
    return bash.exec();
}

function sh() {
    // execute script
    const bashPath = taskLib.which("bash", true);
    let bash;
    if (platform() === "win32") {
        bash = taskLib.tool(bashPath);
    } else {
        bash = taskLib.tool("sudo").arg("-E").line(bashPath);
    }
    return bash;
}

run();
