function real_bubblesort(list) {
  let loop_count = 0;
  for (let i = 0; i < list.length; i++) {
    let swap = false;
    loop_count ++;

    // last i elements are already in placed, so reduce the length
    for (let j = 0; j < list.length-i-1; j++) {
      loop_count ++;
      if (list[j] > list[j+1]) {
        [list[j], list[j+1]] = [list[j+1], list[j]];
        swap=true;
      }
    }
    // if (swap = false) {
    //   break;
    // }
  }

  console.log(loop_count, list);
}

function sort(list) {
  let loop_count = 0;
  for (let i = 1; i < list.length; i++) {
    loop_count ++;
    for (let j = 0; j < list.length; j++) {
      loop_count ++;
      if (list[i] < list[j]) {
        let tmp = list[j]
        list[j] = list[i];
        list[i] = tmp;
      }
    }
  }

  console.log(loop_count, list);
}

function bubble(list) {
  let loop_count = 0;
  let swap = 0;
  for (let i = 0; i < list.length; i++) {
    loop_count ++;
    if (list[i] < list[i-1]) {
      [list[i], list[i-1]] = [list[i-1], list[i]];
      swap++;
    }

    if (i == list.length - 1 && swap > 0) {
      swap=0;
      i=0;
    }
  }

  console.log(loop_count, list);
}

// bubble([23, 22, 11, 44, 2, 12]);
bubble([15, 23, 10, 32, 52, 87, 40, 41, 88, 75, 51, 13, 99, 30, 69, 54, 35, 50, 70, 39]);
real_bubblesort([15, 23, 10, 32, 52, 87, 40, 41, 88, 75, 51, 13, 99, 30, 69, 54, 35, 50, 70, 39]);
sort([15, 23, 10, 32, 52, 87, 40, 41, 88, 75, 51, 13, 99, 30, 69, 54, 35, 50, 70, 39]);
