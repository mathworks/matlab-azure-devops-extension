// Copyright 2023-2024 The MathWorks, Inc.

import {AgentHostedMode, getAgentMode} from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as path from "path";
import * as matlab from "./matlab";
import * as mpm from "./mpm";

export async function install(platform: string, architecture: string, release: string, products: string) {
    const parsedRelease: matlab.Release = await matlab.getReleaseInfo(release);
    if (parsedRelease.name < "r2020b") {
        throw new Error(`Release '${parsedRelease.name}' is not supported. Use 'R2020b' or a later release.`);
    }

    // install core system dependencies on Linux and Apple silicon on cloud-hosted agents
    if (getAgentMode() === AgentHostedMode.MsHosted) {
        await matlab.installSystemDependencies(platform, architecture, parsedRelease.name);
    }

    // Use Intel MATLAB for releases before R2023b
    let matlabArch = architecture;
    if (platform === "darwin" && architecture === "arm64" && parsedRelease.name < "r2023b") {
        matlabArch = "x64";
    }

    // setup mpm
    const mpmPath: string = await mpm.setup(platform, matlabArch);

    // install MATLAB using mpm
    const [toolpath] = await matlab.makeToolcacheDir(parsedRelease, platform);
    await mpm.install(mpmPath, parsedRelease, toolpath, products);

    // add MATLAB to system path
    try {
        toolLib.prependPath(path.join(toolpath, "bin"));
    } catch (err: any) {
        throw new Error("Failed to add MATLAB to system path.");
    }

    // install matlab-batch
    await matlab.setupBatch(platform, matlabArch);

    // add MATLAB Runtime to system path on Windows
    if (platform === "win32") {
        try {
            const runtimePath = path.join(toolpath, "runtime", matlabArch === "x86" ? "win32" : "win64");
            if (fs.existsSync(runtimePath)) {
                toolLib.prependPath(runtimePath);
            }
        } catch (err: any) {
            throw new Error("Failed to add MATLAB Runtime to system path on windows.");
        }
    }
}
