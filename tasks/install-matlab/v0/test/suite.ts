// Copyright 2020-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as mt from "azure-pipelines-task-lib/mock-test";
import * as path from "path";

describe("InstallMATLAB V0 Suite", () => {
    it("should succeed downloading and executing install script on linux", async () => {
        const tp = path.join(__dirname, "downloadAndExecuteLinux.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("Installed MATLAB"), "should have executed install script");
    });

    it("should succeed downloading and executing install script on windows", async () => {
        const tp = path.join(__dirname, "downloadAndExecuteWindows.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("Installed MATLAB"), "should have executed install script");
    });

    it("should succeed with --skip-activation flag for private repos", async () => {
        const tp = path.join(__dirname, "downloadAndExecutePrivate.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("Installed MATLAB"), "should have executed install script");
    });

    it("should fail when downloading install script fails", async () => {
        const tp = path.join(__dirname, "failDownload.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.failed, "should have failed");
        assert(tr.stdOutContained("Download failed"), "should have failed download");
    });

    it("should fail when executing install script fails", async () => {
        const tp = path.join(__dirname, "failExecute.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.failed, "should have failed");
        assert(tr.stdOutContained("Failed to install MATLAB"), "should have failed to install");
    });

    it("should fail on self-hosted agents", async () => {
        const tp = path.join(__dirname, "failSelfHosted.js");
        const tr = new mt.MockTestRunner(tp);

        await tr.runAsync();

        assert(tr.failed, "should have failed");
        assert(tr.stdOutContained("InstallNotSupportedOnSelfHosted"), "should have failed to install");
    });
});
