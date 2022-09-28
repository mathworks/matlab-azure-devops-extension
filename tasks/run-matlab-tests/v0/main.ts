// Copyright 2020 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import { chmodSync } from "fs";
import * as path from "path";
import { architecture, platform } from "./utils";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const options: IRunTestsOptions = {
            JUnitTestResults: taskLib.getInput("testResultsJUnit"),
            CoberturaCodeCoverage: taskLib.getInput("codeCoverageCobertura"),
            SourceFolder: taskLib.getInput("sourceFolder"),
            SelectByFolder: taskLib.getInput("selectByFolder"),
            SelectByTag: taskLib.getInput("selectByTag"),
            CoberturaModelCoverage: taskLib.getInput("modelCoverageCobertura"),
            SimulinkTestResults: taskLib.getInput("testResultsSimulinkTest"),
            PDFTestReport: taskLib.getInput("testResultsPDF"),
            UseParallel: taskLib.getBoolInput("useParallel"),
            Strict: taskLib.getBoolInput("strict"),
            LoggingLevel: taskLib.getInput("loggingLevel"),
            OutputDetail: taskLib.getInput("outputDetail")};
        await runTests(options);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

async function runTests(options: IRunTestsOptions) {
    if (architecture() !== "x64") {
        const msg = `This task is not supported on ${platform()} runners using the ${architecture()} architecture.`;
        throw new Error(msg);
    }
    let ext;
    let platformDir;
    switch (platform()) {
        case "win32":
            ext = ".exe";
            platformDir = "win64";
            break;
        case "darwin":
            ext = "";
            platformDir = "maci64";
            break;
        case "linux":
            ext = "";
            platformDir = "glnxa64";
            break;
        default:
            throw new Error(`This task is not supported on ${platform()} runners using the ${architecture()} architecture.`);
    }
    const runToolPath = path.join(__dirname, "bin", platformDir, `run-matlab-command${ext}`);
    chmodSync(runToolPath, "777");
    const runTool = taskLib.tool(runToolPath);
    runTool.arg(`addpath('${path.join(__dirname, "scriptgen")}');` +
        `testScript = genscript('Test',` +
            `'JUnitTestResults','${options.JUnitTestResults || ""}',` +
            `'CoberturaCodeCoverage','${options.CoberturaCodeCoverage || ""}',` +
            `'SourceFolder','${options.SourceFolder || ""}',` +
            `'SelectByFolder','${options.SelectByFolder || ""}',` +
            `'SelectByTag','${options.SelectByTag || ""}',` +
            `'CoberturaModelCoverage','${options.CoberturaModelCoverage || ""}',` +
            `'SimulinkTestResults','${options.SimulinkTestResults || ""}',` +
            `'PDFTestReport','${options.PDFTestReport || ""}',` +
            `'UseParallel',${options.UseParallel || false},` +
            `'Strict',${options.Strict || false},` +
            `'LoggingLevel','${options.LoggingLevel || "Terse"}',` +
            `'OutputDetail','${options.OutputDetail || ""}');` +
        `disp('Running MATLAB script with contents:');` +
        `disp(testScript.Contents);` +
        `fprintf('__________\\n\\n');` +
        `run(testScript);`);
    const exitCode = await runTool.exec();
    if (exitCode !== 0) {
        throw new Error(taskLib.loc("FailedToRunTests"));
    }
}

interface IRunTestsOptions {
    JUnitTestResults?: string;
    CoberturaCodeCoverage?: string;
    SourceFolder?: string;
    SelectByFolder?: string;
    SelectByTag?: string;
    CoberturaModelCoverage?: string;
    SimulinkTestResults?: string;
    PDFTestReport?: string;
    UseParallel?: boolean;
    Strict?: boolean;
    LoggingLevel?: string;
    OutputDetail?: string;
}

run();
