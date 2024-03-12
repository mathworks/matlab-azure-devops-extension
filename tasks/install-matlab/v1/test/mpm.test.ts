// Copyright 2023-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as sinon from "sinon";
import * as mpm from "../src/mpm";
import * as utils from "../src/utils";

export default function suite() {
    const arch = "x64";
    let stubDownloadToolIfNecessary: sinon.SinonStub;
    let stubExec: sinon.SinonStub;

    describe("mpm.ts test suite", () => {
        beforeEach(() => {
            // setup stubs
            stubDownloadToolIfNecessary = sinon.stub(utils, "downloadToolIfNecessary");
            stubDownloadToolIfNecessary.callsFake((url, fileName) => {
                return Promise.resolve("/path/to/mpm");
            });
            stubExec = sinon.stub(taskLib, "exec");
            stubExec.callsFake((bin, args) => {
                return Promise.resolve(0);
            });
        });

        afterEach(() => {
            // restore stubs
            stubDownloadToolIfNecessary.restore();
            stubExec.restore();
        });

        it(`setup works on linux`, async () => {
            const platform = "linux";

            const mpmPath = await mpm.setup(platform, arch);
            assert(mpmPath === "/path/to/mpm");
            assert(stubDownloadToolIfNecessary.calledOnce);
            assert(stubExec.calledOnce);
        });

        it(`setup works on windows`, async () => {
            const platform = "win32";

            const mpmPath = await mpm.setup(platform, arch);
            assert(mpmPath === "/path/to/mpm");
            assert(stubDownloadToolIfNecessary.calledOnce);
            assert(stubExec.notCalled);
        });

        it(`setup works on mac`, async () => {
            const platform = "darwin";

            const mpmPath = await mpm.setup(platform, arch);
            assert(mpmPath === "/path/to/mpm");
            assert(stubDownloadToolIfNecessary.calledOnce);
            assert(stubExec.calledOnce);
        });

        it(`setup rejects on unsupported platforms`, async () => {
            const platform = "sunos";
            assert.rejects(async () => { await mpm.setup(platform, arch); });
        });

        it(`setup rejects on unsupported architectures`, async () => {
            const platform = "win32";
            assert.rejects(async () => { await mpm.setup(platform, "x86"); });
        });

        it("setup rejects when the download fails", async () => {
            const platform = "linux";
            stubDownloadToolIfNecessary.callsFake((url, fileName?, handlers?) => {
                return Promise.reject(Error("BAM!"));
            });
            assert.rejects(async () => { await mpm.setup(platform, arch); });
        });

        it("setup rejects on linux when the chmod fails", async () => {
            const platform = "linux";
            stubExec.callsFake((bin, args?) => {
                // non-zero exit code
                return Promise.resolve(1);
            });
            assert.rejects(async () => { await mpm.setup(platform, arch); });
        });

        it("setup rejects on macos when the chmod fails", async () => {
            const platform = "darwin";
            stubExec.callsFake((bin, args?) => {
                // non-zero exit code
                return Promise.resolve(1);
            });
            assert.rejects(async () => { await mpm.setup(platform, arch); });
        });

        it("install ideally works", async () => {
            const mpmPath = "mpm";
            const releaseInfo = {name: "r2022b", version: "9.13.0", update: "Latest"};
            const destination = "/opt/matlab";
            const products = "MATLAB Compiler";
            const expectedMpmArgs = [
                "install",
                "--release=r2022bLatest",
                `--destination=${destination}`,
                "--products",
                "MATLAB",
                "Compiler",
            ];
            assert.doesNotReject(async () => { mpm.install(mpmPath, releaseInfo, products, destination); });
            mpm.install(mpmPath, releaseInfo, destination, products).then(() => {
                assert(stubExec.calledWithMatch(mpmPath, expectedMpmArgs));
            });
        });

        it("install rejects on failed install", async () => {
            const mpmPath = "mpm";
            const releaseInfo = {name: "r2022b", version: "9.13.0", update: "latest"};
            const destination = "/opt/matlab";
            const products = "MATLAB Compiler";
            stubExec.callsFake((bin, args?) => {
                // non-zero exit code
                return Promise.resolve(1);
            });
            assert.rejects(async () => mpm.install(mpmPath, releaseInfo, destination, products));
        });
    });
}
