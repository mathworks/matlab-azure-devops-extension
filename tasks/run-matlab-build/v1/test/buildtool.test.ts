// Copyright 2024 The MathWorks, Inc.

import * as assert from "assert";
import * as buildtool from "../buildtool";

export default function suite() {
    describe("command generation", () => {
        it("buildtool invocation with unspecified tasks and build options", () => {
            const options: buildtool.IRunBuildOptions = {
                Tasks: "",
                BuildOptions: "",
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

        it("buildtool invocation with only build options", () => {
            const options: buildtool.IRunBuildOptions = {
                Tasks: "",
                BuildOptions: "-continueOnFailure -skip check",
            };
    
            const actual = buildtool.generateCommand(options);
            assert(actual === "buildtool -continueOnFailure -skip check");
        });
    
        it("buildtool invocation with specified tasks and build options", () => {
            const options: buildtool.IRunBuildOptions = {
                Tasks: "compile test",
                BuildOptions: "-continueOnFailure -skip check",
            };
    
            const actual = buildtool.generateCommand(options);
            assert(actual === "buildtool compile test -continueOnFailure -skip check");
        });
    });
}
