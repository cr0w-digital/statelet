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
})
