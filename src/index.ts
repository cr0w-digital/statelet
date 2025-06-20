/**
 * The simplest possible state container - just get, set, subscribe
 */
export interface State<T> {
  get(): T;
  set(value: T | ((prev: T) => T)): void;
  subscribe(callback: (value: T) => void): () => void;
}

/**
 * Create a reactive state container
 */
export function state<T>(initial: T): State<T> {
  let current = initial;
  const listeners = new Set<(value: T) => void>();

  return {
    get() {
      return current;
    },

    set(valueOrUpdater: T | ((prev: T) => T)) {
      const next = typeof valueOrUpdater === 'function' 
        ? (valueOrUpdater as (prev: T) => T)(current)
        : valueOrUpdater;
      
      if (next !== current) {
        current = next;
        listeners.forEach(callback => callback(current));
      }
    },

    subscribe(callback: (value: T) => void) {
      listeners.add(callback);
      callback(current); // Call immediately with current value
      
      return () => {
        listeners.delete(callback);
      };
    }
  };
}

/**
 * Enhancer function type - takes a state and returns an enhanced state
 */
export type Enhancer<T, U = T> = (base: State<T>) => State<U>;

/**
 * Compose multiple enhancers into a single state
 * 
 * @example
 * const myState = compose(
 *   state({ count: 0 }),
 *   withLocalStorage('count'),
 *   withEffect(console.log)
 * );
 */
export function compose<T>(
  base: State<T>,
  ...enhancers: Enhancer<any>[]
): State<T> {
  return enhancers.reduce((current, enhancer) => enhancer(current), base);
}

/**
 * Curried version of compose for functional style
 * 
 * @example
 * const createCounter = enhance(
 *   withLocalStorage('count'),
 *   withEffect(console.log)
 * );
 * 
 * const counter = createCounter(state({ count: 0 }));
 */
export function enhance<T>(...enhancers: Enhancer<any>[]) {
  return (base: State<T>): State<T> => compose(base, ...enhancers);
}

// Export all enhancers from the enhancers module
export * from './enhancers';
