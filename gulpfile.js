const gulp = require('gulp')
const os = require('os')
const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawn

// all the optional gulp targets

try { require('./gulp/compile-contracts.js') }
catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; }

try { require('./gulp/create-profiles.js') }
catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; }

try { require('./gulp/smart-agents.js') }
catch (e) { if (e.code !== "MODULE_NOT_FOUND") throw e; }


