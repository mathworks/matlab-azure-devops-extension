// Copyright 2023 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as path from "path";

export async function downloadAndRunScript(platform: string, url: string, args: string | string[]) {
    const scriptPath = await toolLib.downloadTool(url);
    const bashPath = taskLib.which("bash", true);
    const sudoPath = taskLib.which("sudo", false);
    let bash;
    if (!sudoPath) {
        bash = taskLib.tool(bashPath);
    } else {
        bash = taskLib.tool("sudo").arg("-E").line(bashPath);
    }
    bash.arg(scriptPath);
    bash.arg(args);
    return bash.exec();
}

export function defaultInstallRoot(platform: string, programName: string) {
    let installDir: string;
    if (platform === "win32") {
        installDir = path.join("C:", "Program Files", programName);
    } else {
        installDir = path.join("/", "opt", programName);
    }
    return installDir;
}
