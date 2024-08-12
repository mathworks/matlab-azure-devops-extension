// Copyright 2023-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as net from "net";
import * as path from "path";
import * as sinon from "sinon";
import * as matlab from "./../src/matlab";
import * as script from "./../src/script";
import * as utils from "./../src/utils";

export default function suite() {
  describe("matlab.ts test suite", () => {
    describe("makeToolcacheDir", () => {
      let stubCacheFile: sinon.SinonStub;
      let stubFindLocalTool: sinon.SinonStub;
      let writeFileStub: sinon.SinonStub;
      let stubDownloadAndRun: sinon.SinonStub;
      let platform: string;
      const defaultToolcacheLoc = "/opt/hostedtoolcache/matlab/2023.2.999/x64";
      const releaseInfo = {
        name: "r2023b",
        version: "2023.2.999",
        update: "Latest",
      };

      beforeEach(() => {
        writeFileStub = sinon.stub(fs, "writeFileSync");
        stubCacheFile = sinon.stub(toolLib, "cacheFile");
        stubFindLocalTool = sinon.stub(toolLib, "findLocalTool");
        stubFindLocalTool.callsFake((tool, ver) => {
          return "";
        });
        stubDownloadAndRun = sinon.stub(script, "downloadAndRunScript");
        platform = "linux";
      });

      afterEach(() => {
        stubCacheFile.restore();
        stubFindLocalTool.restore();
        writeFileStub.restore();
        stubDownloadAndRun.restore();
      });

      it("makeToolcacheDir returns toolpath if in toolcache", async () => {
        stubFindLocalTool.callsFake((tool, ver) => {
          return defaultToolcacheLoc;
        });
        const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
        assert(matlabPath === defaultToolcacheLoc);
        assert(alreadyExists);
      });

      it("creates cache and returns default path for linux", async () => {
        stubCacheFile.callsFake((src, dest, tool, ver) => {
          return Promise.resolve(defaultToolcacheLoc);
        });
        const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
        assert(matlabPath === defaultToolcacheLoc);
        assert(!alreadyExists);
      });

      it("creates cache and returns default path for mac", async () => {
        platform = "darwin";
        stubCacheFile.callsFake((src, dest, tool, ver) => {
          return Promise.resolve(defaultToolcacheLoc);
        });
        const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
        assert(matlabPath === path.join(defaultToolcacheLoc, "MATLAB.app"));
        assert(!alreadyExists);
      });

      it("finds existing cache and returns default path for mac", async () => {
        platform = "darwin";
        stubFindLocalTool.callsFake((tool, ver) => {
          return defaultToolcacheLoc;
        });
        const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
        assert(matlabPath === path.join(defaultToolcacheLoc, "MATLAB.app"));
        assert(alreadyExists);
      });

      describe("windows performance workaround", () => {
        let stubGetVariable: sinon.SinonStub;
        let stubGetAgentMode: sinon.SinonStub;
        let existsSyncStub: sinon.SinonStub;
        let mkdirStub: sinon.SinonStub;
        let symlinkStub: sinon.SinonStub;
        const defaultToolcacheWinDir = path.join("C:", "hostedtoolcache", "windows");
        const defaultToolcacheWinLoc = path.join(defaultToolcacheWinDir, "MATLAB", "2023.2.999", "x64");
        const optimizedToolcacheWinLoc = path.join("D:", "hostedtoolcache", "windows", "MATLAB", "2023.2.999", "x64");

        beforeEach(() => {
          platform = "win32";
          stubGetAgentMode = sinon.stub(taskLib, "getAgentMode");
          stubGetAgentMode.callsFake(() => taskLib.AgentHostedMode.MsHosted);
          existsSyncStub = sinon.stub(fs, "existsSync");
          existsSyncStub.callsFake((p) => true);
          mkdirStub = sinon.stub(fs, "mkdirSync");
          symlinkStub = sinon.stub(fs, "symlinkSync");
          stubGetVariable = sinon.stub(taskLib, "getVariable");
          stubGetVariable.callsFake((v) => {
            if (v === "Agent.ToolsDirectory") {
              return defaultToolcacheWinDir;
            }
          });
          stubCacheFile.callsFake((src, dest, tool, ver) => {
            return Promise.resolve(defaultToolcacheWinLoc);
          });
        });

        afterEach(() => {
          stubGetAgentMode.restore();
          stubGetVariable.restore();
          existsSyncStub.restore();
          mkdirStub.restore();
          symlinkStub.restore();
        });

        it("uses workaround if github-hosted", async () => {
          const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
          assert(matlabPath === optimizedToolcacheWinLoc);
          assert(!alreadyExists);
        });

        it("uses default toolcache directory if not github hosted", async () => {
          stubGetAgentMode.callsFake(() => taskLib.AgentHostedMode.SelfHosted);
          const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
          assert(matlabPath === defaultToolcacheWinLoc);
          assert(!alreadyExists);
        });

        it("uses default toolcache directory toolcache directory is not defined", async () => {
          stubGetVariable.callsFake((v) => { return; });
          const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
          assert(matlabPath === defaultToolcacheWinLoc);
          assert(!alreadyExists);
        });

        it("uses default toolcache directory if d: drive doesn't exist", async () => {
          existsSyncStub.callsFake((p) => {
            return p !== "d:\\";
          });
          const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
          assert(matlabPath === defaultToolcacheWinLoc);
          assert(!alreadyExists);
        });

        it("uses default toolcache directory if c: drive doesn't exist", async () => {
          existsSyncStub.callsFake((p) => {
            return p !== "d:\\";
          });
          const [matlabPath, alreadyExists] = await matlab.makeToolcacheDir(releaseInfo, platform);
          assert(matlabPath === defaultToolcacheWinLoc);
          assert(!alreadyExists);
        });
      });
    });

    describe("setupBatch", () => {
      let stubGetVariable: sinon.SinonStub;
      let stubCacheFile: sinon.SinonStub;
      let stubDownloadTool: sinon.SinonStub;
      let stubPrependPath: sinon.SinonStub;
      let stubExec: sinon.SinonStub;
      let platform: string;
      let architecture: string;
      const matlabBatchPath = "/path/to/downloaded/matlab-batch";

      beforeEach(() => {
        stubGetVariable = sinon.stub(taskLib, "getVariable");
        stubGetVariable.callsFake((v) => {
          if (v === "Agent.ToolsDirectory") {
            return "C:\\Program Files\\hostedtoolcache\\MATLAB\\r2022b";
          } else if (v === "Agent.TempDirectory") {
            return "/home/agent/_tmp";
          }
          return "";
        });
        stubExec = sinon.stub(taskLib, "exec");
        stubExec.callsFake((tool, args) => {
          return Promise.resolve(0);
        });
        stubCacheFile = sinon.stub(toolLib, "cacheFile");
        stubCacheFile.callsFake((srcFile, desFile, tool, ver) => {
          return Promise.resolve(matlabBatchPath);
        });
        stubDownloadTool = sinon.stub(toolLib, "downloadTool");
        stubDownloadTool.callsFake((url, name) => {
          return Promise.resolve(matlabBatchPath);
        });
        stubPrependPath = sinon.stub(toolLib, "prependPath");
        platform = "linux";
        architecture = "x64";
      });

      afterEach(() => {
        stubGetVariable.restore();
        stubExec.restore();
        stubCacheFile.restore();
        stubDownloadTool.restore();
        stubPrependPath.restore();
      });

      describe("test on all supported platforms", () => {
        it(`works on linux`, async () => {
          platform = "linux";
          assert.doesNotReject(async () => {
            await matlab.setupBatch(platform, architecture);
          });
        });

        it(`works on windows`, async () => {
          platform = "win32";
          assert.doesNotReject(async () => {
            await matlab.setupBatch(platform, architecture);
          });
        });

        it(`works on mac`, async () => {
          platform = "darwin";
          assert.doesNotReject(async () => {
            await matlab.setupBatch(platform, architecture);
          });
        });

        it(`works on mac with apple silicon`, async () => {
            platform = "darwin";
            architecture = "arm64";
            assert.doesNotReject(async () => {
                await matlab.setupBatch(platform, architecture);
            });
        });
      });

      it("setupBatch rejects on unsupported platforms", async () => {
        platform = "sunos";
        assert.rejects(async () => {
          await matlab.setupBatch(platform, architecture);
        });
      });

      it("setupBatch rejects on unsupported architectures", async () => {
        architecture = "x86";
        assert.rejects(async () => {
          await matlab.setupBatch(platform, architecture);
        });
      });

      it("setupBatch rejects if chmod fails", async () => {
        stubExec.callsFake((tool, args) => {
          return Promise.resolve(1);
        });
        assert.rejects(async () => {
          await matlab.setupBatch(platform, architecture);
        });
      });

      it("setupBatch rejects when the download fails", async () => {
        stubDownloadTool.callsFake((url, name) => {
          return Promise.reject();
        });
        assert.rejects(async () => {
          await matlab.setupBatch(platform, architecture);
        });
      });

      it("setupBatch rejects when adding to path fails", async () => {
        stubPrependPath.callsFake((p) => {
          throw Error("BAM!");
        });
        assert.rejects(async () => {
          await matlab.setupBatch(platform, architecture);
        });
      });
    });

    describe("getReleaseInfo", () => {
      let stubHttpsGet: sinon.SinonStub;
      const releaseInfo = {
        name: "r2022b",
        version: "2022.2.999",
        update: "Latest",
      };

      beforeEach(() => {
        stubHttpsGet = sinon.stub(https, "get");
      });

      afterEach(() => {
        stubHttpsGet.restore();
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
        assert.rejects(async () => {
          await matlab.getReleaseInfo("NotMatlab");
        });
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
        assert.rejects(async () => {
          await matlab.getReleaseInfo("latest");
        });
      });
    });

    describe("installSystemDependencies", () => {
        let platform: string;
        let architecture: string;
        let release: string;

        let stubDownloadAndRun: sinon.SinonStub;
        let stubDownloadTool: sinon.SinonStub;
        let stubExec: sinon.SinonStub;

        beforeEach(() => {
            platform = "linux";
            architecture = "x64";
            release = "r2024a";

            stubDownloadAndRun = sinon.stub(script, "downloadAndRunScript");
            stubDownloadAndRun.resolves(0);
            stubDownloadTool = sinon.stub(utils, "downloadTool");
            stubDownloadTool.resolves("/path/to/jdk.pkg");
            stubExec = sinon.stub(taskLib, "exec");
            stubExec.resolves(0);
        });

        afterEach(() => {
            stubDownloadAndRun.restore();
            stubDownloadTool.restore();
            stubExec.restore();
        });

        describe("test on all supported platforms", () => {
            it("works on Linux", async () => {
                await assert.doesNotReject(async () => {
                    await matlab.installSystemDependencies(platform, architecture, release);
                });
                assert(stubDownloadAndRun.calledOnce);
            });

            it("works on Windows", async () => {
                platform = "windows";
                await assert.doesNotReject(async () => {
                    await matlab.installSystemDependencies(platform, architecture, release);
                });
                assert(stubDownloadAndRun.notCalled);
            });

            it("works on Mac", async () => {
                platform = "darwin";
                await assert.doesNotReject(async () => {
                    await matlab.installSystemDependencies(platform, architecture, release);
                });
                assert(stubDownloadAndRun.notCalled);
            });

            it("works on Mac with Apple silicon", async () => {
                platform = "darwin";
                architecture = "arm64";
                await assert.doesNotReject(async () => {
                    await matlab.installSystemDependencies(platform, architecture, release);
                });
                assert(stubDownloadAndRun.notCalled);
                assert(stubDownloadTool.calledOnce);
                assert(stubExec.calledOnce);
            });

            it("works on Mac with Apple silicon < R2023b", async () => {
                platform = "darwin";
                architecture = "arm64";
                release = "r2022a";
                await assert.doesNotReject(async () => {
                    await matlab.installSystemDependencies(platform, architecture, release);
                });
                assert(stubDownloadAndRun.notCalled);
                assert(stubDownloadTool.notCalled);
                assert(stubExec.calledOnce);
            });
        });

        it("rejects when the apple silicon JDK download fails", async () => {
            platform = "darwin";
            architecture = "arm64";
            stubDownloadTool.rejects("bam");
            assert.rejects(async () => {
                await matlab.installSystemDependencies(platform, architecture, release);
            });
        });

        it("rejects when the apple silicon JDK fails to install", async () => {
            platform = "darwin";
            architecture = "arm64";
            stubExec.resolves(1);
            assert.rejects(async () => {
                await matlab.installSystemDependencies(platform, architecture, release);
            });
        });
    });
  });
}
