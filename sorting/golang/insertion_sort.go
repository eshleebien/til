package main

import "fmt"

func main() {
	list := [6]int{23, 12, 43, 42, 55, 33}
	fmt.Println("vim-go")
	insertion_sort(list)
}

func insertion_sort(list [6]int) {
	fmt.Println("insertion")
	for i, val := range list {
		key := val

		j := i - 1
		// for j >= 0 && key < list[j] {
		// 	list[j+1] = list[j]
		// 	j--
		// }

		for j >= 0 {
			if key < list[j] {
				list[j+1] = list[j]
				j--
			} else {
				break
			}
		}
		list[j+1] = key
	}

	fmt.Println(list)
}
