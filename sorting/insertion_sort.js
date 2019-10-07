function insertion_sort3(n) {
  let l = n.length-1;
  while(l--) {
    key = n[l];
    j = l+1;
    while (j<=n.length && key < n[j]) {
      n[j-1] = n[j];
      j++;
    }

    n[j-1] = key;
  }
  console.log(n);
}
function insertion_sort(n) {
  for (let i =0; i < n.length; i++) {
    key = n[i];
    j = i-1;

    while (j >=0 && key < n[j]) { // is the current key less than the previous number?
      n[j+1] = n[j]; // swap the two. the "key" will move to the left side
      j-=1; // next loop, compare the precedent.
    }
    n[j+1] = key;
  }
  console.log(n);
}

function insertion_sort2(n) {
  console.log(n);
  for (let i=1; i< n.length; i++) {
    key = n[i];
    for (j=i-1; j>=0 && key < n[j]; j--) {
      n[j+1] = n[j];
    }
    n[j+1] = key;
  }
  console.log(n);
}

//insertion_sort2([43,23,32, 1]);
insertion_sort3([43,23,32, 1]);
// 43,23,32,1
// 23,43,32,1
// 23,32,43,1
// 23,32,1,43
// 23,1,32,43
// 1,23,32,43
