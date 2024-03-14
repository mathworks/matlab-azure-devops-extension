// Copyright 2023-2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import { downloadToolIfNecessary } from "./utils";

export interface Release {
    name: string;
    version: string;
    update: string;
}

export async function makeToolcacheDir(release: Release, platform: string): Promise<[string, boolean]> {
    let toolpath: string = toolLib.findLocalTool("MATLAB", release.version);
    let alreadyExists = false;
    if (toolpath) {
        alreadyExists = true;
    } else {
        if (platform === "win32") {
            toolpath = await windowsHostedToolpath(release).catch(async () => {
                return await defaultToolpath(release, platform);
            });
        } else {
            toolpath = await defaultToolpath(release, platform);
        }
    }
    return [toolpath, alreadyExists];
}

export async function defaultToolpath(release: Release, platform: string): Promise<string> {
    fs.writeFileSync(".keep", "");
    let toolpath = await toolLib.cacheFile(".keep", ".keep", "MATLAB", release.version);
    if (platform === "darwin") {
        toolpath = toolpath + "/MATLAB.app";
    }
    return toolpath;
}

async function windowsHostedToolpath(release: Release): Promise<string> {
    const defaultToolCacheRoot = taskLib.getVariable("Agent.ToolsDirectory");

    // only apply optimization for microsoft hosted runners with a defined tool cache directory
    if (taskLib.getAgentMode() !== taskLib.AgentHostedMode.MsHosted || !defaultToolCacheRoot) {
        return Promise.reject();
    }

    // make sure runner has expected directory structure
    if (!fs.existsSync("d:\\") || !fs.existsSync("c:\\")) {
        return Promise.reject();
    }

    const defaultToolCacheDir =  path.join(defaultToolCacheRoot, "MATLAB", release.version, "x64");
    const actualToolCacheDir = defaultToolCacheDir.replace("C:", "D:").replace("c:", "d:");

    // create install directory and link it to the toolcache directory
    fs.mkdirSync(actualToolCacheDir, { recursive: true });
    fs.mkdirSync(path.dirname(defaultToolCacheDir), {recursive: true});
    fs.symlinkSync(actualToolCacheDir, defaultToolCacheDir, "junction");
    fs.writeFileSync(`${defaultToolCacheDir}.complete`, "");
    return actualToolCacheDir;
}

export async function getReleaseInfo(release: string): Promise<Release> {
    // Get release name from input parameter
    let name: string;
    if (release.toLowerCase().trim() === "latest") {
        name = await resolveLatest();
    } else {
        const nameMatch = release.toLowerCase().match(/r[0-9]{4}[a-b]/);
        if (!nameMatch) {
            return Promise.reject(Error(`${release} is invalid or unsupported. Specify the value as R2020a or a later release.`));
        }
        name = nameMatch[0];
    }

    // create semantic version of format year.semiannual.update from release
    const year = name.slice(1, 5);
    const semiannual = name[5] === "a" ? "1" : "2";
    const updateMatch = release.toLowerCase().match(/u[0-9]+/);
    let version = `${year}.${semiannual}`;
    let update: string;
    if (updateMatch) {
        update = updateMatch[0];
        version += `.${update[1]}`;
    } else {
        update = "Latest";
        version += ".999";
    }

    return {
        name,
        version,
        update,
    };
}

async function resolveLatest(): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get("https://ssd.mathworks.com/supportfiles/ci/matlab-release/v0/latest", (resp) => {
            if (resp.statusCode !== 200) {
                reject(Error(`Unable to retrieve latest MATLAB release information. Contact MathWorks at continuous-integration@mathworks.com if the problem persists.`));
            }
            resp.on("data", (d) => {
                resolve(d.toString());
            });
        });
    });
}

export async function setupBatch(platform: string, architecture: string) {
    if (architecture !== "x64") {
        return Promise.reject(Error(`This action is not supported on ${platform} runners using the ${architecture} architecture.`));
    }

    const matlabBatchRootUrl: string = "https://ssd.mathworks.com/supportfiles/ci/matlab-batch/v1/";
    let matlabBatchUrl: string;
    let matlabBatchExt: string = "";
    switch (platform) {
        case "win32":
            matlabBatchExt = ".exe";
            matlabBatchUrl = matlabBatchRootUrl + "win64/matlab-batch.exe";
            break;
        case "linux":
            matlabBatchUrl = matlabBatchRootUrl + "glnxa64/matlab-batch";
            break;
        case "darwin":
            matlabBatchUrl = matlabBatchRootUrl + "maci64/matlab-batch";
            break;
        default:
            return Promise.reject(Error(`This action is not supported on ${platform} runners.`));
    }

    const tempPath = await downloadToolIfNecessary(matlabBatchUrl, `matlab-batch${matlabBatchExt}`);
    const matlabBatchPath = await toolLib.cacheFile(tempPath, `matlab-batch${matlabBatchExt}`, "matlab-batch", "1.0.0");
    try {
        toolLib.prependPath(matlabBatchPath);
    } catch (err: any) {
        throw new Error("Failed to add MATLAB to system path.");
    }
    const exitCode = await taskLib.exec("chmod", ["+x", path.join(matlabBatchPath, "matlab-batch" + matlabBatchExt)]);
    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to add execute permissions to matlab-batch binary."));
    }
    return;
}
