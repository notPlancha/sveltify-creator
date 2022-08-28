#!/usr/bin/env node

import { build } from "./scripts.js";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2));

build(argv['watch'] || argv['w'], argv['minify'] || argv['m'], argv['out'] || argv['o']).then(() =>{

})
