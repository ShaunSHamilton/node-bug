"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  NodeBug: () => NodeBug
});
module.exports = __toCommonJS(src_exports);
var import_promises = require("fs/promises");
var import_promisify_child_process = require("promisify-child-process");
var import_logover = require("logover");
var logger = new import_logover.Logger({
  level: process.env["LOG_LEVEL"] || "info"
});
var NodeBug = class {
  _codeString;
  _fileName;
  _expressions;
  constructor(codeString) {
    this._codeString = codeString;
    this._fileName = "__nodebug.js";
    this._expressions = [];
  }
  attachDebugger(location, expression) {
    const firstHalf = this._codeString.slice(0, location);
    const secondHalf = this._codeString.slice(location);
    this._codeString = firstHalf + '\nconsole.log("--NODE_BUG--");debugger;' + secondHalf;
    this._expressions.push(expression);
    return this;
  }
  defineSpy(location, expression) {
    const firstHalf = this._codeString.slice(0, location);
    const secondHalf = this._codeString.slice(location);
    this._codeString = firstHalf + `
${expression}
` + secondHalf;
    return this;
  }
  async inspect() {
    await this._writeCodeToFile();
    const proc = (0, import_promisify_child_process.exec)(`node inspect ${this._fileName}`, {
      env: {
        ...process.env,
        NODE_INSPECT_RESUME_ON_START: "1"
      }
    });
    if (!proc.stdout || !proc.stderr || !proc.stdin) {
      throw new Error("stdout is null");
    }
    const output = [];
    let nodeBugWasFound = false;
    proc.stdout.on("data", (data) => {
      logger.debug(data.toString());
      const nodeBugFlagFound = data.includes("--NODE_BUG--") && !data.includes('console.log("--NODE_BUG--");debugger;');
      if (nodeBugFlagFound && this._expressions.length) {
        const expression = this._expressions.shift();
        setTimeout(() => {
          proc.stdin.write(expression + "\n");
          if (this._expressions.length === 0) {
            nodeBugWasFound = true;
          }
        }, 1e3);
      }
      if (nodeBugWasFound) {
        logger.debug("Data I want: ", data.toString());
        const dataSans = data.toString().split("\ndebug>")[0];
        output.push(dataSans);
        nodeBugWasFound = false;
        proc.stdin.write(`.exit
`);
      }
    });
    proc.stderr.on("data", (data) => {
      logger.error(`stderr: ${data}`);
    });
    proc.on("close", (code) => {
      logger.info(`child process exited with code ${code}`);
      this._cleanUp();
    });
    const res = await proc;
    const result = {
      ...res,
      output
    };
    await this._cleanUp();
    return result;
  }
  async _writeCodeToFile() {
    await (0, import_promises.writeFile)(this._fileName, this._codeString, "utf-8");
  }
  async _cleanUp() {
    await (0, import_promises.rm)(this._fileName);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NodeBug
});
