// var p1 = Promise.resolve(3);
// var p2 = 1337;
const res = async () => {
    var p3 = await new Promise((resolve, reject) => {
      setTimeout(resolve, 100, "foo");
    }); 

    return p3

}

console.log(res())
// Promise.all([p1, p2, p3]).then(values => { 
//   console.log(values); // [3, 1337, "foo"] 
// });

