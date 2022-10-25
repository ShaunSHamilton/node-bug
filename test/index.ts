const codeString = `function test() {
  let a = 1;
  a++;
  for (let i = 0; i < 10; i++) {
    a++;
  }
  somethingToSpyOn(a);
  console.log(\`a: \${a}\`);
  return a;
}
test();
`;

import {
  assertCallExpression,
  assertIdentifier,
  assertVariableDeclaration,
} from "@babel/types";
import { Babeliser } from "babeliser";
import { NodeBug } from "../src/index.js";

const babelisedCode = new Babeliser(codeString);

const aVariableDeclaration = babelisedCode
  .getVariableDeclarations()
  .find((v) => {
    const identifier = v.declarations?.[0]?.id;
    assertIdentifier(identifier);
    return identifier.name === "a";
  });

assertVariableDeclaration(aVariableDeclaration);
const { end } = aVariableDeclaration;
assertIs<number>(end, "number");
const nodeBug = new NodeBug(codeString);
nodeBug.attachDebugger(end, "exec('a')");

const { start: spyStart } = babelisedCode
  .getExpressionStatements()
  .find((e) => {
    const expression = e.expression;
    assertCallExpression(expression);
    assertIdentifier(expression.callee);
    return expression.callee.name === "somethingToSpyOn";
  })!;
nodeBug.defineSpy(
  spyStart!,
  "let mySpy = null; const somethingToSpyOn = (...args) => mySpy = args;"
);
// Alternative
// nodeBug.defineSpy(spyStart! - 1, {name: "mySpy", polyfill: "let mySpy = null; const somethingToSpyOn = (...args) => mySpy = args;"});
const res = await nodeBug.inspect();
console.log("res: ", res);

function assertIs<T>(n: unknown, type: string): asserts n is T {
  if (typeof n !== type) {
    throw new Error("Not a number");
  }
}
