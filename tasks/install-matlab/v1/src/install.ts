// Copyright 2023-2024 The MathWorks, Inc.

import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as path from "path";
import * as matlab from "./matlab";
import * as mpm from "./mpm";
import * as script from "./script";

export async function install(platform: string, architecture: string, release: string, products: string) {
    const parsedRelease: matlab.Release = await matlab.getReleaseInfo(release);
    if (parsedRelease.name < "r2020b") {
        throw new Error(`Release '${parsedRelease.name}' is not supported. Use 'R2020b' or a later release.`);
    }

    // install core system dependencies on Linux
    let exitCode = 0;
    if (platform === "linux") {
        const depArgs: string[] = [parsedRelease.name];
        exitCode = await script.downloadAndRunScript(platform, "https://ssd.mathworks.com/supportfiles/ci/matlab-deps/v0/install.sh", depArgs);
        if (exitCode !== 0) {
            throw new Error("Failed to install core system dependencies.");
        }
    }

    // setup mpm
    const mpmPath: string = await mpm.setup(platform, architecture);

    // install MATLAB using mpm
    const [toolpath, alreadyExists] = await matlab.makeToolcacheDir(parsedRelease, platform);
    if (!alreadyExists) {
        await mpm.install(mpmPath, parsedRelease, toolpath, products);
    }

    // add MATLAB to system path
    try {
        toolLib.prependPath(path.join(toolpath, "bin"));
    } catch (err: any) {
        throw new Error("Failed to add MATLAB to system path.");
    }

    // install matlab-batch
    await matlab.setupBatch(platform, architecture);
}
