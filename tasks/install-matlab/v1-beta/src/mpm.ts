// Copyright 2023 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as path from "path";
import * as matlab from "./matlab";

export async function setup(platform: string, architecture: string): Promise<string> {
    const mpmRootUrl: string = "https://www.mathworks.com/mpm/";
    let mpmUrl: string;
    if (architecture !== "x64") {
        return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }
    switch (platform) {
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
    if (platform === "win32") {
        const mpmExtractedPath: string = await toolLib.extractZip(mpm);
        mpm = path.join(mpmExtractedPath, "bin", "win64",  "mpm.exe");
    } else {
        const exitCode = await taskLib.exec("chmod", ["+x", mpm]);
        if (exitCode !== 0) {
            return Promise.reject(Error("Unable to set up mpm."));
        }
    }
    return mpm;
}

export async function install(
    mpmPath: string,
    release: matlab.IRelease,
    destination: string,
    products: string,
): Promise<void> {
    let parsedProducts = products.split(" ");
    // Add MATLAB and PCT by default
    parsedProducts.push("MATLAB", "Parallel_Computing_Toolbox");
    // Remove duplicates
    parsedProducts = [...new Set(parsedProducts)];
    let mpmArguments: string[] = [
        "install",
        `--release=${release.name + release.update}`,
        `--destination=${destination}`,
        "--products",
    ];
    mpmArguments = mpmArguments.concat(parsedProducts);

    const exitCode = await taskLib.exec(mpmPath, mpmArguments);
    if (exitCode !== 0) {
        return Promise.reject(Error(`Failed to install MATLAB.`));
    }
    return;
}
