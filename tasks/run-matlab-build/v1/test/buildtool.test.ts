// Copyright 2024 The MathWorks, Inc.

import * as assert from "assert";
import * as buildtool from "../buildtool";

export default function suite() {
    describe("command generation", () => {
        it("buildtool invocation with unspecified tasks and build options", () => {
            const options: buildtool.IRunBuildOptions = {
                Tasks: "",
            };

            const actual = buildtool.generateCommand(options);
            assert(actual === "buildtool");
        });

        it("buildtool invocation with tasks specified", () => {
            const options: buildtool.IRunBuildOptions = {
                Tasks: "compile test",
            };

            const actual = buildtool.generateCommand(options);
            assert(actual === "buildtool compile test");
        });
    });
}
