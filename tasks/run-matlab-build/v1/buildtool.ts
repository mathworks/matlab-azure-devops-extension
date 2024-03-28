// Copyright 2024 The MathWorks, Inc.

export interface IRunBuildOptions {
    Tasks?: string;
    BuildOptions?: string;
}

export function generateCommand(options: IRunBuildOptions): string {
    let buildtoolCommand: string = "buildtool";
    if (options.Tasks) {
        buildtoolCommand = buildtoolCommand + " " + options.Tasks;
    }
    if (options.BuildOptions) {
        buildtoolCommand = buildtoolCommand + " " + options.BuildOptions;
    }
    return buildtoolCommand;
}
