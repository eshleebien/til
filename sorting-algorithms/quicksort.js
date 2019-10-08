

function quick_sort(name, numbers, low, high) {

  console.log(name, low, high);
  if (low < high) {
    pi = partition(numbers, low, high);
    quick_sort("before", numbers, low, pi-1);
    quick_sort("after", numbers, pi+1, high);
  }

  return numbers;
}

function partition(arr, low, high) {
  let pivot = arr[high];
  // console.log("low:", low, "high", high);
  let i = low;
  for (let j = i; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[j], arr[i-1]] = [arr[i-1], arr[j]];
      console.log(j, i, arr);
    }
  }
  [arr[i],arr[high]] = [pivot, arr[i]];
  console.log(arr);
  return i;
}

//n = [12,34,76,44,2,5,10,1,88,70,50];
n = [76,88,33,22,70,56];
result = quick_sort("initial", n, 0, n.length-1);
console.log("result:", result);
