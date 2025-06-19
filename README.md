# ⧈ statelet

> Dead simple state management - type safe, reactive, composable

## Why statelet?

| Feature                | Description                                       |
|------------------------|---------------------------------------------------|
| **Dead Simple**.       | Just `{ get(), set(), subscribe() }` - that's it! |
| **Composable**         | Mix and match enhancers like Lego blocks          |  
| **URL Sync Built-in**  | Share state via URL params/hash out of the box.   |
| **Type Inferred**      | Full TypeScript support                           |
| **Framework Agnostic** | Works anywhere - React, Vue, vanilla JS           |
| **SSR Safe**.          | Works on server and client seamlessly             |
| **React Optional**     | React integration available but not required      |

## Quick Start

```bash
npm install statelet

# For React integration (optional)
npm install statelet react @kvkit/react
```

### Basic Example

```typescript
import { state, compose, withUrlParams, withStorage, withEffect } from 'statelet';

// Create a simple state
const counter = state({ count: 0 });

// Use it
console.log(counter.get()); // { count: 0 }
counter.set({ count: 1 });
counter.set(prev => ({ count: prev.count + 1 })); // Functional updates

// Subscribe to changes
const unsubscribe = counter.subscribe(value => {
  console.log('Count changed:', value.count);
});
```

### Enhanced Example

```typescript
import { state, compose, withUrlParams, withStorage, withEffect } from 'statelet';

// Compose multiple behaviors
const searchState = compose(
  state({ query: '', filters: [], page: 1 }),
  withUrlParams(), // Sync with URL search params
  withStorage('search'), // Persist to localStorage
  withEffect(state => {
    console.log('Search updated:', state);
  })
);

// Now your search state is:
// ✅ Synced with URL (?query=laptop&page=2)
// ✅ Persisted to localStorage
// ✅ Logs changes automatically
// ✅ Shareable via URL
```

## React Integration (Optional)

Statelet works great without React, but if you're using React, install the optional React integration:

```bash
npm install react @kvkit/react
```

```typescript
import { useStatelet } from 'statelet/react';

function SearchForm() {
  const [search, setSearch] = useStatelet(searchState);
  
  return (
    <div>
      <input 
        value={search.query}
        onChange={e => setSearch(prev => ({ 
          ...prev, 
          query: e.target.value,
          page: 1 // Reset to first page
        }))}
      />
      <p>Page: {search.page}</p>
    </div>
  );
}
```

### Performance with Selectors

For better performance when you only need part of the state, use selectors to prevent unnecessary re-renders:

```typescript
// Only re-render when query changes, not page/filters
function SearchInput() {
  const [query, setSearch] = useStatelet(searchState, state => state.query);
  
  return (
    <input 
      value={query}
      onChange={e => setSearch(prev => ({ 
        ...prev, 
        query: e.target.value,
        page: 1 
      }))}
    />
  );
}

// Only re-render when page changes
function Pagination() {
  const [page, setSearch] = useStatelet(searchState, state => state.page);
  
  return (
    <div>
      <button onClick={() => setSearch(prev => ({ ...prev, page: prev.page - 1 }))}>
        Previous
      </button>
      <span>Page {page}</span>
      <button onClick={() => setSearch(prev => ({ ...prev, page: prev.page + 1 }))}>
        Next
      </button>
    </div>
  );
}

// Complex selectors with multiple fields
function SearchSummary() {
  const [summary, setSearch] = useStatelet(searchState, state => ({
    hasQuery: state.query.length > 0,
    isFirstPage: state.page === 1,
    searchParams: `${state.query} in ${state.category}`
  }));
  
  return (
    <div>
      {summary.hasQuery && (
        <p>Searching for: {summary.searchParams}</p>
      )}
      {!summary.isFirstPage && (
        <p>Page {searchState.get().page}</p>
      )}
    </div>
  );
}
```

## 🚀 Try the Demo

Want to see statelet in action? Check out the interactive demo with a todo app, validation forms, and URL synchronization:

```bash
# Clone the repository
git clone https://github.com/cr0w-digital/statelet
cd statelet

# Install dependencies
npm install

# Start the demo
cd examples
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) to see:

- **Todo App** with localStorage persistence and URL filtering
- **Validation Demo** with Standard Schema (Valibot) integration
- **Search Filters** with hash parameter synchronization
- **Real-time updates** and hot reloading

The demo showcases all major features: state composition, URL sync, localStorage, validation, and React integration.

## Core API

### `state(initial)`

Creates a basic reactive state container.

```typescript
const user = state({ name: 'Alice', age: 25 });

user.get() // { name: 'Alice', age: 25 }
user.set({ name: 'Bob', age: 30 })
user.set(prev => ({ ...prev, age: prev.age + 1 }))

const unsub = user.subscribe(value => console.log(value))
```

### `compose(base, ...enhancers)`

Applies multiple enhancers to a state container.

```typescript
const enhanced = compose(
  state({ theme: 'light' }),
  withStorage('theme'),
  withEffect(console.log)
);
```

## Built-in Enhancers

### `withUrlParams(codec?)`

Syncs state with URL search parameters (`?key=value`).

```typescript
const filters = compose(
  state({ category: 'all', minPrice: 0 }),
  withUrlParams() // Uses flatCodec by default
);

// URL becomes: ?category=electronics&minPrice=100
```

### `withHashParams(codec?)`

Syncs state with URL hash parameters (`#key=value`).

```typescript
const tabState = compose(
  state({ tab: 'overview', section: 'main' }),
  withHashParams()
);

// URL becomes: #tab=settings&section=profile
```

### `withStorage(key, codec?)`

Persists state to localStorage.

```typescript
const userPrefs = compose(
  state({ theme: 'dark', fontSize: 16 }),
  withStorage('user-preferences')
);

// Automatically saved to localStorage["user-preferences"]
```

### `withEffect(fn, options?)`

Runs side effects when state changes.

```typescript
const analytics = compose(
  state({ page: '/home' }),
  withEffect(state => {
    gtag('event', 'page_view', { page: state.page });
  }, { immediate: true })
);
```

### `withValidation(schema)`

Validates state changes with **Standard Schema** (Valibot, Zod, ArkType, etc.).

```typescript
// With Valibot
import * as v from 'valibot';

const userForm = compose(
  state({ name: '', email: '', age: 0 }),
  withValidation(v.object({
    name: v.pipe(v.string(), v.minLength(1)),
    email: v.pipe(v.string(), v.email()),
    age: v.pipe(v.number(), v.minValue(0), v.maxValue(150))
  }))
);

// With Zod
import { z } from 'zod';

const userForm = compose(
  state({ name: '', email: '', age: 0 }),
  withValidation(z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().min(0).max(150)
  }))
);

// With ArkType
import { type } from 'arktype';

const userForm = compose(
  state({ name: '', email: '', age: 0 }),
  withValidation(type({
    name: 'string>0',
    email: 'string.email',
    age: 'number>=0<=150'
  }))
);

// Throws if validation fails
userForm.set({ name: '', email: 'invalid', age: -5 });
```

### `withDebounce(ms)`

Debounces state updates.

```typescript
const searchInput = compose(
  state({ query: '' }),
  withDebounce(300), // Wait 300ms before updating
  withUrlParams()
);

// Rapid typing won't spam URL updates
```

## Functional Style

```typescript
import { enhance } from 'statelet';

// Create reusable enhancer combinations
const createPersistedUrlState = enhance(
  withUrlParams(),
  withStorage('backup'),
  withEffect(console.log)
);

// Use it
const searchState = createPersistedUrlState(
  state({ query: '', page: 1 })
);

const userState = createPersistedUrlState(
  state({ name: '', email: '' })
);
```

## Real-World Examples

### Search/Filter Component

```typescript
import { state, compose, withUrlParams, withDebounce } from 'statelet';
import { useStatelet } from 'statelet/react';

const searchState = compose(
  state({
    query: '',
    category: 'all',
    sortBy: 'relevance',
    page: 1
  }),
  withDebounce(300),
  withUrlParams() // URL: ?query=laptop&category=electronics&page=2
);

function ProductSearch() {
  const [search, setSearch] = useStatelet(searchState);
  
  return (
    <div>
      <input 
        placeholder="Search products..."
        value={search.query}
        onChange={e => setSearch(prev => ({ 
          ...prev, 
          query: e.target.value,
          page: 1 
        }))}
      />
      
      <select 
        value={search.category}
        onChange={e => setSearch(prev => ({ 
          ...prev, 
          category: e.target.value,
          page: 1 
        }))}
      >
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="books">Books</option>
      </select>
      
      {/* Search results would go here */}
      <div>
        <p>Searching for "{search.query}" in {search.category}</p>
        <p>Page {search.page}</p>
      </div>
    </div>
  );
}
```

### User Preferences Dashboard

```typescript
import { state, compose, withStorage, withEffect } from 'statelet';

const userPrefs = compose(
  state({
    theme: 'light' as 'light' | 'dark',
    language: 'en',
    notifications: true,
    autoSave: false
  }),
  withStorage('user-preferences'),
  withEffect(prefs => {
    // Apply theme to document
    document.documentElement.className = prefs.theme;
    
    // Analytics
    gtag('event', 'preferences_updated', {
      theme: prefs.theme,
      language: prefs.language
    });
  })
);

function PreferencesForm() {
  const [prefs, setPrefs] = useStatelet(userPrefs);
  
  return (
    <form>
      <label>
        <input 
          type="radio" 
          checked={prefs.theme === 'light'}
          onChange={() => setPrefs(prev => ({ ...prev, theme: 'light' }))}
        />
        Light Theme
      </label>
      
      <label>
        <input 
          type="checkbox" 
          checked={prefs.notifications}
          onChange={e => setPrefs(prev => ({ 
            ...prev, 
            notifications: e.target.checked 
          }))}
        />
        Enable Notifications
      </label>
    </form>
  );
}
```

## Comparison

### vs Zustand

```typescript
// Zustand
const useStore = create(set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 }))
}));

// statelet
const counter = state({ count: 0 });
const [count, setCount] = useStatelet(counter);
setCount(prev => ({ count: prev.count + 1 }));
```

### vs Redux Toolkit

```typescript
// Redux Toolkit
const store = configureStore({
  reducer: {
    search: searchSlice.reducer
  }
});

// statelet
const search = compose(
  state({ query: '', results: [] }),
  withUrlParams()
);
```

## Built on kvkit

statelet leverages [kvkit](https://github.com/cr0w-digital/kvkit) for all URL parameter encoding/decoding, providing:

- ✅ **Robust serialization** - Handles complex data types
- ✅ **Multiple strategies** - flat, JSON, prefixed codecs
- ✅ **Type safety** - Full TypeScript support
- ✅ **Edge case handling** - Malformed URLs, encoding issues
- ✅ **Battle tested** - Used in production

## License

MIT
