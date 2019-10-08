
function bubble(numbers) {
  for (let i=0; i< numbers.length; i++) {
    for (let j =0; j< numbers.length-i-1; j++) {
      if (numbers[j] > numbers[j+1]) {
        [numbers[j], numbers[j+1]] =  [numbers[j+1], numbers[j]];
      }
    }
  }
  console.log(numbers);
}

b([23,5,34,76,1,42]);
