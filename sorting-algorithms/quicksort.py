# quicksort is a divide and conquer algorithm
# The idea is to create a partition separated by a pivot.
# All the lower values than the pivot will go to its left side while the higher values in the right side.


def sort(arr, low, high):
  if low < high:
    pi = partition(arr, low, high)

    # sort the left side of the partition
    sort(arr, low, pi-1)
    # sort the right side of the partition
    sort(arr, pi+1, high)
  return arr

def partition(arr, low, high):
  pivot = arr[high]
  i = low
  for current in range(i, high):
    if arr[current] < arr[high]:
      i+=1
      arr[current], arr[i-1] = arr[i-1], arr[current]

    #else
    # retain the value of i index.
    # the i index serves as the position of the last higher value so
    # when the next iteration found a lower value, it knows where to swap

  # once the iteration ends, swap the values in i and high index
  # the value in high index is now in the correct position
  arr[high], arr[i] = arr[i], arr[high]

  # return the new position of the high index
  return i


n = [76,88,33,22,70,56]
res = sort(n, 0, len(n)-1)
print(res)
