package main

import (
	"fmt"
)

func main() {
	var list = []int{23, 12, 43, 65, 76, 25, 78}
	fmt.Println("Insertion Sort:", list)
	insertion_sort(list)

	list = []int{23, 12, 43, 65, 76, 25, 78}
	fmt.Println("Optimized Bubble Sort:", list)
	optimized_bubble_sort(list)

	list = []int{23, 12, 43, 65, 76, 25, 78}
	fmt.Println("Bubble Sort:", list)
	bubble_sort(list)
}

func optimized_bubble_sort(list []int) {
	var loop_count int
	for i, _ := range list {
		swapped := false
		loop_count++
		for j, _ := range list[:len(list)-i-1] {
			loop_count++
			if list[j] > list[j+1] {
				list[j], list[j+1] = list[j+1], list[j]
				swapped = true
			}
		}
		if !swapped {
			break
		}
	}
	fmt.Println(loop_count, list)
}

func bubble_sort(list []int) {
	var loop_count int
	for i, _ := range list {
		loop_count++
		for j, _ := range list[:len(list)-i-1] {
			loop_count++
			if list[j] > list[j+1] {
				t := list[j]
				list[j] = list[j+1]
				list[j+1] = t
			}
		}
	}

	fmt.Println(loop_count, list)
}

func insertion_sort(numbers []int) {
	var loop_count int
	for i, _ := range numbers {
		loop_count++
		key := numbers[i]
		j := i - 1
		for j >= 0 && key < numbers[j] {
			loop_count++
			// move numbers[j] to the next right index
			numbers[j+1] = numbers[j]
			j-- // check the next left index
		}
		numbers[j+1] = key
	}

	fmt.Println(loop_count, numbers)
}
