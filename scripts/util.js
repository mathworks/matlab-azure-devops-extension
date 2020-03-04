"use strict";

const sh = require("shelljs");
const path = require("path");

function cpdir(src, dest, options) {
    if (!options) {
        options = {};
    }

    let files = sh.find(src).map((f) => path.relative(src, f));
    if (options.filter) {
        files = files.filter(options.filter);
    }

    for (let f of files) {
        const s = path.join(src, f);
        const d = path.join(dest, f);
        if (sh.test("-d", s)) {
            sh.mkdir("-p", d);
        } else {
            sh.cp(s, d);
        }
    }
}
exports.cpdir = cpdir;