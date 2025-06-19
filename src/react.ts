import { useSyncExternalStore, useCallback } from 'react';
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
 */
export function useStatelet<T>(state: State<T>) {
  const getSnapshot = useCallback(() => state.get(), [state]);
  
  const subscribe = useCallback(
    (onChange: () => void) => {
      return state.subscribe(() => onChange());
    },
    [state]
  );

  const value = useSyncExternalStore(subscribe, getSnapshot);

  return [value, state.set] as const;
}
