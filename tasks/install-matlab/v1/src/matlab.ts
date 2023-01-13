// Copyright 2023 The MathWorks, Inc.

import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as https from "https";
import * as script from "./script";

export interface Release {
    name: string;
    version: string;
    update: string;
}

export async function makeToolcacheDir(release: Release): Promise<[string, boolean]> {
    let toolpath: string = toolLib.findLocalTool("MATLAB", release.version);
    let alreadyExists = false;
    if (toolpath) {
        alreadyExists = true;
    } else {
        fs.writeFileSync(".keep", "");
        toolpath = await toolLib.cacheFile(".keep", ".keep", "MATLAB", release.version);
    }
    return [toolpath, alreadyExists];
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

export async function setupBatch(platform: string): Promise<void> {
    const batchInstallDir = script.defaultInstallRoot(platform, "matlab-batch");
    const exitCode = await script.downloadAndRunScript(platform, "https://ssd.mathworks.com/supportfiles/ci/matlab-batch/v0/install.sh", batchInstallDir);

    if (exitCode !== 0) {
        return Promise.reject(Error(`Failed to install matlab-batch. Script exited with non-zero code ${exitCode}.`));
    }

    try {
        toolLib.prependPath(batchInstallDir);
    } catch (err: any) {
        throw new Error("Failed to add MATLAB to system path.");
    }
    return;
}
