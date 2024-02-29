// Copyright 2020-2023 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as path from "path";
import * as matlab from "./matlab";

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
        const cmd = generateCommand(options);
        const platform = process.platform;
        const architecture = process.arch;
        await matlab.runCommand(cmd, platform, architecture, startupOpts);

    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

function generateCommand(options: IRunTestsOptions): string {
   return `addpath('${path.join(__dirname, "scriptgen")}');` +
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
        `run(testScript);`;
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
