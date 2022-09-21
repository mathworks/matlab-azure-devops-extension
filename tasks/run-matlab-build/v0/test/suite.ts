// Copyright 2022 The MathWorks, Inc.

import * as assert from "assert";
import * as mt from "azure-pipelines-task-lib/mock-test";
import * as path from "path";

describe("RunMATLABBuild V0 Suite", () => {
    it("should succeed running MATLAB build on linux", (done) => {
        const tp = path.join(__dirname, "runBuildLinux.js");
        const tr = new mt.MockTestRunner(tp);

        tr.run();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran test task"), "should have run test task");

        done();
    });

    it("should succeed running MATLAB build on windows", (done) => {
        const tp = path.join(__dirname, "runBuildWindows.js");
        const tr = new mt.MockTestRunner(tp);

        tr.run();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran test task"), "should have run test task");

        done();
    });

    it("should run default tasks if no tasks input is supplied", (done) => {
        const tp = path.join(__dirname, "runDefaultTasks.js");
        const tr = new mt.MockTestRunner(tp);

        tr.run();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("ran default tasks"), "should have run default tasks");

        done();
    });

    it("should fail when running build fails", (done) => {
        const tp = path.join(__dirname, "failRunBuild.js");
        const tr = new mt.MockTestRunner(tp);

        tr.run();

        assert(tr.failed, "should have failed");
        assert(tr.stdOutContained("BAM!"), "should have executed build");

        done();
    });
});
