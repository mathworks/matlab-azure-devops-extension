import * as assert from "assert";
import * as mt from "azure-pipelines-task-lib/mock-test";
import * as path from "path";

describe("RunMATLABCommand V0 Suite", () => {
    it("should succeed running MATLAB command on linux", (done) => {
        const tp = path.join(__dirname, "runCommandLinux.js");
        const tr = new mt.MockTestRunner(tp);

        tr.run();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("hello world"), "should have executed command");

        done();
    });

    it("should succeed running MATLAB command on windows", (done) => {
        const tp = path.join(__dirname, "runCommandWindows.js");
        const tr = new mt.MockTestRunner(tp);

        tr.run();

        assert(tr.succeeded, "should have succeeded");
        assert(tr.stdOutContained("hello world"), "should have executed command");

        done();
    });

    it("should fail when running command fails", (done) => {
        const tp = path.join(__dirname, "failRunCommand.js");
        const tr = new mt.MockTestRunner(tp);

        tr.run();

        assert(tr.failed, "should have failed");
        assert(tr.stdOutContained("BAM!"), "should have executed command");

        done();
    });
});
