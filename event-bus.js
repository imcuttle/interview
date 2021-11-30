// 9:00 => 10:10

class Call {
    constructor(type, name, data, cbs = []) {
        this.type = type
        this.name = name
        this.data = data
        this.calls = cbs

        this.parent = null
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            calls: this.calls
        }
    }

    toString(prefix = '') {
        return [
            `${prefix}${this.type === 'event' ? 'event' : 'callback'}: ${this.name}`,
            ...this.calls.map((call, i) => call.toString(' '.repeat(prefix.length) + `  |-`))
        ].join('\n')
    }
}

class EventBus {
    constructor() {
        this.events = Object.create(null)
    }

    getEventCallbacks(name) {
        return this.events[name] || []
    }

    clone() {
        const cl = new EventBus()
        cl.events = this.events
        return cl
    }

    trigger(name, ...args) {
        const eventCall = new Call('event', name)
        if (this.callee) {
            this.callee.calls.push(eventCall)
            eventCall.parent = this.callee
        }
        const cbs = this.getEventCallbacks(name)
        const promises = []
        for (const cb of cbs) {
            let p = this.callee
            while (p) {
                if (p.data.raw === cb) {
                    throw new Error(`circle event call: ${p.parent.name}`)
                }
                p = p.parent
                if (p) {
                    p = p.parent
                }
            }

            const cbCall = new Call('cb', cb.name, {raw: cb})
            cbCall.parent = eventCall
            eventCall.calls.push(cbCall)

            const cl = this.clone()
            cl.callee = cbCall

            promises.push(Promise.resolve(cb.apply(cl, args)).finally(() => {
                delete cl.callee
            }))
        }
        return {
            call: eventCall,
            promise: Promise.all(promises)
        }
    }

    listen(name, cb) {
        if (typeof cb !== 'function') {
            throw new TypeError('cb requires function')
        }
        const cbs = this.events[name] = this.getEventCallbacks(name)
        cbs.push(cb)

        return () => {
            const cbs = this.getEventCallbacks(name)
            const i = cbs.indexOf(cb)
            if (i >= 0) {
                cbs.splice(i, 1)
            }
        }
    }
}


exports.testCase = [
    {
        name: 'normal sync case',
        main: () => {
            const bus = new EventBus()
            bus.listen('testEvent', function callback1() {
                // do something
                this.trigger('testEvent2')
                this.trigger('testEvent3')
                this.trigger('testEvent4')
            })

            bus.listen('testEvent2', function callback2() {
            })

            bus.listen('testEvent3', function callback3() {
                this.trigger('testEvent4')
            })

            bus.listen('testEvent4', function callback4() {
            })

            return bus.trigger('testEvent').call.toString()
        },
        output: `
event: testEvent
  |-callback: callback1
      |-event: testEvent2
          |-callback: callback2
      |-event: testEvent3
          |-callback: callback3
              |-event: testEvent4
                  |-callback: callback4
      |-event: testEvent4
          |-callback: callback4
`.trim()
    },

    {
        name: 'circle sync case',
        main: () => {
            const bus = new EventBus()
            bus.listen('testEvent', function callback1() {
                // do something
                this.trigger('testEvent2')
                this.trigger('testEvent3')
                this.trigger('testEvent4')
            })

            bus.listen('testEvent2', function callback2() {
            })

            bus.listen('testEvent3', function callback3() {
                this.trigger('testEvent4')
            })

            bus.listen('testEvent4', function callback4() {
                this.trigger('testEvent3')
            })

            return bus.trigger('testEvent').toString()
        },
        error: 'circle event call: testEvent3'
    },

    {
        name: 'async case',
        main: async () => {
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
            const bus = new EventBus()
            bus.listen('testEvent', async function callback1() {
                // do something
                await this.trigger('testEvent2').promise
                await delay(100)
                await this.trigger('testEvent3').promise
                await this.trigger('testEvent4').promise
            })

            bus.listen('testEvent', async function callback1_1() {
            })

            bus.listen('testEvent2', function callback2() {
            })

            bus.listen('testEvent3', async function callback3() {
                await this.trigger('testEvent4').promise
                await delay(100)
                await this.trigger('testEvent2').promise
            })

            bus.listen('testEvent4', async function callback4() {
                await delay(100)
                await this.trigger('testEvent2').promise
            })

            bus.listen('testEvent4', async function callback4_1() {
                await this.trigger('testEvent2').promise
            })

            const triggerCall = bus.trigger('testEvent')
            await triggerCall.promise
            return triggerCall.call.toString()
        },
        output: `
event: testEvent
  |-callback: callback1
      |-event: testEvent2
          |-callback: callback2
      |-event: testEvent3
          |-callback: callback3
              |-event: testEvent4
                  |-callback: callback4
                      |-event: testEvent2
                          |-callback: callback2
                  |-callback: callback4_1
                      |-event: testEvent2
                          |-callback: callback2
              |-event: testEvent2
                  |-callback: callback2
      |-event: testEvent4
          |-callback: callback4
              |-event: testEvent2
                  |-callback: callback2
          |-callback: callback4_1
              |-event: testEvent2
                  |-callback: callback2
  |-callback: callback1_1
        `.trim()
    }
]

