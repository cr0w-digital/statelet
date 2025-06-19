import { useSyncExternalStore, useCallback, useMemo } from 'react';
import type { State } from './index.js';

/**
 * React hook for using state containers in components
 * 
 * @example
 * const userState = compose(
 *   state({ name: '', email: '' }),
 *   withStorage('user')
 * );
 * 
 * function UserForm() {
 *   const [user, setUser] = useStatelet(userState);
 *   
 *   return (
 *     <input 
 *       value={user.name}
 *       onChange={e => setUser(prev => ({ ...prev, name: e.target.value }))}
 *     />
 *   );
 * }
 * 
 * @example
 * // With selector for performance optimization
 * function UserName() {
 *   const [userName, setUser] = useStatelet(userState, state => state.name);
 *   return <h1>{userName}</h1>;
 * }
 */

// Overload: with selector, returns [selectedValue, setter] tuple
export function useStatelet<T, R>(
  state: State<T>, 
  selector: (value: T) => R
): [R, (value: T | ((prev: T) => T)) => void];

// Overload: without selector, returns [value, setter] tuple
export function useStatelet<T>(
  state: State<T>
): [T, (value: T | ((prev: T) => T)) => void];

// Implementation
export function useStatelet<T, R>(
  state: State<T>, 
  selector?: (value: T) => R
): [R, (value: T | ((prev: T) => T)) => void] | [T, (value: T | ((prev: T) => T)) => void] {
  
  const getSnapshot = useCallback(() => state.get(), [state]);
  
  const subscribe = useCallback(
    (onChange: () => void) => {
      return state.subscribe(() => onChange());
    },
    [state]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot);
  
  // If selector is provided, use useMemo to avoid unnecessary re-renders
  if (selector) {
    const selectedValue = useMemo(() => selector(value), [value, selector]);
    return [selectedValue, state.set] as const;
  }

  // Otherwise return the tuple
  return [value, state.set] as const;
}
