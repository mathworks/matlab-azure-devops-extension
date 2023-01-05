// Copyright 2023 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as path from "path";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import * as script from "./script";

export async function install(platform: string, architecture: string, release: string, products: string) {
    // verify runner compatibility
    const serverType = taskLib.getVariable("System.ServerType");
    if (!serverType || serverType.toLowerCase() !== "hosted") {
        throw new Error(taskLib.loc("InstallNotSupportedOnSelfHosted"));
    }

    if (architecture !== "x64") {
        const msg = `This task is not supported on ${platform} runners using the ${architecture} architecture.`;
        throw new Error(msg);
    }

    const parsedRelease: matlab.IRelease = await matlab.getReleaseInfo(release);

    // install core system dependencies on Linux
    let exitCode = 0;
    if (platform === "linux") {
        const depArgs: string[] = [];
        if (release !== undefined) {
            depArgs.push(parsedRelease.name);
        }
        exitCode = await script.downloadAndRunScript(platform, "https://ssd.mathworks.com/supportfiles/ci/matlab-deps/v0/install.sh", depArgs);
        if (exitCode !== 0) {
            throw new Error(taskLib.loc("FailedToExecuteInstallScript", exitCode));
        }
    }

    // setup mpm
    const mpmPath: string = await mpm.setup(platform, architecture);

    // install MATLAB using mpm
    const [toolpath, alreadyExists] = await matlab.makeToolcacheDir(parsedRelease);
    if (!alreadyExists) {
        await mpm.install(mpmPath, parsedRelease, toolpath, products);
    }

    // add MATLAB to system path
    try {
        toolLib.prependPath(path.join(toolpath, "bin"));
    } catch (err: any) {
        throw new Error(taskLib.loc("FailedToAddToPath", err.message));
    }

    // install matlab-batch
    await matlab.setupBatch(platform);
}
