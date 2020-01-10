import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import {platform} from "./utils";

async function run() {
    try {
        await install();
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, err.message);
    }
}

async function install() {
    // download install bash script
    let scriptPath;
    try {
        scriptPath = await toolLib.downloadTool("https://storage.googleapis.com/matlabimagesus/public/ephemeral-matlab/v0/install.sh");
    } catch (err) {
        throw new Error(taskLib.loc("FailedToDownloadInstallScript", err.message));
    }

    // execute install bash script
    const bashPath = taskLib.which("bash", true);
    let bash;
    if (platform() === "win32") {
        bash = taskLib.tool(bashPath);
    } else {
        bash = taskLib.tool("sudo").arg("-E").line(bashPath);
    }
    bash.arg(scriptPath);
    const exitCode = await bash.exec();
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToExecuteInstallScript", exitCode));
    }
}

run();
