// Copyright 2022-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as mt from "azure-pipelines-task-lib/mock-test";
import * as path from "path";

describe("RunMATLABBuild V0 Suite", () => {
    // it("should succeed running MATLAB build on linux", async () => {
    //     const tp = path.join(__dirname, "runBuildLinux.js");
    //     const tr = new mt.MockTestRunner(tp);
    //
    //     await tr.runAsync();
    //
    //     assert(tr.succeeded, "should have succeeded");
    //     assert(tr.stdOutContained("ran test task"), "should have run test task");
    // });

    it("should succeed running MATLAB build on windows", async () => {
        const tp = path.join(__dirname, "runBuildWindows.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran test task"), "should have run test task");
    });

    it("should succeed running MATLAB build on linux with startup options", async () => {
        const tp = path.join(__dirname, "runBuildWithStartupOptsLinux.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran test task"), "should have run test task");
    });

    it("should succeed running MATLAB build on windows with startup options", async () => {
        const tp = path.join(__dirname, "runBuildWithStartupOptsWindows.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran test task"), "should have run test task");
    });

    it("should run default tasks if no tasks input is supplied", async () => {
        const tp = path.join(__dirname, "runDefaultTasks.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran default tasks"), "should have run default tasks");
    });

    it("should fail when running build fails", async () => {
        const tp = path.join(__dirname, "failRunBuild.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.failed, "should have failed");
        assert(tr.stdOutContained("BAM!"), "should have executed build");
    });
});
