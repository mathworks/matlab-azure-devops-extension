// Copyright 2024 The MathWorks, Inc.

import * as assert from "assert";
import * as scriptgen from "../scriptgen";

export default function suite() {
    describe("command generation", () => {
        it("contains genscript invocation with unspecified options", () => {
            const options: scriptgen.IRunTestsOptions = {
                JUnitTestResults: "",
                CoberturaCodeCoverage: "",
                HTMLCodeCoverage: "",
                SourceFolder: "",
                PDFTestReport: "",
                HTMLTestReport: "",
                SimulinkTestResults: "",
                CoberturaModelCoverage: "",
                HTMLModelCoverage: "",
                SelectByTag: "",
                SelectByFolder: "",
                SelectByName: "",
                Strict: false,
                UseParallel: false,
                OutputDetail: "",
                LoggingLevel: "",
            };

            const actual = scriptgen.generateCommand(options);
            console.log("Generated command:", actual);
            assert(actual.includes("genscript('Test'"));
            assert(actual.includes("'JUnitTestResults',''"));
            assert(actual.includes("'CoberturaCodeCoverage',''"));
            assert(actual.includes("'HTMLCodeCoverage',''"));
            assert(actual.includes("'SourceFolder',''"));
            assert(actual.includes("'PDFTestReport',''"));
            assert(actual.includes("'HTMLTestReport',''"));
            assert(actual.includes("'SimulinkTestResults',''"));
            assert(actual.includes("'CoberturaModelCoverage',''"));
            assert(actual.includes("'HTMLModelCoverage',''"));
            assert(actual.includes("'SelectByTag',''"));
            assert(actual.includes("'SelectByFolder',''"));
            assert(actual.includes("'SelectByName',''"));
            assert(actual.includes("'Strict',false"));
            assert(actual.includes("'UseParallel',false"));
            assert(actual.includes("'OutputDetail',''"));
            assert(actual.includes("'LoggingLevel',''"));

            const expected = `genscript('Test', 'JUnitTestResults','', 'CoberturaCodeCoverage','','HTMLCodeCoverage','',
                'SourceFolder','', 'PDFTestReport','', 'HTMLTestReport','', 'SimulinkTestResults','',
                'CoberturaModelCoverage','', 'HTMLModelCoverage','', 'SelectByTag','', 'SelectByFolder','', 'SelectByName','',
                'Strict',false, 'UseParallel',false, 'OutputDetail','', 'LoggingLevel','')`
                .replace(/\s+/g, "");
            assert(actual.replace(/\s+/g, "").includes(expected));
        });

        it("contains genscript invocation with all options specified", () => {
            const options: scriptgen.IRunTestsOptions = {
                JUnitTestResults: "test-results/results.xml",
                CoberturaCodeCoverage: "code-coverage/coverage.xml",
                HTMLCodeCoverage: "code-coverage/coverageHTML",
                SourceFolder: "source",
                PDFTestReport: "test-results/pdf-results.pdf",
                HTMLTestReport: "test-results/html-resultsHTML",
                SimulinkTestResults: "test-results/simulinkTest.mldatx",
                CoberturaModelCoverage: "test-results/modelcoverage.xml",
                HTMLModelCoverage: "test-results/modelcoverageHTML",
                SelectByTag: "FeatureA",
                SelectByFolder: "test/tools;test/toolbox",
                SelectByName: "tTestA/* tTestB/*",
                Strict: true,
                UseParallel: true,
                OutputDetail: "Detailed",
                LoggingLevel: "Detailed",
            };

            const actual = scriptgen.generateCommand(options);
            console.log("Generated command:", actual);
            assert(actual.includes("genscript('Test'"));
            assert(actual.includes("'JUnitTestResults','test-results/results.xml'"));
            assert(actual.includes("'CoberturaCodeCoverage','code-coverage/coverage.xml'"));
            assert(actual.includes("'HTMLCodeCoverage','code-coverage/coverageHTML'"));
            assert(actual.includes("'SourceFolder','source'"));
            assert(actual.includes("'PDFTestReport','test-results/pdf-results.pdf'"));
            assert(actual.includes("'HTMLTestReport','test-results/html-resultsHTML'"));
            assert(actual.includes("'SimulinkTestResults','test-results/simulinkTest.mldatx'"));
            assert(actual.includes("'CoberturaModelCoverage','test-results/modelcoverage.xml'"));
            assert(actual.includes("'HTMLModelCoverage','test-results/modelcoverageHTML'"));
            assert(actual.includes("'SelectByTag','FeatureA'"));
            assert(actual.includes("'SelectByFolder','test/tools;test/toolbox'"));
            assert(actual.includes("'SelectByName','tTestA/* tTestB/*'"));
            assert(actual.includes("'Strict',true"));
            assert(actual.includes("'UseParallel',true"));
            assert(actual.includes("'OutputDetail','Detailed'"));
            assert(actual.includes("'LoggingLevel','Detailed'"));

            const expected = `genscript('Test', 'JUnitTestResults','test-results/results.xml',
                'CoberturaCodeCoverage','code-coverage/coverage.xml','HTMLCodeCoverage','code-coverage/coverageHTML', 'SourceFolder','source',
                'PDFTestReport','test-results/pdf-results.pdf', 'HTMLTestReport','test-results/html-resultsHTML', 'SimulinkTestResults','test-results/simulinkTest.mldatx',
                'CoberturaModelCoverage','test-results/modelcoverage.xml', 'HTMLModelCoverage','test-results/modelcoverageHTML', 'SelectByTag','FeatureA',
                'SelectByFolder','test/tools;test/toolbox', 'SelectByName','tTestA/* tTestB/*', 'Strict',true, 'UseParallel',true, 'OutputDetail','Detailed',
                'LoggingLevel','Detailed' )`
                .replace(/\s+/g, "");
            assert(actual.replace(/\s+/g, "").includes(expected));
        });
    });
}
