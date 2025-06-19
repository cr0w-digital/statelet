/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { state, compose } from './index'
import { withStorage, withEffect, withDebounce, withValidation } from './enhancers'
import { jsonCodec } from '@kvkit/codecs'

// Mock localStorage for tests
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('state core', () => {
  it('should create a basic state container', () => {
    const myState = state('hello')
    
    expect(myState.get()).toBe('hello')
    
    myState.set('world')
    expect(myState.get()).toBe('world')
  })

  it('should handle subscriptions correctly', () => {
    const myState = state(0)
    const callback = vi.fn()
    
    const unsubscribe = myState.subscribe(callback)
    
    // Should call immediately with current value
    expect(callback).toHaveBeenCalledWith(0)
    
    myState.set(1)
    expect(callback).toHaveBeenCalledWith(1)
    
    myState.set(2)
    expect(callback).toHaveBeenCalledWith(2)
    
    unsubscribe()
    myState.set(3)
    expect(callback).toHaveBeenCalledTimes(3) // Initial + 2 updates
  })

  it('should handle update functions', () => {
    const myState = state(10)
    
    myState.set(prev => prev + 5)
    expect(myState.get()).toBe(15)
  })

  it('should work with complex objects', () => {
    const myState = state({ count: 0, name: 'test' })
    
    myState.set(prev => ({ ...prev, count: prev.count + 1 }))
    expect(myState.get()).toEqual({ count: 1, name: 'test' })
  })

  it('should not trigger listeners for same values', () => {
    const myState = state('hello')
    const callback = vi.fn()
    
    myState.subscribe(callback)
    callback.mockClear() // Clear initial call
    
    myState.set('hello') // Same value
    expect(callback).not.toHaveBeenCalled()
    
    myState.set('world') // Different value
    expect(callback).toHaveBeenCalledWith('world')
  })
})

describe('compose functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should compose enhancers correctly', () => {
    const effectSpy = vi.fn()
    
    const myState = compose(
      state({ count: 0 }),
      withEffect(effectSpy)
    )
    
    myState.set({ count: 5 })
    expect(effectSpy).toHaveBeenCalledWith({ count: 5 }, { count: 0 })
  })
})

describe('enhancers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should work with storage enhancer', () => {
    const storageKey = 'test-storage'
    const myState = compose(
      state({ count: 0 }),
      withStorage(storageKey, jsonCodec())
    )
    
    myState.set({ count: 42 })
    
    // Should save to localStorage  
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      storageKey, 
      JSON.stringify({ data: JSON.stringify({ count: 42 }) })
    )
  })

  it('should work with effect enhancer', () => {
    const effectFn = vi.fn()
    const myState = compose(
      state(0),
      withEffect(effectFn)
    )
    
    myState.set(1)
    expect(effectFn).toHaveBeenCalledWith(1, 0)
    
    myState.set(2)
    expect(effectFn).toHaveBeenCalledWith(2, 1)
  })

  it('should work with debounce enhancer', async () => {
    const myState = compose(
      state(''),
      withDebounce(50)
    )
    const callback = vi.fn()
    
    const unsubscribe = myState.subscribe(callback)
    callback.mockClear() // Clear initial call
    
    // Rapid changes should be debounced
    myState.set('a')
    myState.set('b')
    myState.set('c')
    
    expect(callback).not.toHaveBeenCalled()
    
    // Wait for debounce
    await new Promise(resolve => setTimeout(resolve, 100))
    
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('c')
    
    unsubscribe()
  })

  it('should compose multiple enhancers', () => {
    const effectFn = vi.fn()
    
    const myState = compose(
      state({ count: 0 }),
      withStorage('multi-test', jsonCodec()),
      withEffect(effectFn)
    )
    
    myState.set({ count: 5 })
    
    expect(myState.get()).toEqual({ count: 5 })
    expect(localStorageMock.setItem).toHaveBeenCalled()
    expect(effectFn).toHaveBeenCalledWith({ count: 5 }, { count: 0 })
  })

  it('should work with standard schema validation', () => {
    // Mock a standard schema
    const mockSchema = {
      '~standard': {
        version: 1,
        vendor: 'test',
        validate: (value: any) => {
          if (typeof value.name === 'string' && value.name.length >= 2) {
            return { value }
          }
          return { 
            issues: [{ 
              message: 'Name must be at least 2 characters',
              path: [{ key: 'name' }]
            }] 
          }
        }
      }
    }

    const testState = compose(
      state({ name: '', age: 25 }),
      withValidation(mockSchema)
    )

    // Valid data should work
    testState.set({ name: 'Alice', age: 30 })
    expect(testState.get()).toEqual({ name: 'Alice', age: 30 })

    // Invalid data should throw
    expect(() => {
      testState.set({ name: 'A', age: 25 })
    }).toThrow()
  })
})
