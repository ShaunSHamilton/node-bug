# Node Bug

A library to help you test JavaScript code.

## Installation

```bash
npm install node-bug
```

## Usage

Whilst not required, it is recommended Node Bug be used with [Babeliser](https://github.com/ShaunSHamilton/babeliser).

<details>
  <summary>Code to Test</summary>

```js
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
```

</details>

<details>
  <summary>Node Bug</summary>

```js
import { NodeBug } from "node-bug";

const bug = new NodeBug(codeString);
```

</details>

## Notes

Node Bug works by creating a sub-process to run `node inspect` on the given code string. This means that the code string must be valid JavaScript code.

Also, once `inspect()` is invoked, a `__nodebug.js` file will be created. Upon exiting, this file will be deleted.
