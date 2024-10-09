// Copyright 2024 The MathWorks, Inc.

import * as assert from "assert";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as fs from "fs";
import * as path from "path";
import * as sinon from "sinon";
import * as matlab from "../matlab";

export default function suite() {
    describe("matlab.ts test suite", () => {
        describe("run command", () => {
            let stubWriteFileSync: sinon.SinonStub;
            let stubChmodSync: sinon.SinonStub;
            let stubCheckPath: sinon.SinonStub;
            let stubGetVariable: sinon.SinonStub;
            let stubTool: sinon.SinonStub;
            let stubExtractZip: sinon.SinonStub;
            let stubExist: sinon.SinonStub;
            let argsCapture: string[];
            let execReturn: Promise<number>;
            const platform = "linux";
            const architecture = "x64";

            before(() => {
                taskLib.setResourcePath(path.join( __dirname, "..", "task.json"));
            });

            beforeEach(() => {
                stubWriteFileSync = sinon.stub(fs, "writeFileSync");
                stubChmodSync = sinon.stub(fs, "chmodSync");
                stubCheckPath = sinon.stub(taskLib, "checkPath");
                stubGetVariable = sinon.stub(taskLib, "getVariable");
                stubExtractZip = sinon.stub(toolLib, "extractZip");
                stubTool = sinon.stub(taskLib, "tool");
                // used to check if run-matlab-command has already been unzipped
                stubExist = sinon.stub(taskLib, "exist").get(
                    () => (s: string) => false,
                );
                argsCapture = [];
                execReturn = Promise.resolve(0);
                stubTool.callsFake((t) => {
                    return {
                        arg: (a: string) => {
                            argsCapture.push(a);
                        },
                        exec: () => {
                            return execReturn;
                        },
                    };
                });
            });

            afterEach(() => {
                stubWriteFileSync.restore();
                stubChmodSync.restore();
                stubCheckPath.restore();
                stubGetVariable.restore();
                stubExtractZip.restore();
                stubExist.restore();
                stubTool.restore();
            });

            it("ideally works", async () => {
                await assert.doesNotReject(async () => await matlab.runCommand("myscript", platform, architecture));
                // extract run-matlab-command binary
                assert(stubExtractZip.callCount === 1);
                // calls with myscript command as the only arg
                assert(argsCapture.length === 1);
            });

            it("ideally works with arguments", async () => {
                await assert.doesNotReject(
                    matlab.runCommand("myscript", platform, architecture, "-nojvm -logfile file"),
                );
                // extract run-matlab-command binary
                assert(stubExtractZip.callCount === 1);
                // calls with myscript command and startup options
                assert(argsCapture.length === 2);
                // 3 startup options
                assert(argsCapture[1].length === 3);
                assert(argsCapture[1].includes("-nojvm"));
                assert(argsCapture[1].includes("-logfile"));
                assert(argsCapture[1].includes("file"));
            });

            it("does not unzip if run-matlab-command is already there", async () => {
                // return true becuase run-matlab-command has already been unzipped
                stubExist = sinon.stub(taskLib, "exist").get(
                    () => (s: string) => true,
                );
                await assert.doesNotReject(async () => await matlab.runCommand("myscript", platform, architecture));
                // check that unzip is skipped if run-matlab-command binary exists
                assert(stubExtractZip.callCount === 0);
                // calls with myscript command as the only arg
                assert(argsCapture.length === 1);
            });

            it("fails when MATLAB returns a non-zero exit code", async () => {
                // return non-zero exit code
                execReturn = Promise.resolve(1);
                await assert.rejects(matlab.runCommand("myscript", platform, architecture));
            });

            it("fails when chmod fails", async () => {
                stubChmodSync.throws("BAM!");
                await assert.rejects(matlab.runCommand("myscript", platform, architecture));
            });

            it("fails when the temporary directory doesn't exist", async () => {
                stubCheckPath.throws("BAM!");
                await assert.rejects(matlab.runCommand("myscript", platform, architecture));
            });

            it("fails when there's an error writing to the file", async () => {
                stubWriteFileSync.throws("BAM!");
                await assert.rejects(matlab.runCommand("myscript", platform, architecture));
            });
        });

        describe("ci bin helper path", () => {
            let stubExtractZip: sinon.SinonStub;

            beforeEach(() => {
                stubExtractZip = sinon.stub(toolLib, "extractZip");
            });

            afterEach(() => {
                stubExtractZip.restore();
            });

            const testBin = (platform: string, subdirectory: string, ext: string) => {
                it(`considers the appropriate rmc bin on ${platform}`, async () => {
                    const architecture = "x64";
                    const p = await matlab.getRunMATLABCommandPath(platform, architecture);
                    // unzips run-matlab-command binary
                    assert(stubExtractZip.callCount === 1);
                    assert(path.extname(p) === ext);
                    assert(p.includes(subdirectory));
                });
            };

            testBin("linux", "glnxa64", "");
            testBin("win32", "win64", ".exe");
            testBin("darwin", "maci64", "");

            it("errors on unsupported platform", () => {
                assert.rejects(async () => await matlab.getRunMATLABCommandPath("sunos", "x64"));
            });

            it("errors on unsupported architecture", () => {
                assert.rejects(async () => await matlab.getRunMATLABCommandPath("linux", "x86"));
            });
        });
    });
}
