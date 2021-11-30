const caseList = [
    'ordered-link-list',
    'create-tree-from-flat',
    'event-bus',
]

caseList.forEach(name => {
    describe(name, () => {
        const {main, testCase} = require(`./${name}`)
        testCase.forEach((tc, index) => {
            it(tc.name || `test_${index}`, async () => {
                const runMain = tc.main || main
                if (tc.error != null) {
                    expect(() => runMain.apply(null, tc.input)).toThrow(tc.error)
                }
                else {
                    expect(await runMain.apply(null, tc.input))[tc.compare || 'toEqual'](tc.output)
                }
            })
        })
    })
})

