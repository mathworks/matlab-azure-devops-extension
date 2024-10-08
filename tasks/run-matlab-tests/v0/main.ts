// Copyright 2020-2023 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
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
            Strict: taskLib.getBoolInput("strict"),
            UseParallel: taskLib.getBoolInput("useParallel"),
            OutputDetail: taskLib.getInput("outputDetail"),
            LoggingLevel: taskLib.getInput("loggingLevel")};
        const startupOpts: string | undefined = taskLib.getInput("startupOptions");
        await runTests(options, startupOpts);
    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

async function runTests(options: IRunTestsOptions, args?: string) {
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
    const binDir = path.join(__dirname, "bin", platformDir);
    const runToolPath = path.join(binDir, `run-matlab-command${ext}`);
    if (!taskLib.exist(runToolPath)) {
        const zipPath = path.join(binDir, "run-matlab-command.zip");
        await toolLib.extractZip(zipPath, binDir);
    }

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
            `'Strict',${options.Strict || false},` +
            `'UseParallel',${options.UseParallel || false},` +
            `'OutputDetail','${options.OutputDetail || ""}',` +
            `'LoggingLevel','${options.LoggingLevel || ""}');` +
        `disp('Running MATLAB script with contents:');` +
        `disp(testScript.Contents);` +
        `fprintf('__________\\n\\n');` +
        `run(testScript);`);

    if (args) {
        runTool.arg(args.split(" "));
    }

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
    Strict?: boolean;
    UseParallel?: boolean;
    OutputDetail?: string;
    LoggingLevel?: string;
}

run();
