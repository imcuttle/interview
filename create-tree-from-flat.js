/*
# 3 Create Tree from flat data

将输入的数组组装成一颗树状的数据结构，时间复杂度越小越好。要求程序具有侦测错误输入的能力。**注意输入数组是无序的**。

示例 Input:

```
[
    {id:1, name: 'i1'},
    {id:2, name:'i2', parentId: 1},
    {id:4, name:'i4', parentId: 3},
    {id:3, name:'i3', parentId: 2},
    {id:8, name:'i8', parentId: 7}
]
```
 */

class Node {
    constructor(val, children = []) {
        this.val = val
        this.children = children
    }
}


exports.testCase = [
    {
        name: 'no parent case',
        input: [
            [
                {id:1, name: 'i1'},
                {id:2, name:'i2', parentId: 1},
                {id:4, name:'i4', parentId: 3},
                {id:3, name:'i3', parentId: 2},
                {id:8, name:'i8', parentId: 7}
            ]
        ],
        error: /invalid input: no parent/
    },
    {
        name: 'normal case',
        input: [
            [
                {id:1, name: 'i1'},
                {id:2, name:'i2', parentId: 1},
                {id:4, name:'i4', parentId: 3},
                {id:3, name:'i3', parentId: 2},
                {id:8, name:'i8', parentId: 2}
            ]
        ],
        compare: 'toMatchObject',
        output: new Node({
            id: 1,
            name: 'i1'
        }, [
            new Node({
                id: 2,
                name: 'i2'
            }, [
                new Node({
                    id: 3,
                    name: 'i3'
                }, [
                    new Node({
                        id: 4,
                        name: 'i4'
                    })
                ]),
                new Node({
                    id: 8,
                    name: 'i8'
                })
            ])
        ])
    }
]

// 8:26 => 8:45
exports.main = (arr) => {
    if (!Array.isArray(arr)) {
        throw new TypeError('requires array, but ' + typeof arr)
    }

    const parentId2ChildrenMap = new Map()
    const id2NodeMap = new Map()
    let root

    for (const item of arr) {
        const node = new Node(item)
        if (!item.id) {
            throw new Error('item requires "id" field')
        }
        if (item.id === item.parentId) {
            throw new Error('item.id === item.parentId')
        }
        id2NodeMap.set(item.id, node)
        if (item.parentId == null) {
            if (root) {
                throw new Error('already has root')
            }
            root = node
        } else {
            const parent = id2NodeMap.get(item.parentId)
            const array = parent ? parent.children : (parentId2ChildrenMap.get(item.parentId) || [])
            array.push(node)

            if (parent) {
                parent.children = array
                parentId2ChildrenMap.delete(item.parentId)
            } else {
                parentId2ChildrenMap.set(item.parentId, array)
            }
        }
    }
    if (!root) {
        throw new Error(`invalid input: no root`)
    }

    for (const [pId, children] of parentId2ChildrenMap.entries()) {
        const parent = id2NodeMap.get(pId)
        if (!parent) {
            // 找不到对应的 parent
            throw new Error(`invalid input: no parent`)
        }
        parent.children = children
    }
    return root
}
