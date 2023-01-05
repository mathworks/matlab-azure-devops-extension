// Copyright 2023 The MathWorks, Inc.

import * as assert from "assert";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as sinon from "sinon";
import * as mpm from "../src/mpm";

export default function suite() {
    const stubDownloadTool = sinon.stub(toolLib, "downloadTool");
    stubDownloadTool.callsFake((url, fileName?, handlers?) => {
        return Promise.resolve("/path/to/mpm");
    });
    const stubExtractZip = sinon.stub(toolLib, "extractZip");
    stubExtractZip.callsFake((file, destination?) => {
        return Promise.resolve("/path/to/mpm");
    });
    const stubExec = sinon.stub(taskLib, "exec");

    beforeEach(() => {
        stubDownloadTool.resetHistory();
        stubExtractZip.resetHistory();
        stubExec.resetHistory();
    });

    describe("mpm.ts test suite", () => {
        it(`setup works on linux`, async () => {
            const platform = "linux";
            const arch = "x64";

            const mpmPath = await mpm.setup(platform, arch);
            assert(mpmPath === "/path/to/mpm");
            assert(stubDownloadTool.calledOnce);
            assert(stubExec.calledOnce);
        });
    });

    describe("mpm.ts test suite", () => {
        it(`setup works on windows`, async () => {
            const platform = "win32";
            const arch = "x64";

            const mpmPath = await mpm.setup(platform, arch);
            assert(mpmPath === "/path/to/mpm/bin/win64/mpm.exe");
            assert(stubDownloadTool.calledOnce);
            assert(stubExtractZip.calledOnce);
            assert(stubExec.notCalled);
        });
    });
}
