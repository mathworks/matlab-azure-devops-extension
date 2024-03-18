// Copyright 2024 The MathWorks, Inc.

export interface IRunBuildOptions {
    Tasks?: string;
}

export function generateCommand(options: IRunBuildOptions): string {
    let buildtoolCommand: string = "buildtool";
    if (options.Tasks) {
        buildtoolCommand = buildtoolCommand + " " + options.Tasks;
    }
    return buildtoolCommand;
}
