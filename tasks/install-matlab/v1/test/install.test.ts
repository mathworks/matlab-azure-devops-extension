// Copyright 2023-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as sinon from "sinon";
import * as install from "../src/install";
import * as matlab from "../src/matlab";
import * as mpm from "../src/mpm";
import * as script from "../src/script";

export default function suite() {
    describe("install.ts test suite", () => {
        let stubGetReleaseInfo: sinon.SinonStub;
        let stubGetAgentMode: sinon.SinonStub;
        let stubInstallSystemDependencies: sinon.SinonStub;
        let stubMakeToolcacheDir: sinon.SinonStub;
        let stubSetupBatch: sinon.SinonStub;
        let stubMpmSetup: sinon.SinonStub;
        let stubMpmInstall: sinon.SinonStub;
        let stubPrependPath: sinon.SinonStub;
        let stubExistsSync: sinon.SinonStub;

        const platform = "linux";
        const architecture = "x64";
        const release = "latest";
        const products = "MATLAB";
        const toolcacheDir = "/path/to/matlab";
        const releaseInfo = {name: "r2022b", version: "2022.2.999", update: "latest"};

        beforeEach(() => {
            stubGetReleaseInfo = sinon.stub(matlab, "getReleaseInfo");
            stubGetReleaseInfo.callsFake((rel) => {
                return releaseInfo;
            });
            stubGetAgentMode = sinon.stub(taskLib, "getAgentMode");
            stubGetAgentMode.returns(taskLib.AgentHostedMode.MsHosted);
            stubInstallSystemDependencies = sinon.stub(matlab, "installSystemDependencies");
            stubInstallSystemDependencies.resolves(0);
            stubMakeToolcacheDir = sinon.stub(matlab, "makeToolcacheDir");
            stubMakeToolcacheDir.callsFake((rel) => {
                return [toolcacheDir, false];
            });
            stubSetupBatch = sinon.stub(matlab, "setupBatch");
            stubMpmSetup = sinon.stub(mpm, "setup");
            stubMpmInstall = sinon.stub(mpm, "install");
            stubPrependPath = sinon.stub(toolLib, "prependPath");
            stubExistsSync = sinon.stub(fs, "existsSync");
        });

        afterEach(() => {
            stubGetReleaseInfo.restore();
            stubGetAgentMode.restore();
            stubInstallSystemDependencies.restore();
            stubMakeToolcacheDir.restore();
            stubSetupBatch.restore();
            stubMpmSetup.restore();
            stubMpmInstall.restore();
            stubPrependPath.restore();
            stubExistsSync.restore();
        });

        it("ideally works", async () => {
            assert.doesNotReject(async () => { await install.install(platform, architecture, release, products); });
        });

        it("fails for unsupported release", async () => {
            stubGetReleaseInfo.callsFake((rel) => {
                return {name: "r2020a", version: "2020.1.999", update: "latest"};
            });
            assert.rejects(async () => { await install.install(platform, architecture, "r2020a", products); });
        });

        it("fails if setting up core deps fails", async () => {
            stubInstallSystemDependencies.rejects("bam");
            assert.rejects(async () => { await install.install(platform, architecture, release, products); });
        });

        it("does not install core deps if self-hosted", async () => {
            stubGetAgentMode.returns(taskLib.AgentHostedMode.SelfHosted);
            await install.install(platform, architecture, release, products);
            assert(stubInstallSystemDependencies.notCalled);
        });

        it("re-calls MPM install even if MATLAB already exists in toolcache", async () => {
            stubMakeToolcacheDir.callsFake((rel) => {
                return [toolcacheDir, true];
            });
            await assert.doesNotReject(async () => {
                await install.install(platform, architecture, release, products);
            });
            assert(stubMpmInstall.calledWith(sinon.match.any, releaseInfo, toolcacheDir, products));
        });

        it("fails if add to path fails", async () => {
            stubPrependPath.callsFake((tool) => {
                throw new Error("BAM!");
            });
            assert.rejects(async () => { await install.install(platform, architecture, release, products); });
        });

        it("installs Intel version on Apple silicon prior to R2023b", async () => {
            await install.install("darwin", "arm64", release, products);
            assert(stubInstallSystemDependencies.calledWith("darwin", "arm64", "r2022b"));
            assert(stubSetupBatch.calledWith("darwin", "x64"));
            assert(stubMpmSetup.calledWith("darwin", "x64"));
        });

        // Update the test cases
        it("adds MATLAB Runtime to system path on Windows if directory exists", async () => {
            stubExistsSync.returns(true);
            await install.install("win32", "x64", release, products);
            assert(stubPrependPath.calledWith(`${toolcacheDir}/runtime/win64`));
        });

    });
}
