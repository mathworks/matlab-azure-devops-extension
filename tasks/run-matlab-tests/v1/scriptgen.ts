// Copyright 2024 The MathWorks, Inc.

import * as path from "path";

export interface IRunTestsOptions {
    JUnitTestResults?: string;
    CoberturaCodeCoverage?: string;
    SourceFolder?: string;
    PDFTestReport?: string;
    SimulinkTestResults?: string;
    CoberturaModelCoverage?: string;
    SelectByTag?: string;
    SelectByFolder?: string;
    Strict?: boolean;
    UseParallel?: boolean;
    OutputDetail?: string;
    LoggingLevel?: string;
}

export function generateCommand(options: IRunTestsOptions): string {
   return `addpath('${path.join(__dirname, "scriptgen")}');` +
        `testScript = genscript('Test',` +
            `'JUnitTestResults','${options.JUnitTestResults || ""}',` +
            `'CoberturaCodeCoverage','${options.CoberturaCodeCoverage || ""}',` +
            `'SourceFolder','${options.SourceFolder || ""}',` +
            `'PDFTestReport','${options.PDFTestReport || ""}',` +
            `'SimulinkTestResults','${options.SimulinkTestResults || ""}',` +
            `'CoberturaModelCoverage','${options.CoberturaModelCoverage || ""}',` +
            `'SelectByTag','${options.SelectByTag || ""}',` +
            `'SelectByFolder','${options.SelectByFolder || ""}',` +
            `'Strict',${options.Strict || false},` +
            `'UseParallel',${options.UseParallel || false},` +
            `'OutputDetail','${options.OutputDetail || ""}',` +
            `'LoggingLevel','${options.LoggingLevel || ""}');` +
        `disp('Running MATLAB script with contents:');` +
        `disp(testScript.Contents);` +
        `fprintf('__________\\n\\n');` +
        `run(testScript);`
        .replace(/$\n^\s*/gm, " ")
        .trim(); // replace ending newlines and starting spaces
}
