import { readFile } from "fs/promises";
import { Babeliser } from "babeliser";
import { NodeBug } from "../src/index.js";

// Get fixture file
const fixture = await readFile("./fix.js", "utf-8");
// Babelise code string to get AST
const babelisedCode = new Babeliser(fixture);
// Find only the function named "test"
const testFunction = babelisedCode.getFunctionDeclarations().find((f) => {
  return f.id?.name === "test";
});
assertIs<object>(testFunction, "object");
// Generate code from just "test" AST
const testCodeString = babelisedCode.generateCode(testFunction);
// Add function call to generated code
const testableCodeString = testCodeString + "\ntest();";
// Create NodeBug instance
const nodeBug = new NodeBug(testableCodeString);
// Get location of end of "test" function
const { end } = testFunction;
assertIs<number>(end, "number");
// Define polyfills and/or spies
const complexApi = (...args: any[]) => args;
// Get location to place spy
const spyLoc = 0;
nodeBug.defineSpy(spyLoc, complexApi);
// Get location of `a` variable declaration
const aDeclaration = babelisedCode.getVariableDeclarations().find((v) => {
  // @ts-ignore
  return v?.id?.name === "a";
});
assertIs<object>(aDeclaration, "object");
const { end: aEnd } = aDeclaration;
assertIs<number>(aEnd, "number");
// Attach debugger after `a` variable declaration
nodeBug._rawDebug(aEnd, "exec('a')");

// const { start: spyStart } = babelisedCode
//   .getExpressionStatements()
//   .find((e) => {
//     const expression = e.expression;
//     // @ts-ignore Assert is later
//     return expression?.callee?.name === "somethingToSpyOn";
//   })!;
// nodeBug.defineSpy(
//   spyStart!,
//   "let mySpy = null; const somethingToSpyOn = (...args) => mySpy = args;"
// );
// Alternative
// nodeBug.defineSpy(spyStart! - 1, {name: "mySpy", polyfill: "let mySpy = null; const somethingToSpyOn = (...args) => mySpy = args;"});
const res = await nodeBug.inspect();
console.log("res: ", res);

function assertIs<T>(n: unknown, type: string): asserts n is T {
  if (typeof n !== type) {
    throw new Error("Not a number");
  }
}
