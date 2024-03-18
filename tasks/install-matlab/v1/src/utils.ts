// Copyright 2023-2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as path from "path";

export async function downloadTool(url: string, fileName: string): Promise<string> {
    let destPath: string;
    if (path.isAbsolute(fileName)) {
        destPath = fileName;
    } else {
        const tempDirectory = taskLib.getVariable("Agent.TempDirectory");
        if (!tempDirectory) {
            throw new Error("Agent.TempDirectory is not set");
        }
        destPath = path.join(tempDirectory, fileName);
    }

    taskLib.rmRF(destPath);
    await toolLib.downloadTool(url, destPath);
    return destPath;
}
