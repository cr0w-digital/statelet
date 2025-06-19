/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStatelet } from './react.js'
import { state, compose } from './index.js'
import { withEffect } from './enhancers.js'

describe('React Integration', () => {
  it('should work with basic state', () => {
    const myState = state('hello')
    
    const { result } = renderHook(() => useStatelet(myState))
    
    expect(result.current[0]).toBe('hello')
    expect(typeof result.current[1]).toBe('function')
  })

  it('should update when state changes', () => {
    const myState = state(0)
    
    const { result } = renderHook(() => useStatelet(myState))
    
    expect(result.current[0]).toBe(0)
    
    act(() => {
      result.current[1](42)
    })
    
    expect(result.current[0]).toBe(42)
  })

  it('should work with enhanced statelets', () => {
    const effectFn = vi.fn()
    const myState = compose(
      state({ count: 0 }),
      withEffect(effectFn)
    )
    
    const { result } = renderHook(() => useStatelet(myState))
    
    expect(result.current[0]).toEqual({ count: 0 })
    
    act(() => {
      result.current[1]({ count: 5 })
    })
    
    expect(result.current[0]).toEqual({ count: 5 })
    expect(effectFn).toHaveBeenCalledWith({ count: 5 }, { count: 0 })
  })

  it('should unsubscribe on unmount', () => {
    const myState = state('test')
    const unsubscribeSpy = vi.spyOn(myState, 'subscribe').mockImplementation((callback) => {
      callback('test')
      return vi.fn() // Mock unsubscribe function
    })
    
    const { unmount } = renderHook(() => useStatelet(myState))
    
    expect(unsubscribeSpy).toHaveBeenCalled()
    
    unmount()
    
    // The returned unsubscribe function should have been called
    expect(unsubscribeSpy.mock.results[0].value).toHaveBeenCalled()
  })

  it('should handle multiple components using same state', () => {
    const myState = state('shared')
    
    const { result: result1 } = renderHook(() => useStatelet(myState))
    const { result: result2 } = renderHook(() => useStatelet(myState))
    
    expect(result1.current[0]).toBe('shared')
    expect(result2.current[0]).toBe('shared')
    
    act(() => {
      result1.current[1]('updated')
    })
    
    expect(result1.current[0]).toBe('updated')
    expect(result2.current[0]).toBe('updated')
  })

  describe('Selector Support', () => {
    it('should work with basic selector function', () => {
      const myState = state({ count: 10, name: 'test' })
      
      const { result } = renderHook(() => 
        useStatelet(myState, state => state.count)
      )
      
      expect(result.current[0]).toBe(10)
      expect(typeof result.current[1]).toBe('function')
    })

    it('should only re-render when selected value changes', () => {
      const myState = state({ count: 10, name: 'test' })
      let renderCount = 0
      
      const { result } = renderHook(() => {
        renderCount++
        return useStatelet(myState, state => state.count)
      })
      
      expect(renderCount).toBe(1)
      expect(result.current[0]).toBe(10)
      
      // Change the name (not selected by selector) - will still re-render due to useMemo dependency
      act(() => {
        myState.set({ count: 10, name: 'changed' })
      })
      
      expect(renderCount).toBe(2) // Re-rendered but selected value is the same
      expect(result.current[0]).toBe(10)
      
      // Change the count (selected by selector) - should re-render with new value
      act(() => {
        myState.set({ count: 20, name: 'changed' })
      })
      
      expect(renderCount).toBe(3) // Re-rendered with new value
      expect(result.current[0]).toBe(20)
    })

    it('should work with complex selector returning object', () => {
      const myState = state({ 
        user: { name: 'Alice', age: 25 },
        theme: 'dark',
        settings: { notifications: true }
      })
      
      const { result } = renderHook(() => 
        useStatelet(myState, state => ({
          userName: state.user.name,
          hasNotifications: state.settings.notifications
        }))
      )
      
      expect(result.current[0]).toEqual({
        userName: 'Alice',
        hasNotifications: true
      })
    })

    it('should memoize selector results to prevent unnecessary re-renders', () => {
      const myState = state({ items: [1, 2, 3], filter: 'all' })
      let selectorCallCount = 0
      
      const selector = (state: typeof myState extends { get(): infer T } ? T : never) => {
        selectorCallCount++
        return state.items.filter(item => item > 1)
      }
      
      const { result, rerender } = renderHook(() => 
        useStatelet(myState, selector)
      )
      
      expect(selectorCallCount).toBe(1)
      expect(result.current[0]).toEqual([2, 3])
      
      // Re-render component without state change - selector should not be called again
      rerender()
      expect(selectorCallCount).toBe(1)
      
      // Change unrelated field - selector result should be memoized
      act(() => {
        myState.set({ items: [1, 2, 3], filter: 'active' })
      })
      
      expect(selectorCallCount).toBe(2) // Called once more
      expect(result.current[0]).toEqual([2, 3]) // Same result, should be memoized
    })

    it('should work with setState when using selector', () => {
      const myState = state({ count: 0, name: 'test' })
      
      const { result } = renderHook(() => 
        useStatelet(myState, state => state.count)
      )
      
      expect(result.current[0]).toBe(0)
      
      // Update state using functional update
      act(() => {
        result.current[1](prev => ({ ...prev, count: prev.count + 5 }))
      })
      
      expect(result.current[0]).toBe(5)
      expect(myState.get()).toEqual({ count: 5, name: 'test' })
      
      // Update state using direct value
      act(() => {
        result.current[1]({ count: 10, name: 'updated' })
      })
      
      expect(result.current[0]).toBe(10)
      expect(myState.get()).toEqual({ count: 10, name: 'updated' })
    })

    it('should handle selector that returns the same reference', () => {
      const items = [1, 2, 3]
      const myState = state({ items, count: 0 })
      let renderCount = 0
      
      const { result } = renderHook(() => {
        renderCount++
        return useStatelet(myState, state => state.items)
      })
      
      expect(renderCount).toBe(1)
      expect(result.current[0]).toBe(items)
      
      // Update with same reference - will still re-render due to state change
      act(() => {
        myState.set({ items, count: 1 })
      })
      
      expect(renderCount).toBe(2) // Re-rendered but items are same reference
      expect(result.current[0]).toBe(items)
      
      // Update with new reference - should re-render
      act(() => {
        myState.set({ items: [1, 2, 3, 4], count: 1 })
      })
      
      expect(renderCount).toBe(3) // Re-rendered
      expect(result.current[0]).toEqual([1, 2, 3, 4])
    })

    it('should handle primitive selector results correctly', () => {
      const myState = state({ count: 42, enabled: true, name: 'test' })
      
      // Test with number
      const { result: numberResult } = renderHook(() => 
        useStatelet(myState, state => state.count)
      )
      expect(numberResult.current[0]).toBe(42)
      
      // Test with boolean
      const { result: booleanResult } = renderHook(() => 
        useStatelet(myState, state => state.enabled)
      )
      expect(booleanResult.current[0]).toBe(true)
      
      // Test with string
      const { result: stringResult } = renderHook(() => 
        useStatelet(myState, state => state.name)
      )
      expect(stringResult.current[0]).toBe('test')
    })

    it('should work with enhanced statelet and selector', () => {
      const effectFn = vi.fn()
      const myState = compose(
        state({ count: 0, name: 'test' }),
        withEffect(effectFn)
      )
      
      const { result } = renderHook(() => 
        useStatelet(myState, state => state.count)
      )
      
      expect(result.current[0]).toBe(0)
      
      act(() => {
        result.current[1]({ count: 5, name: 'updated' })
      })
      
      expect(result.current[0]).toBe(5)
      expect(effectFn).toHaveBeenCalledWith(
        { count: 5, name: 'updated' }, 
        { count: 0, name: 'test' }
      )
    })
  })
})
