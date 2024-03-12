// Copyright 2024 The MathWorks, Inc.

import * as taskLib from "azure-pipelines-task-lib/task";
import * as path from "path";
import * as matlab from "./matlab";
import * as scriptgen from "./scriptgen";

async function run() {
    try {
        taskLib.setResourcePath(path.join( __dirname, "task.json"));
        const options: scriptgen.IRunTestsOptions = {
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
        const cmd = scriptgen.generateCommand(options);
        const platform = process.platform;
        const architecture = process.arch;
        await matlab.runCommand(cmd, platform, architecture, startupOpts);

    } catch (err) {
        taskLib.setResult(taskLib.TaskResult.Failed, (err as Error).message);
    }
}

run();
