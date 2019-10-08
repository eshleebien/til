import random

def sort(n):
  print(n)
  for i in range(1, len(n)):
    key = n[i]
    j = i-1

    while j >= 0 and key < n[j]:
      n[j+1] = n[j] # swap the value if key < the precedent
      j-=1 # repeat for the rest of the previous numbers

    n[j+1] = key
  print(n)

sort(random.sample(range(100, 300), 10))
