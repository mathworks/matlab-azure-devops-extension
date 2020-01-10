import * as taskLib from "azure-pipelines-task-lib/task";
import { chmodSync } from "fs";
import * as path from "path";
import {platform} from "./utils";

async function run() {
    try {
        const options: IRunTestsOptions = {};
        if (taskLib.filePathSupplied("testResultsJUnit")) {
            options.JUnitTestResults = taskLib.getPathInput("testResultsJUnit");
        }
        await runTests(options);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, err.message);
    }
}

async function runTests(options: IRunTestsOptions) {
    // prepare name-value pairs
    const pairs: string[] = [];
    Object.keys(options).forEach((name) => {
        pairs.push(name, (options as any)[name]);
    });

    // generate and run MATLAB test script
    const runToolPath = path.join(__dirname, "bin", "run_matlab_command." + (platform() === "win32" ? "bat" : "sh"));
    chmodSync(runToolPath, "777");
    const runTool = taskLib.tool(runToolPath);
    runTool.arg([
        "addpath('" + path.join(__dirname, "scriptgen") + "');" +
        `testScript = genscript('Test','WorkingFolder','..'${pairs.length === 0 ? "" : ",'" + pairs.join("','") + "'"});` +
        "run(testScript.writeToFile('.mw/runAllTests.m'));"]);
    const exitCode = await runTool.exec();
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToRunTests"));
    }
}

interface IRunTestsOptions {
    JUnitTestResults?: string;
}

run();
