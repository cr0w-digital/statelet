import { flatCodec, jsonCodec, type Codec } from '@kvkit/codecs';
import type { State, Enhancer } from './index.js';

/**
 * Sync state with URL search parameters (?key=value)
 * 
 * @example
 * const searchState = compose(
 *   state({ query: '', page: 1 }),
 *   withUrlParams()
 * );
 */
export function withUrlParams<T extends Record<string, any>>(
  codec: Codec<T> = flatCodec<T>()
): Enhancer<T> {
  return (base) => {
    if (typeof window === 'undefined') return base; // SSR safe
    
    // Initial sync from URL
    const params = new URLSearchParams(window.location.search);
    const data: Record<string, string> = {};
    params.forEach((value, key) => data[key] = value);
    const decoded = codec.decode(data);
    base.set({ ...base.get(), ...decoded });

    // Listen to state changes and update URL
    base.subscribe((value) => {
      const encoded = codec.encode(value);
      const newParams = new URLSearchParams();
      Object.entries(encoded).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          newParams.set(key, String(val));
        }
      });
      
      const url = new URL(window.location.href);
      url.search = newParams.toString();
      window.history.replaceState(null, '', url.toString());
    });

    // Listen to URL changes (back/forward)
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const data: Record<string, string> = {};
      params.forEach((value, key) => data[key] = value);
      const decoded = codec.decode(data);
      base.set({ ...base.get(), ...decoded });
    };

    window.addEventListener('popstate', handlePopState);
    
    return {
      ...base,
      subscribe(callback) {
        const unsub = base.subscribe(callback);
        return () => {
          unsub();
          window.removeEventListener('popstate', handlePopState);
        };
      }
    };
  };
}

/**
 * Sync state with URL hash parameters (#key=value)
 * 
 * @example
 * const tabState = compose(
 *   state({ tab: 'home', modal: false }),
 *   withHashParams()
 * );
 */
export function withHashParams<T extends Record<string, any>>(
  codec: Codec<T> = flatCodec<T>()
): Enhancer<T> {
  return (base) => {
    if (typeof window === 'undefined') return base; // SSR safe
    
    // Initial sync from hash
    const params = new URLSearchParams(window.location.hash.slice(1));
    const data: Record<string, string> = {};
    params.forEach((value, key) => data[key] = value);
    const decoded = codec.decode(data);
    base.set({ ...base.get(), ...decoded });

    // Listen to state changes and update hash
    base.subscribe((value) => {
      const encoded = codec.encode(value);
      const newParams = new URLSearchParams();
      Object.entries(encoded).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          newParams.set(key, String(val));
        }
      });
      
      window.location.hash = newParams.toString();
    });

    // Listen to hash changes
    const handleHashChange = () => {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const data: Record<string, string> = {};
      params.forEach((value, key) => data[key] = value);
      const decoded = codec.decode(data);
      base.set({ ...base.get(), ...decoded });
    };

    window.addEventListener('hashchange', handleHashChange);
    
    return {
      ...base,
      subscribe(callback) {
        const unsub = base.subscribe(callback);
        return () => {
          unsub();
          window.removeEventListener('hashchange', handleHashChange);
        };
      }
    };
  };
}

/**
 * Persist state to localStorage
 * 
 * @example
 * const userPrefs = compose(
 *   state({ theme: 'light', fontSize: 14 }),
 *   withStorage('user-preferences')
 * );
 */
export function withStorage<T>(
  key: string,
  codec: Codec<T> = jsonCodec<T>()
): Enhancer<T> {
  return (base) => {
    if (typeof window === 'undefined') return base; // SSR safe
    
    // Hydrate from storage
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, string>;
        const decoded = codec.decode(parsed);
        base.set({ ...base.get(), ...decoded });
      }
    } catch {
      // Ignore errors
    }

    // Persist changes
    base.subscribe((value) => {
      try {
        const encoded = codec.encode(value);
        localStorage.setItem(key, JSON.stringify(encoded));
      } catch {
        // Ignore errors (quota exceeded, etc.)
      }
    });

    return base;
  };
}

/**
 * Run side effects when state changes
 * 
 * @example
 * const analytics = compose(
 *   state({ page: 'home' }),
 *   withEffect((newValue, prevValue) => {
 *     gtag('event', 'page_view', { page: newValue.page });
 *   })
 * );
 */
export function withEffect<T>(
  effect: (value: T, prev: T) => void,
  options: { immediate?: boolean } = {}
): Enhancer<T> {
  return (base) => {
    let previous = base.get();
    
    if (options.immediate) {
      effect(previous, previous);
    }
    
    base.subscribe((current) => {
      effect(current, previous);
      previous = current;
    });
    
    return base;
  };
}

/**
 * Validate state changes with Standard Schema
 * 
 * Supports Valibot, Zod, ArkType, and any other Standard Schema-compliant library
 * 
 * @example
 * // With Valibot
 * const userForm = compose(
 *   state({ name: '', email: '', age: 0 }),
 *   withValidation(v.object({
 *     name: v.string(),
 *     email: v.pipe(v.string(), v.email()),
 *     age: v.number()
 *   }))
 * );
 * 
 * @example
 * // With Zod
 * const userForm = compose(
 *   state({ name: '', email: '', age: 0 }),
 *   withValidation(z.object({
 *     name: z.string(),
 *     email: z.string().email(),
 *     age: z.number()
 *   }))
 * );
 */
export function withValidation<T>(
  schema: { '~standard': any }
): Enhancer<T> {
  return (base) => {
    return {
      ...base,
      set(valueOrUpdater: T | ((prev: T) => T)) {
        const next = typeof valueOrUpdater === 'function' 
          ? (valueOrUpdater as (prev: T) => T)(base.get())
          : valueOrUpdater;
        
        const result = schema['~standard'].validate(next);
        
        if ('issues' in result) {
          // Create a validation error similar to what Valibot/Zod would throw
          const error = new Error('Validation failed');
          (error as any).issues = result.issues;
          throw error;
        }
        
        base.set(result.value);
      }
    };
  };
}

/**
 * Debounce state updates
 * 
 * @example
 * const searchState = compose(
 *   state({ query: '' }),
 *   withDebounce(300), // Wait 300ms before updating
 *   withUrlParams()
 * );
 */
export function withDebounce<T>(ms: number): Enhancer<T> {
  return (base) => {
    let timeout: ReturnType<typeof setTimeout>;
    
    return {
      ...base,
      set(valueOrUpdater: T | ((prev: T) => T)) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          base.set(valueOrUpdater);
        }, ms);
      }
    };
  };
}

// Re-export kvkit codecs for convenience
export { flatCodec, jsonCodec, type Codec } from '@kvkit/codecs';
