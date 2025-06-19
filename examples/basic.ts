// Example: Counter with localStorage persistence
import { state, compose } from '../src/index.js'
import { withStorage, withEffect } from '../src/enhancers.js'
import { numberCodec } from '@kvkit/codecs'

// Create a counter that persists to localStorage and logs changes
const counter = compose(
  state(0),
  withStorage('counter', numberCodec()),
  withEffect((newValue, prevValue) => {
    console.log(`Counter changed from ${prevValue} to ${newValue}`)
  })
)

// Use the counter
console.log('Initial count:', counter.get()) // 0 (or persisted value)

counter.set(5)
console.log('After setting to 5:', counter.get()) // 5

counter.set(prev => prev + 1)
console.log('After incrementing:', counter.get()) // 6

// Subscribe to changes
const unsubscribe = counter.subscribe((value) => {
  console.log('Counter updated:', value)
})

// Clean up
setTimeout(() => {
  unsubscribe()
}, 1000)
