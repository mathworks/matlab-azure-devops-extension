// Copyright 2023-2026 The MathWorks, Inc.

import * as toolLib from "./tool-lib";

export async function downloadToolWithRetries(url: string, fileName?: string): Promise<string> {
    return toolLib.downloadToolWithRetries(url, fileName);
}
