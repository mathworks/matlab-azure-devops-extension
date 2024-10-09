// Copyright 2023-2024 The MathWorks, Inc.

import * as assert from "assert";
import * as taskLib from "azure-pipelines-task-lib/task";
import * as toolLib from "azure-pipelines-tool-lib/tool";
import * as sinon from "sinon";
import * as script from "../src/script";

const bashPath = "/bin/bash";
const mockToolRunner = {
    bin: bashPath,
    args: [] as string[],
    arg(val: string | string[]) {
        if (val instanceof Array) {
            this.args = this.args.concat(val);
        } else if (typeof (val) === "string") {
            this.args = this.args.concat(val.trim());
        }
        return this;
    },
    line() { return this; },
    exec() { return 0; },
};

export default function suite() {
    let stubDownloadTool: sinon.SinonStub;
    let stubWhich: sinon.SinonStub;
    let stubTool: sinon.SinonStub;

    describe("script.ts test suite", () => {
        beforeEach(() => {
            // setup stubs
            stubDownloadTool = sinon.stub(toolLib, "downloadToolWithRetries");
            stubDownloadTool.callsFake((url, fileName?, handlers?) => {
                return Promise.resolve("/path/to/script");
            });
            stubWhich = sinon.stub(taskLib, "which");
            stubWhich.callsFake((file) => {
                return Promise.resolve("/bin/bash");
            });
            stubTool = sinon.stub(taskLib, "tool");
            stubTool.callsFake((bin) => {
                return mockToolRunner;
            });
            mockToolRunner.args = [] as string[];
        });

        afterEach(() => {
            // restore stubs
            stubDownloadTool.restore();
            stubWhich.restore();
            stubTool.restore();
        });

        it("downloadAndRunScript ideally works unix", async () => {
            stubWhich.callsFake((file) => {
                if (file === "bash") {
                    return Promise.resolve("/bin/bash");
                } else {
                    return Promise.resolve("/bin/sudo");
                }
            });

            const platform = "linux";
            const url = "https://mathworks.com/myscript";
            const args = ["--release", "r2022b"];
            const exitCode = await script.downloadAndRunScript(platform, url, args);
            assert(exitCode === 0);
            assert(mockToolRunner.args.includes("-E"));
            assert(args.every((arg) => mockToolRunner.args.includes(arg)));
        });

        it("downloadAndRunScript ideally works windows", async () => {
            stubWhich.callsFake((file) => {
                if (file === "bash") {
                    return Promise.resolve("/bin/bash");
                } else {
                    return Promise.resolve("");
                }
            });

            const platform = "win32";
            const url = "https://mathworks.com/myscript";
            const args = ["--release", "r2022b"];
            const exitCode = await script.downloadAndRunScript(platform, url, args);

            assert(exitCode === 0);
            assert(!mockToolRunner.args.includes("-E"));
            assert(args.every((arg) => mockToolRunner.args.includes(arg)));
        });

        // defaultInstallRoot test cases
        const testCase = (platform: string, subdirectory: string) => {
            it(`defaultInstallRoot sets correct install directory for ${platform}`, async () => {
                const installDir = script.defaultInstallRoot(platform, "matlab-batch");
                assert(installDir.includes(subdirectory));
                assert(installDir.includes("matlab-batch"));
            });
        };

        testCase("win32", "Program Files");
        testCase("darwin", "opt");
        testCase("linux", "opt");
    });
}
