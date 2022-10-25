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
  somethingToSpyOn(a);
  console.log(`a: ${a}`);
  return a;
}

test();
