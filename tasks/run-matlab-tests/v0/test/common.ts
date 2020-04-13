// Copyright 2020 The MathWorks, Inc.

import * as path from "path";

export const runCmdPath = path.join(path.dirname(__dirname), "bin", "run_matlab_command");

export function runCmdArg(junit: string, cobertura: string, source: string) {
    return "addpath('" + path.join(path.dirname(__dirname), "scriptgen") + "');" +
        "testScript = genscript('Test','WorkingFolder','..'," +
            "'JUnitTestResults','" + junit + "'," +
            "'CoberturaCodeCoverage','" + cobertura + "'," +
            "'SourceFolder','" + source + "');" +
        `scriptFolder = '.matlab';` +
        `scriptPath = fullfile(scriptFolder, 'runAllTests.m');` +
        `testScript.writeToFile(scriptPath);` +
        `disp(['Running ''' scriptPath ''':']);` +
        `type(scriptPath);` +
        `fprintf('__________\\n\\n');` +
        `cd(scriptFolder);` +
        `runAllTests;`;
}
