// @ts-nocheck
// @ts-ignore
import { complexApi } from "./complexApi";

function test() {
  let a = 1;
  const obj = {
    a: 2,
  };
  obj.a = 3;
  a++;
  for (let i = 0; i < 10; i++) {
    a++;
  }
  complexApi(a);
  console.log(`a: ${a}`);
  return a;
}
