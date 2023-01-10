// Copyright 2023 The MathWorks, Inc.

import * as assert from "assert";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as sinon from "sinon";
import * as install from "../src/install";
import * as matlab from "../src/matlab";
import * as mpm from "../src/mpm";
import * as script from "../src/script";

export default function suite() {
    describe("install.ts test suite", () => {
        let stubGetReleaseInfo: sinon.SinonStub;
        let stubDownloadAndRunScript: sinon.SinonStub;
        let stubMakeToolcacheDir: sinon.SinonStub;
        let stubSetupBatch: sinon.SinonStub;
        let stubMpmSetup: sinon.SinonStub;
        let stubMpmInstall: sinon.SinonStub;
        let stubPrependPath: sinon.SinonStub;

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
            stubDownloadAndRunScript = sinon.stub(script, "downloadAndRunScript");
            stubDownloadAndRunScript.callsFake((plat, url, args) => {
                return Promise.resolve(0);
            });
            stubMakeToolcacheDir = sinon.stub(matlab, "makeToolcacheDir");
            stubMakeToolcacheDir.callsFake((rel) => {
                return [toolcacheDir, false];
            });
            stubSetupBatch = sinon.stub(matlab, "setupBatch");
            stubMpmSetup = sinon.stub(mpm, "setup");
            stubMpmInstall = sinon.stub(mpm, "install");
            stubPrependPath = sinon.stub(toolLib, "prependPath");
        });

        afterEach(() => {
            stubGetReleaseInfo.restore();
            stubDownloadAndRunScript.restore();
            stubMakeToolcacheDir.restore();
            stubSetupBatch.restore();
            stubMpmSetup.restore();
            stubMpmInstall.restore();
            stubPrependPath.restore();
        });

        it("ideally works", async () => {
            assert.doesNotReject(async () => { await install.install(platform, architecture, release, products); });
        });

        it("does not run setup script on windows", async () => {
            const windows = "win32";
            assert.doesNotReject(async () => { await install.install(windows, architecture, release, products); });
            await install.install(windows, architecture, release, products);
            assert(stubDownloadAndRunScript.notCalled);
        });

        it("Installs MATLAB to folder MATLAB.app on Mac", async () => {
            const mpmPath = "/path/to/mpm";
            stubMpmSetup.callsFake((rel) => {
                return mpmPath;
            });

            assert.doesNotReject(async () => { await install.install("darwin", architecture, release, products); });
            await install.install("darwin", architecture, release, products).then(() => {
                assert(stubMpmInstall.calledWithMatch(mpmPath, releaseInfo, toolcacheDir + "/MATLAB.app", products));
            });
        });

        it("fails if setup script fails", async () => {
            stubDownloadAndRunScript.callsFake((plat, url, args) => {
                return Promise.resolve(1);
            });
            assert.rejects(async () => { await install.install(platform, architecture, release, products); });
        });

        it("does not install if MATLAB already exists in toolcache", async () => {
            stubMakeToolcacheDir.callsFake((rel) => {
                return [toolcacheDir, true];
            });
            assert.doesNotReject(async () => { await install.install(platform, architecture, release, products); });
            assert(stubMpmInstall.notCalled);
        });

        it("fails if add to path fails", async () => {
            stubPrependPath.callsFake((tool) => {
                throw new Error("BAM!");
            });
            assert.rejects(async () => { await install.install(platform, architecture, release, products); });
        });
    });
}
