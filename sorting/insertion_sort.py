import random

def generate():
  return random.sample(range(1, 100), 20)

def insertion_sort(n):
  loop_counter = 0

  for i in range(1, len(n)):
    key = n[i]
    j = i-1
    while j >=0 and key < n[j]:
      n[j+1] = n[j]
      j-=1
      loop_counter += 1

    n[j+1] = key
    loop_counter += 1
  print("sorted:", n)
  print("loop:", loop_counter)


unsorted = generate()

print("numbers", unsorted)
#insertion_sort(unsorted.copy())
insertion_sort([15, 23, 10, 32, 52, 87, 40, 41, 88, 75, 51, 13, 99, 30, 69, 54, 35, 50, 70, 39])
