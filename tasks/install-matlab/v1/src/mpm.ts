// Copyright 2023-2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as trm from "azure-pipelines-task-lib/toolrunner";
import { Writable } from "stream";
import * as matlab from "./matlab";
import { downloadToolWithRetries } from "./utils";

export async function setup(platform: string, architecture: string): Promise<string> {
    const mpmRootUrl: string = "https://www.mathworks.com/mpm/";
    let mpmUrl: string;
    if (architecture !== "x64" && !(platform === "darwin" && architecture === "arm64")) {
        return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }
    let mpm: string;
    let exitCode: number;
    switch (platform) {
        case "win32":
            mpmUrl = mpmRootUrl + "win64/mpm";
            mpm = await downloadToolWithRetries(mpmUrl, "mpm.exe");
            break;
        case "linux":
            mpmUrl = mpmRootUrl + "glnxa64/mpm";
            mpm = await downloadToolWithRetries(mpmUrl, "mpm");
            exitCode = await taskLib.exec("chmod", ["+x", mpm]);
            if (exitCode !== 0) {
                return Promise.reject(Error("Unable to set up mpm."));
            }
            break;
        case "darwin":
            if (architecture === "x64") {
                mpmUrl = mpmRootUrl + "maci64/mpm";
            } else {
                mpmUrl = mpmRootUrl + "maca64/mpm";
            }
            mpm = await downloadToolWithRetries(mpmUrl, "mpm");
            exitCode = await taskLib.exec("chmod", ["+x", mpm]);
            if (exitCode !== 0) {
                return Promise.reject(Error("Unable to set up mpm."));
            }
            break;
        default:
            return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }
    return mpm;
}

export async function install(
    mpmPath: string,
    release: matlab.Release,
    destination: string,
    products: string,
): Promise<void> {
    let parsedProducts = products.split(" ");
    // Add MATLAB by default
    parsedProducts.push("MATLAB");
    // Remove duplicates
    parsedProducts = [...new Set(parsedProducts)];
    let mpmArguments: string[] = [
        "install",
        `--release=${release.name + release.update}`,
        `--destination=${destination}`,
    ];

    if (release.isPrerelease) {
        mpmArguments = mpmArguments.concat("--release-status=Prerelease");
    }
    mpmArguments = mpmArguments.concat("--products");
    mpmArguments = mpmArguments.concat(parsedProducts);

    let output = "";
    const captureStream = new Writable({
        write(chunk, encoding, callback) {
            const text = chunk.toString();
            output += text;
            process.stdout.write(text);
            callback();
        },
    });

    const options: trm.IExecOptions = {
        outStream: captureStream,
        errStream: captureStream,
        ignoreReturnCode: true,
    };

    const exitCode = await taskLib.exec(mpmPath, mpmArguments, options);

    if (exitCode !== 0 && !output.toLowerCase().includes("already installed")) {
        return Promise.reject(Error(`Failed to install MATLAB.`));
    }
    return;
}
