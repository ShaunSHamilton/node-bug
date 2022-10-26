import { writeFile, rm } from "fs/promises";
import { exec } from "promisify-child-process";
import { Logger } from "logover";

const logger = new Logger({
  level: process.env["LOG_LEVEL"] || process.env["NODE_BUG_LEVEL"] || "error",
  debug: "",
  error: "NODE BUG",
});

export class NodeBug {
  private _codeString: string;
  private _fileName: string;
  private _expressions: string[];

  constructor(codeString: string) {
    this._codeString = codeString;
    this._fileName = "__nodebug.js";
    this._expressions = [];
  }
  attachDebugger(location: number, expression: string) {
    const firstHalf = this._codeString.slice(0, location);
    const secondHalf = this._codeString.slice(location);
    this._codeString =
      firstHalf + '\nconsole.log("--NODE_BUG--");debugger;' + secondHalf;
    this._expressions.push(expression);
    return this;
  }
  defineSpy(location: number, spy: Function) {
    const spyString = spy.toString();
    const firstHalf = this._codeString.slice(0, location);
    const secondHalf = this._codeString.slice(location);
    this._codeString = firstHalf + `\n${spyString}\n` + secondHalf;
    return this;
  }
  async inspect() {
    await this._writeCodeToFile();

    const proc = exec(`node inspect ${this._fileName}`, {
      env: {
        ...process.env,
        NODE_INSPECT_RESUME_ON_START: "1",
      },
    });

    if (!proc.stdout || !proc.stderr || !proc.stdin) {
      throw new Error("stdout is null");
    }

    const output: string[] = [];

    let nodeBugWasFound = false;
    proc.stdout.on("data", (data) => {
      logger.debug(data.toString());
      const nodeBugFlagFound =
        data.includes("--NODE_BUG--") &&
        !data.includes('console.log("--NODE_BUG--");debugger;');
      if (nodeBugFlagFound && this._expressions.length) {
        const expression = this._expressions.shift();
        setTimeout(() => {
          proc.stdin!.write(expression + "\n");
          if (this._expressions.length === 0) {
            nodeBugWasFound = true;
          }
        }, 1000);
      }

      // TODO: This only works for the first expression
      if (nodeBugWasFound) {
        logger.debug("Data I want: ", data.toString());
        const dataSans = data.toString().split("\ndebug>")[0];
        output.push(dataSans);
        nodeBugWasFound = false;
        proc.stdin!.write(`.exit\n`);
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
      output,
    };
    await this._cleanUp();
    return result;
  }
  // async insertDebuggerAfter(codeString, loc) {}
  // _generateExpression() {
  //   for (const expression of this._expressions) {
  //     yield expression;
  //   }
  // }
  /**
   * Available to give access to inner stdin of the `node inspect` process
   *
   * **NOTE:** This is not recommended to use unless you know what you are doing
   * @param location Location to place debugger
   * @param expression `node inspect` stdin expression
   */
  _rawDebug(location: number, expression: string) {
    const firstHalf = this._codeString.slice(0, location);
    const secondHalf = this._codeString.slice(location);
    this._codeString =
      firstHalf + '\nconsole.log("--NODE_BUG--");debugger;' + secondHalf;
    this._expressions.push(expression);
    return this;
  }
  async _writeCodeToFile() {
    await writeFile(this._fileName, this._codeString, "utf-8");
  }
  async _cleanUp() {
    await rm(this._fileName);
  }
}
