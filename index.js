import { readFile, writeFile } from "fs/promises";
import { Babeliser } from "babeliser";

const fixtureCodeString = await readFile("./fix.js", "utf-8");

const babelisedCode = new Babeliser(fixtureCodeString);

function insertDebuggerAfter(codeString, loc) {
  const firstHalf = codeString.slice(0, loc);
  const secondHalf = codeString.slice(loc);
  return firstHalf + '\nconsole.log("--NODE_BUG--");debugger;' + secondHalf;
}

// Insert debugger after first const a = 1;
const aVariableDeclaration = babelisedCode
  .getVariableDeclarations()
  .find((v) => {
    return v.declarations?.[0]?.id?.name === "a";
  });

const { end } = aVariableDeclaration;

const codeWithDebugger = insertDebuggerAfter(fixtureCodeString, end);

const codeWithFunctionCalled = codeWithDebugger + "\ntest();";
// Write to temp file `_test.js`

await writeFile("_test.js", codeWithFunctionCalled, "utf-8");

// Run the code with debugger
// NODE_INSPECT_RESUME_ON_START=1 node inspect _test.js

const getScriptOutput = async function (command, input = []) {
  let nextInput = 0;
  let nextGuess = 0;

  const child = exec(command, { cwd: ".." });
  child.stdout.on("data", () => {
    if (nextInput < input.length) {
      child.stdin.write(`${input[nextInput++] || ""}\n`);
    } else {
      child.stdin.write(`${nextGuess++}\n`);
    }
    tempGuesses = nextGuess - 1;
  });

  child.stderr.on("data", (err) => {
    console.log(`An error occurred running ${command}`);
    console.log(err);
  });

  setTimeout(() => {
    child.kill();
  }, 1000);

  const { stdout } = await child;
  return stdout;
};

import { exec } from "promisify-child-process";
const ls = exec("node inspect _test.js", {
  env: {
    ...process.env,
    NODE_INSPECT_RESUME_ON_START: "1",
  },
  shell: "/bin/bash",
  cwd: process.cwd(),
});

const quit = ".exit";
const expression = "exec('a')";

let nodeBugWasFound = false;
ls.stdout.on("data", (data) => {
  if (nodeBugWasFound) {
    console.log("Data I want: ", data.toString());
    nodeBugWasFound = false;
    ls.stdin.write(`${quit}\n`);
  }
  // console.log(`Data: ${data}`);
  const nodeBugFound =
    data.includes("--NODE_BUG--") &&
    !data.includes('console.log("--NODE_BUG--");debugger;');
  if (nodeBugFound) {
    setTimeout(() => {
      ls.stdin.write(expression + "\n");
      nodeBugWasFound = true;
    }, 1000);
  }
});

ls.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

ls.stdin.on("data", (data) => {
  console.log(`stdin: ${data}`);
});

ls.on("close", (code) => {
  console.log(`child process exited with code ${code}`);
});

const timeout = setTimeout(async () => {
  if (ls.connected) {
    console.warn("Killing process");
    ls.kill();
    throw new Error("Process timed out");
  }
}, 5000);

const out = await ls;
console.log(out);
clearTimeout(timeout);
if (ls.connected) {
  ls.disconnect();
}
