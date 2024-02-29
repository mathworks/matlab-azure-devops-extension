// Copyright 2024 The MathWorks, Inc.

import * as assert from "assert";
import * as taskLib from "azure-pipelines-task-lib/task";
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
            let argsCapture: string[];
            let execReturn: Promise<number>;
            const platform = "linux";
            const architecture = "x64";

            beforeEach(() => {
                stubWriteFileSync = sinon.stub(fs, "writeFileSync");
                stubChmodSync = sinon.stub(fs, "chmodSync");
                stubCheckPath = sinon.stub(taskLib, "checkPath");
                stubGetVariable = sinon.stub(taskLib, "getVariable");
                stubTool = sinon.stub(taskLib, "tool");
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
                stubTool.restore();
            });

            it("ideally works", async () => {
                assert.doesNotReject(matlab.runCommand("myscript", platform, architecture));
                // calls with myscript command as the only arg
                assert(argsCapture.length === 1);
            });

            it("ideally works with arguments", async () => {
                assert.doesNotReject(matlab.runCommand("myscript", platform, architecture, "-nojvm -logfile file"));
                // calls with myscript command and startup options
                assert(argsCapture.length === 2);
                // 3 startup options
                assert(argsCapture[1].length === 3);
                assert(argsCapture[1].includes("-nojvm"));
                assert(argsCapture[1].includes("-logfile"));
                assert(argsCapture[1].includes("file"));
            });

            it("fails when MATLAB returns a non-zero exit code", async () => {
                // return non-zero exit code
                execReturn = Promise.resolve(1);
                assert.rejects(matlab.runCommand("myscript", platform, architecture));
            });

            it("fails when chmod fails", async () => {
                stubChmodSync.throws("BAM!");
                assert.rejects(matlab.runCommand("myscript", platform, architecture));
            });

            it("fails when the temporary directory doesn't exist", async () => {
                stubCheckPath.throws("BAM!");
                assert.rejects(matlab.runCommand("myscript", platform, architecture));
            });

            it("fails when there's an error writing to the file", async () => {
                stubWriteFileSync.throws("BAM!");
                assert.rejects(matlab.runCommand("myscript", platform, architecture));
            });
        });

        describe("ci bin helper path", () => {
            const testBin = (platform: string, subdirectory: string, ext: string) => {
                it(`considers the appropriate rmc bin on ${platform}`, () => {
                    const architecture = "x64";
                    const p = matlab.getRunMATLABCommandScriptPath(platform, architecture);
                    assert(path.extname(p) === ext);
                    assert(p.includes(subdirectory));
                });
            };

            testBin("linux", "glnxa64", "");
            testBin("win32", "win64", ".exe");
            testBin("darwin", "maci64", "");

            it("errors on unsupported platform", () => {
                assert.throws(() => matlab.getRunMATLABCommandScriptPath("sunos", "x64"));
            });

            it("errors on unsupported architecture", () => {
                assert.throws(() => matlab.getRunMATLABCommandScriptPath("linux", "x86"));
            });
        });
    });
}
