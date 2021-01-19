// Copyright 2020 The MathWorks, Inc.

import * as path from "path";

export const runCmdPath = path.join(path.dirname(__dirname), "bin", "run_matlab_command");

export function runCmdArg(
                    junit: string,
                    cobertura: string,
                    source: string,
                    selectByFolder: string,
                    selectByTag: string,
                    coberturaModelCoverage: string,
                    simulinkTestResults: string,
                    testResultsPDF: string,
                ) {
    return "addpath('" + path.join(path.dirname(__dirname), "scriptgen") + "');" +
        "testScript = genscript('Test'," +
            "'JUnitTestResults','" + junit + "'," +
            "'CoberturaCodeCoverage','" + cobertura + "'," +
            "'SourceFolder','" + source + "'," +
            "'SelectByFolder','" + selectByFolder + "'," +
            "'SelectByTag','" + selectByTag + "'," +
            "'CoberturaModelCoverage','" + coberturaModelCoverage + "'," +
            "'SimulinkTestResults','" + simulinkTestResults + "'," +
            "'PDFTestReport','" + testResultsPDF + "');" +
        `disp('Running MATLAB script with contents:');` +
        `disp(testScript.Contents);` +
        `fprintf('__________\\n\\n');` +
        `run(testScript);`;
}
