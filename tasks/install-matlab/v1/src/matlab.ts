// Copyright 2023-2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as script from "./script";
import { downloadToolWithRetries } from "./utils";

export interface Release {
    name: string;
    version: string;
    update: string;
    isPrerelease: boolean;
}

export async function makeToolcacheDir(release: Release, platform: string): Promise<[string, boolean]> {
    let toolpath: string = toolLib.findLocalTool("MATLAB", release.version);
    let alreadyExists = false;
    if (toolpath) {
        alreadyExists = true;
    } else {
        if (platform === "win32") {
            toolpath = await windowsHostedToolpath(release).catch(async () => {
                return await defaultToolpath(release);
            });
        } else {
            toolpath = await defaultToolpath(release);
        }
    }
    if (platform === "darwin") {
        toolpath = toolpath + "/MATLAB.app";
    }
    return [toolpath, alreadyExists];
}

export async function defaultToolpath(release: Release): Promise<string> {
    fs.writeFileSync(".keep", "");
    return await toolLib.cacheFile(".keep", ".keep", "MATLAB", release.version);
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
    fs.mkdirSync(actualToolCacheDir, {recursive: true});
    fs.mkdirSync(path.dirname(defaultToolCacheDir), {recursive: true});
    fs.symlinkSync(actualToolCacheDir, defaultToolCacheDir, "junction");
    fs.writeFileSync(`${defaultToolCacheDir}.complete`, "");
    return actualToolCacheDir;
}

export async function getReleaseInfo(release: string): Promise<Release> {
    // Get release name from input parameter
    let name: string;
    let isPrerelease: boolean = false;
    if (release.toLowerCase().trim() === "latest") {
        name = await fetchReleaseInfo("latest");
    } else if (release.toLowerCase().trim() === "latest-including-prerelease") {
        name = await fetchReleaseInfo("latest-including-prerelease");
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
        if (name.includes("prerelease")) {
            name = name.replace("prerelease", "");
            version += "-prerelease";
            isPrerelease = true;
        }
    }

    return {
        name,
        version,
        update,
        isPrerelease,
    };
}

async function fetchReleaseInfo(name: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(`https://ssd.mathworks.com/supportfiles/ci/matlab-release/v0/${name}`, (resp) => {
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
    if (architecture !== "x64" && !(platform === "darwin" && architecture === "arm64")) {
        return Promise.reject(Error(`This task is not supported on ${platform} runners using the ${architecture} architecture.`));
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
            if (architecture === "x64") {
                matlabBatchUrl = matlabBatchRootUrl + "maci64/matlab-batch";
            } else {
                matlabBatchUrl = matlabBatchRootUrl + "maca64/matlab-batch";
            }
            break;
        default:
            return Promise.reject(Error(`This task is not supported on ${platform} runners.`));
    }

    const tempPath = await downloadToolWithRetries(matlabBatchUrl, `matlab-batch${matlabBatchExt}`);
    const matlabBatchPath = await toolLib.cacheFile(tempPath, `matlab-batch${matlabBatchExt}`, "matlab-batch", "1.0.0");
    try {
        toolLib.prependPath(matlabBatchPath);
    } catch (err: any) {
        throw new Error("Failed to add MATLAB to system path.");
    }
    if (platform !== "win32") {
        const exitCode = await taskLib.exec(
            "chmod",
            ["+x", path.join(matlabBatchPath, "matlab-batch" + matlabBatchExt)],
        );
        if (exitCode !== 0) {
            return Promise.reject(Error("Unable to add execute permissions to matlab-batch binary."));
        }
    }
}

export async function installSystemDependencies(platform: string, architecture: string, release: string) {
    if (platform === "linux") {
        const exitCode = await script.downloadAndRunScript(platform, "https://ssd.mathworks.com/supportfiles/ci/matlab-deps/v0/install.sh", [release]);
        if (exitCode !== 0) {
            return Promise.reject(Error("Unable to install core dependencies."));
        }
    } else if (platform === "darwin" && architecture === "arm64") {
        if (release < "r2023b") {
            return installAppleSiliconRosetta();
        } else {
            return installAppleSiliconJdk();
        }
    }
}

async function installAppleSiliconRosetta() {
    const exitCode = await taskLib.exec("sudo", ["softwareupdate", "--install-rosetta", "--agree-to-licenses"]);
    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to install Rosetta 2."));
    }
}

async function installAppleSiliconJdk() {
    const jdk = await downloadToolWithRetries(
        "https://corretto.aws/downloads/resources/8.402.08.1/amazon-corretto-8.402.08.1-macosx-aarch64.pkg",
        "jdk.pkg",
    );

    const exitCode = await taskLib.exec("sudo", ["installer", "-pkg", `"${jdk}"`, "-target", "/"]);
    if (exitCode !== 0) {
        return Promise.reject(Error("Unable to install Java runtime."));
    }
}
