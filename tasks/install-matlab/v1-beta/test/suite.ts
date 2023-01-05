// Copyright 2023 The MathWorks, Inc.

import installTests from "./install.test";
import matlabTests from "./matlab.test";
import mpmTests from "./mpm.test";
import scriptTests from "./script.test";

describe("InstallMATLAB V1 Suite", () => {
    // installTests();
    matlabTests();
    mpmTests();
    scriptTests();
});
