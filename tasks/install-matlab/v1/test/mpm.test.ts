// Copyright 2023-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as sinon from "sinon";
import * as mpm from "../src/mpm";

export default function suite() {
    const arch = "x64";
    let stubDownloadTool: sinon.SinonStub;
    let stubExec: sinon.SinonStub;
    let stubGetVariable: sinon.SinonStub;
    const agentTemp: string = "/home/agent/_tmp";

    describe("mpm.ts test suite", () => {
        beforeEach(() => {
            // setup stubs
            stubDownloadTool = sinon.stub(toolLib, "downloadToolWithRetries");
            stubDownloadTool.callsFake((url, fileName) => {
                return Promise.resolve(`${agentTemp}/fileName`);
            });
            stubExec = sinon.stub(taskLib, "exec");
            stubExec.callsFake((bin, args) => {
                return Promise.resolve(0);
            });
            stubGetVariable = sinon.stub(taskLib, "getVariable");
            stubGetVariable.callsFake((v) => {
              if (v === "Agent.ToolsDirectory") {
                return "C:\\Program Files\\hostedtoolcache\\MATLAB\\r2022b";
              } else if (v === "Agent.TempDirectory") {
                return agentTemp;
              }
              return "";
            });
        });

        afterEach(() => {
            // restore stubs
            stubDownloadTool.restore();
            stubExec.restore();
            stubGetVariable.restore();
        });

        it(`setup works on linux`, async () => {
            const platform = "linux";

            const mpmPath = await mpm.setup(platform, arch);
            assert(mpmPath === "/home/agent/_tmp/mpm");
            assert(stubDownloadTool.calledOnce);
            assert(stubExec.calledOnce);
        });

        it(`setup works on windows`, async () => {
            const platform = "win32";

            const mpmPath = await mpm.setup(platform, arch);
            assert(mpmPath === "/home/agent/_tmp/mpm.exe");
            assert(stubDownloadTool.calledOnce);
            assert(stubExec.notCalled);
        });

        it(`setup works on mac`, async () => {
            const platform = "darwin";

            const mpmPath = await mpm.setup(platform, arch);
            assert(mpmPath === "/home/agent/_tmp/mpm");
            assert(stubDownloadTool.calledOnce);
            assert(stubExec.calledOnce);
        });

        it(`setup works on mac with apple silicon`, async () => {
            const platform = "darwin";

            const mpmPath = await mpm.setup(platform, "arm64");
            assert(mpmPath === "/home/agent/_tmp/mpm");
            assert(stubDownloadTool.calledOnce);
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
            stubDownloadTool.callsFake((url, fileName?, handlers?) => {
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
            const releaseInfo = {name: "r2022b", version: "9.13.0", update: "Latest", isPrerelease: false};
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

        it("add --release-status flag for prerelease", async () => {
            const mpmPath = "mpm";
            const releaseInfo = {name: "r2025a", version: "9.13.0", update: "Latest", isPrerelease: true};
            const destination = "/opt/matlab";
            const products = "MATLAB Compiler";
            const expectedMpmArgs = [
                "install",
                "--release=r2025aLatest",
                `--destination=${destination}`,
                "--release-status=Prerelease",
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
            const releaseInfo = {name: "r2022b", version: "9.13.0", update: "latest", isPrerelease: false};
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
