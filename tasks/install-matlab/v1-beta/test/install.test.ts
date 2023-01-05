// Copyright 2023 The MathWorks, Inc.

import * as assert from "assert";
import * as mt from "azure-pipelines-task-lib/mock-test";
import * as path from "path";

export default function suite() {
    describe("install.ts test suite", () => {

        it("should succeed downloading and executing install script on linux", (done) => {
            const tp = path.join(__dirname, "install", "downloadAndExecuteLinux.js");
            const tr = new mt.MockTestRunner(tp);

            tr.run();

            assert(tr.succeeded, "should have succeeded");
            assert(tr.stdOutContained("Installed matlab-batch"), "should have executed install script");

            done();
        });

        it("should succeed downloading and executing install script on windows", (done) => {
            const tp = path.join(__dirname, "install", "downloadAndExecuteWindows.js");
            const tr = new mt.MockTestRunner(tp);

            tr.run();

            assert(tr.succeeded, "should have succeeded");
            assert(tr.stdOutContained("Installed matlab-batch"), "should have executed install script");

            done();
        });

        it("should fail when downloading install script fails", (done) => {
            const tp = path.join(__dirname, "install", "failDownload.js");
            const tr = new mt.MockTestRunner(tp);

            tr.run();

            assert(tr.failed, "should have failed");
            assert(tr.stdOutContained("Download failed"), "should have failed download");

            done();
        });

        it("should fail when executing install script fails", (done) => {
            const tp = path.join(__dirname, "install", "failExecute.js");
            const tr = new mt.MockTestRunner(tp);

            tr.run();

            assert(tr.failed, "should have failed");
            assert(tr.stdOutContained("Failed to install MATLAB"), "should have failed to install");

            done();
        });

        it("should fail on self-hosted agents", (done) => {
            const tp = path.join(__dirname, "install", "failSelfHosted.js");
            const tr = new mt.MockTestRunner(tp);

            tr.run();

            assert(tr.failed, "should have failed");
            assert(tr.stdOutContained("InstallNotSupportedOnSelfHosted"), "should have failed to install");

            done();
        });
    });
}
