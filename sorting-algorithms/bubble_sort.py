import random

def generate():
  return random.sample(range(1, 100), 20)

def not_bubble_sort(n):
  index = 1
  swap = 0
  loop_count = 0

  while index < len(n):
    if n[index] < n[index-1]:
      n[index], n[index-1] = n[index-1], n[index]
      swap += 1

    if swap > 0:
      index = 0
      swap = 0
    index += 1
    loop_count +=1


  print("sorted:", n)
  print("loop count:", loop_count)

def bubble_sort(n):
  loop_count = 0
  for i in range(0, len(n)):
    loop_count+=1
    for j in range(0, len(n) - i - 1):
      loop_count+=1
      if n[j] > n[j+1]:
        n[j], n[j+1] = n[j+1], n[j]

  print("sorted:", n)
  print("loop count:", loop_count)

unsorted = generate()

print("numbers", unsorted)
# not_bubble_sort(unsorted.copy())
not_bubble_sort([15, 23, 10, 32, 52, 87, 40, 41, 88, 75, 51, 13, 99, 30, 69, 54, 35, 50, 70, 39])
bubble_sort([15, 23, 10, 32, 52, 87, 40, 41, 88, 75, 51, 13, 99, 30, 69, 54, 35, 50, 70, 39])
