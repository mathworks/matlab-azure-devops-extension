// Copyright 2020-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as mt from "azure-pipelines-task-lib/mock-test";
import * as path from "path";

describe("RunMATLABTests V0 Suite", () => {
    it("should succeed running MATLAB tests on linux", async () => {
        const tp = path.join(__dirname, "runTestsLinux.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran tests"), "should have run tests");
    });

    it("should succeed running MATLAB tests on windows", async () => {
        const tp = path.join(__dirname, "runTestsWindows.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran tests"), "should have run tests");
    });

    it("should succeed running MATLAB tests with startup options on linux", async () => {
        const tp = path.join(__dirname, "runTestsWithStartupOptsLinux.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran tests"), "should have run tests");
    });

    it("should succeed running MATLAB tests with startup options on windows", async () => {
        const tp = path.join(__dirname, "runTestsWithStartupOptsWindows.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran tests"), "should have run tests");
    });

    it("should fail when running test fails", async () => {
        const tp = path.join(__dirname, "failRunTests.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.failed, "should have failed");
        assert(tr.stdOutContained("tests failed"), "should have run tests");
    });
});
