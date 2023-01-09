// Copyright 2023 The MathWorks, Inc.

import * as assert from "assert";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as http from "http";
import * as https from "https";
import * as net from "net";
import * as sinon from "sinon";
import * as matlab from "./../src/matlab";
import * as script from "./../src/script";

export default function suite() {
    describe("matlab.ts test suite", () => {
        let stubFindLocalTool: sinon.SinonStub;
        let stubCacheFile: sinon.SinonStub;
        let stubDownloadAndRunScript: sinon.SinonStub;
        let stubDefaultInstallRoot: sinon.SinonStub;
        let stubPrependPath: sinon.SinonStub;
        let stubHttpsGet: sinon.SinonStub;

        const cachedMatlab = "/path/to/cached/matlab";
        const releaseInfo = {name: "r2022b", version: "2022.2.999", update: "Latest"};
        const platform = "linux";

        beforeEach(() => {
            // setup stubs
            stubFindLocalTool = sinon.stub(toolLib, "findLocalTool");
            stubFindLocalTool.callsFake((tool, ver) => {
                return cachedMatlab;
            });
            stubCacheFile = sinon.stub(toolLib, "cacheFile");
            stubCacheFile.callsFake((srcFile, desFile, tool, ver) => {
                return Promise.resolve(cachedMatlab);
            });
            stubDownloadAndRunScript = sinon.stub(script, "downloadAndRunScript");
            stubDownloadAndRunScript.callsFake((plat, url, args) => {
                return Promise.resolve(0);
            });
            stubDefaultInstallRoot = sinon.stub(script, "defaultInstallRoot");
            stubPrependPath = sinon.stub(toolLib, "prependPath");
            stubHttpsGet = sinon.stub(https, "get");
        });

        afterEach(() => {
            // restore stubs
            stubFindLocalTool.restore();
            stubCacheFile.restore();
            stubDownloadAndRunScript.restore();
            stubDefaultInstallRoot.restore();
            stubPrependPath.restore();
            stubHttpsGet.restore();
        });

        it("makeToolcacheDir returns toolpath if in toolcache", async () => {
            const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo);
            assert(matlabPath === cachedMatlab);
            assert(alreadyExists);
        });

        it("makeToolcacheDir creates cache and returns new path if not in toolcache", async () => {
            stubFindLocalTool.callsFake((tool, ver) => {
                return undefined;
            });
            const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo);
            assert(matlabPath === cachedMatlab);
            assert(!alreadyExists);
        });

        it("setupBatch ideally works", async () => {
            assert.doesNotReject(async () => { await matlab.setupBatch(platform); });
        });

        it("setupBatch rejects when the download fails", async () => {
            stubDownloadAndRunScript.callsFake((plat, url, args) => {
                return Promise.resolve(1);
            });
            assert.rejects(async () => { await matlab.setupBatch(platform); });
        });

        it("setupBatch rejects when adding to path fails", async () => {
            stubPrependPath.callsFake((path) => {
                throw Error("BAM!");
            });
            assert.rejects(async () => { await matlab.setupBatch(platform); });
        });

        it("getReleaseInfo resolves latest", async () => {
            const mockResp = new http.IncomingMessage(new net.Socket());
            mockResp.statusCode = 200;
            stubHttpsGet.callsFake((url, callback) => {
                callback(mockResp);
                mockResp.emit("data", "r2022b");
                mockResp.emit("end");
                return Promise.resolve(null);
            });
            const release = await matlab.getReleaseInfo("latest");
            assert(release.name === "r2022b");
        });

        it("getReleaseInfo is case insensitive", async () => {
            const release = await matlab.getReleaseInfo("R2022B");
            assert(release.name === "r2022b");
            assert(release.version === "2022.2.999");
            assert(release.update === "Latest");
        });

        it("getReleaseInfo allows specifying update number", async () => {
            const release = await matlab.getReleaseInfo("R2022au2");
            assert(release.name === "r2022a");
            assert(release.version === "2022.1.2");
            assert(release.update === "u2");
        });

        it("getReleaseInfo rejects for invalid release input", async () => {
            assert.rejects(async () => { await matlab.getReleaseInfo("NotMatlab"); });
        });

        it("getReleaseInfo rejects for bad http response", async () => {
            const mockResp = new http.IncomingMessage(new net.Socket());
            // bad response
            mockResp.statusCode = 500;
            stubHttpsGet.callsFake((url, callback) => {
                callback(mockResp);
                mockResp.emit("end");
                return Promise.resolve(null);
            });
            assert.rejects(async () => { await matlab.getReleaseInfo("latest"); });
        });
    });
}
