/*
# 2 Ordered Link List

根据输入的数组中每项的 before/after/first/last 规则，输出一个新排好序的数组或者链表。要求，多解的情况可以只求一解，如果无解要求程序能检测出来。**注意输入数组是无序的**，before 和 after 规则不需要**紧邻**着指定的元素，只要满足是 before/after 即可。

示例 Input:

```
[
    {id: 1},
    {id: 2, before: 1}, // 这里 before 的意思是自己要排在 id 为 1 的元素前面
    {id: 3, after: 1},  // 这里 after 的意思是自己要排在 id 为 1 元素后面
    {id: 5, first: true},
    {id: 6, last: true},
    {id: 7, after: 8}, // 这里 after 的意思是自己要排在 id 为 8 元素后面
    {id: 8},
    {id: 9},
]
```
 */

class InvalidInputError extends Error {
    constructor(msg) {
        super(msg);
        this.code = 'INVALID_INPUT'
    }
}

exports.testCase = [
    {
        name: 'normal case',
        input: [
            [
                {id: 1},
                {id: 2, before: 1}, // 这里 before 的意思是自己要排在 id 为 1 的元素前面
                {id: 3, after: 1},  // 这里 after 的意思是自己要排在 id 为 1 元素后面
                {id: 5, first: true},
                {id: 6, last: true},
                {id: 7, after: 8}, // 这里 after 的意思是自己要排在 id 为 8 元素后面
                {id: 8},
                {id: 9},
            ]
        ],
        output: [
            5,
            2,
            1,
            3,
            8,
            7,
            9,
            6
        ]
    },
    {
        name: 'circle invalid case',
        input: [
            [
                {id: 1, before: 2},
                {id: 2, before: 1},
                {id: 5, first: true},
                {id: 6, last: true},
            ]
        ],
        error: /invalid input/
    }
]

// 7:44 => 8:10
const main = (arr) => {
    if (!Array.isArray(arr)) {
        throw new TypeError('requires array, but ' + typeof arr)
    }
    const queue = arr.slice()
    const rs = []
    let loop = queue.length
    let i = 0

    while (queue.length) {
        if (i >= loop) {
            // circle
            if (loop <= queue.length) {
                throw new InvalidInputError(`invalid input`)
            }
            loop = queue.length
            i = 0
        }
        i++
        const item = queue.shift()
        if (item.first) {
            if (item.after != null) {
                throw new InvalidInputError(`"first" item should not have "after"`)
            }
            if (rs[0] && rs[0].first) {
                throw new InvalidInputError(`has twice "first" item at least`)
            }
            rs.unshift(item)
        }
        else if (item.last) {
            if (item.before != null) {
                throw new InvalidInputError(`"last" item should not have "before"`)
            }
            if (rs[rs.length - 1] && rs[rs.length - 1].last) {
                throw new InvalidInputError(`has twice "last" item at least`)
            }
            rs.push(item)
            // queue.shift()
        }
        else if (item.before != null) {
            const foundIndex = rs.findIndex(x => x.id === item.before)
            if (foundIndex < 0) {
                queue.push(item)
            } else {
                rs.splice(foundIndex, 0, item)
            }
        }
        else if (item.after != null) {
            const foundIndex = rs.findIndex(x => x.id === item.after)
            if (foundIndex < 0) {
                queue.push(item)
            } else {
                rs.splice(foundIndex + 1, 0, item)
            }
        } else {
            const insertIndex = rs[rs.length - 1] && rs[rs.length - 1].last ? rs.length - 1 : rs.length
            rs.splice(insertIndex, 0, item)
        }
    }

    return rs.map(x => x.id)
}

exports.main = main
