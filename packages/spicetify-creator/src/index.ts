#!/usr/bin/env node

import { build } from "./scripts.js";
import minimist from "minimist";
import fs from "fs";
import path from "path";

const argv = minimist(process.argv.slice(2));

build(argv['watch'] || argv['w'], argv['minify'] || argv['m'], argv['out'] || argv['o']).then(() =>{
    const __dirname = path.resolve();
    const tempFolder = path.join(__dirname,`./temp/`);
    if (fs.existsSync(tempFolder)){
        fs.rmdirSync(tempFolder)
    }
})
