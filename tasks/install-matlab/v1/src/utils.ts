// Copyright 2023-2026 The MathWorks, Inc.

// Vendored from azure-pipelines-tool-lib/tool with fixes for:
// - https://github.com/microsoft/azure-pipelines-tool-lib/issues/242
// - https://github.com/microsoft/azure-pipelines-tool-lib/issues/194

import * as taskLib from "azure-pipelines-task-lib/task";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as httpm from "typed-rest-client/HttpClient";
import * as ifm from "typed-rest-client/Interfaces";

const userAgent = "install-matlab/1.0.0";
const requestOptions = {
    proxy: taskLib.getHttpProxyConfiguration(),
    cert: taskLib.getHttpCertConfiguration(),
    allowRedirects: true,
    allowRetries: true,
    maxRetries: 2,
} as ifm.IRequestOptions;

function _getAgentTemp(): string {
    taskLib.assertAgent("2.115.0");
    const tempDirectory = taskLib.getVariable("Agent.TempDirectory");
    if (!tempDirectory) {
        throw new Error("Agent.TempDirectory is not set");
    }
    return tempDirectory;
}

function _getContentLengthOfDownloadedFile(response: httpm.HttpClientResponse): number {
    const contentLengthHeader = response.message.headers["content-length"];
    const parsedContentLength = parseInt(contentLengthHeader as string, 10);
    return parsedContentLength;
}

function _getFileSizeOnDisk(filePath: string): number {
    const fileStats = fs.statSync(filePath);
    const fileSizeInBytes = fileStats.size;
    return fileSizeInBytes;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadTool(
    url: string,
    fileName?: string,
    handlers?: ifm.IRequestHandler[],
    additionalHeaders?: ifm.IHeaders,
): Promise<string> {
    handlers = handlers || undefined;
    const http: httpm.HttpClient = new httpm.HttpClient(userAgent, handlers, requestOptions);
    taskLib.debug(fileName || "(no filename)");
    fileName = fileName || crypto.randomBytes(16).toString("hex");

    let destPath: string;
    if (path.isAbsolute(fileName)) {
        destPath = fileName;
    } else {
        destPath = path.join(_getAgentTemp(), fileName);
    }

    taskLib.mkdirP(path.dirname(destPath));

    console.log("Downloading " + url.replace(/sig=[^&]*/, "sig=-REDACTED-"));
    taskLib.debug("destination " + destPath);

    // FIX for azure-pipelines-tool-lib#242: Delete existing file instead of
    // throwing so that retries can succeed after a partial download.
    if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
    }

    taskLib.debug("downloading");
    const response: httpm.HttpClientResponse = await http.get(url, additionalHeaders);

    if (response.message.statusCode !== 200) {
        const err: any = new Error("Unexpected HTTP response: " + response.message.statusCode);
        err.httpStatusCode = response.message.statusCode;
        taskLib.debug(`Failed to download "${fileName}" from "${url}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`);
        throw err;
    }

    const downloadedContentLength = _getContentLengthOfDownloadedFile(response);
    if (!isNaN(downloadedContentLength)) {
        taskLib.debug(`Content-Length of downloaded file: ${downloadedContentLength}`);
    } else {
        taskLib.debug(`Content-Length header missing`);
    }

    taskLib.debug("creating stream");
    return new Promise<string>((resolve, reject: (err: Error) => void) => {
        const file: NodeJS.WritableStream = fs.createWriteStream(destPath);
        file
            .on("open", (fd) => {
                taskLib.debug("file write stream opened. fd: " + fd);
                const messageStream = response.message;
                if (messageStream.aborted || messageStream.destroyed) {
                    file.end();
                    reject(new Error("Incoming message read stream was Aborted or Destroyed before download was complete"));
                    return;
                }
                taskLib.debug("subscribing to message read stream events...");
                try {
                    messageStream
                        .on("error", (err: Error) => {
                            file.end();
                            reject(err);
                        })
                        // FIX for azure-pipelines-tool-lib#194: Removed .on('aborted')
                        // handler. The 'aborted' event can fire spuriously even when
                        // the file has been fully written, causing false download
                        // failures. The 'error' handler covers real failures.
                        .pipe(file);
                } catch (err: any) {
                    reject(err);
                }
                taskLib.debug("successfully subscribed to message read stream events");
            })
            .on("close", () => {
                taskLib.debug("download complete");
                let fileSizeInBytes: number;
                try {
                    fileSizeInBytes = _getFileSizeOnDisk(destPath);
                } catch (err: any) {
                    fileSizeInBytes = NaN;
                    taskLib.warning(`Unable to check file size of ${destPath} due to error: ${err.message}`);
                }

                if (!isNaN(fileSizeInBytes)) {
                    taskLib.debug(`Downloaded file size: ${fileSizeInBytes} bytes`);
                } else {
                    taskLib.debug(`File size on disk was not found`);
                }

                if (
                    !isNaN(downloadedContentLength) &&
                    !isNaN(fileSizeInBytes) &&
                    fileSizeInBytes !== downloadedContentLength
                ) {
                    taskLib.warning(`Content-Length (${downloadedContentLength} bytes) did not match downloaded file size (${fileSizeInBytes} bytes).`);
                }

                resolve(destPath);
            })
            .on("error", (err: Error) => {
                file.end();
                reject(err);
            });
    });
}

export async function downloadToolWithRetries(
    url: string,
    fileName?: string,
    handlers?: ifm.IRequestHandler[],
    additionalHeaders?: ifm.IHeaders,
    maxAttempts: number = 3,
    retryInterval: number = 500,
): Promise<string> {
    let attempt: number = 1;
    let destinationPath: string = "";

    while (attempt <= maxAttempts && destinationPath === "") {
        try {
            destinationPath = await downloadTool(url, fileName, handlers, additionalHeaders);
        } catch (err) {
            if (attempt === maxAttempts) {
                throw err;
            }
            const attemptInterval = attempt * retryInterval;

            taskLib.debug(`Attempt ${attempt} failed. Retrying after ${attemptInterval} ms`);

            await delay(attemptInterval);
            attempt++;
        }
    }

    return destinationPath;
}
