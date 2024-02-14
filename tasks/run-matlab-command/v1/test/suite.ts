// Copyright 2020-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as mt from "azure-pipelines-task-lib/mock-test";
import * as path from "path";

describe("RunMATLABCommand V0 Suite", () => {
    // it("should succeed running MATLAB command on linux", async () => {
    //     const tp = path.join(__dirname, "runCommandLinux.js");
    //     const tr = new mt.MockTestRunner(tp);
    //
    //     await tr.runAsync();
    //
    //     assert(tr.succeeded, "should have succeeded");
    //     assert(tr.stdOutContained("hello world"), "should have executed command");
    // });

    it("should succeed running MATLAB command with startup options on linux", async () => {
        const tp = path.join(__dirname, "runCommandWithArgsLinux.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("hello world"), "should have executed command");
    });

    it("should succeed running MATLAB command on windows", async () => {
        const tp = path.join(__dirname, "runCommandWindows.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("hello world"), "should have executed command");
    });

    it("should succeed running MATLAB command with startup options on windows", async () => {
        const tp = path.join(__dirname, "runCommandWithArgsWindows.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("hello world"), "should have executed command");
    });

    it("should fail when running command fails", async () => {
        const tp = path.join(__dirname, "failRunCommand.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.failed, "should have failed");
        assert(tr.stdOutContained("BAM!"), "should have executed command");
    });
});
