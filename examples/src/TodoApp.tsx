// Example: React Todo App with URL sync and localStorage
import React from 'react'
import { state, compose } from '../../src/index.js'
import { withUrlParams, withHashParams, withStorage, withValidation } from '../../src/enhancers.js'
import { useStatelet } from '../../src/react.js'
import { flatCodec, jsonCodec } from '@kvkit/codecs'
import * as v from 'valibot'

// Define our state shape
interface TodoState {
  todos: Array<{ id: number; text: string; done: boolean }>
  newTodo: string
}

interface FilterState {
  filter: 'all' | 'active' | 'completed'
}

// Create separate states: one for filter (URL synced) and one for todos (localStorage)
const filterState = compose(
  state<FilterState>({ filter: 'all' }),
  withUrlParams(flatCodec<FilterState>())
)

const todoState = compose(
  state<TodoState>({
    todos: [],
    newTodo: ''
  }),
  withStorage('todos', jsonCodec<TodoState>())
)

// User Profile Form with Valibot validation
interface UserProfile {
  name: string
  email: string
  age: number
  website: string
}

// Define Valibot schema
const userSchema = v.object({
  name: v.pipe(v.string(), v.minLength(2, 'Name must be at least 2 characters')),
  email: v.pipe(v.string(), v.email('Please enter a valid email')),
  age: v.pipe(v.number(), v.minValue(13, 'Must be at least 13 years old'), v.maxValue(120, 'Must be under 120')),
  website: v.pipe(v.string(), v.url('Please enter a valid URL'))
})

// Draft state for form input (no validation)
const userFormState = state<UserProfile>({
  name: '',
  email: '',
  age: 18,
  website: ''
})

// Validated state with withValidation enhancer + localStorage
const userProfileState = compose(
  state<UserProfile>({
    name: '',
    email: '',
    age: 18,
    website: ''
  }),
  // Standard Schema support - pass schemas directly! 🎉
  withValidation(userSchema),
  withStorage('user-profile', jsonCodec<UserProfile>())
)

// Search Filter Form with Hash Params
interface SearchFilter {
  category: string
  minPrice: number
  maxPrice: number
  inStock: boolean
  sortBy: string
}

const searchFilterState = compose(
  state<SearchFilter>({
    category: '',
    minPrice: 0,
    maxPrice: 1000,
    inStock: false,
    sortBy: 'name'
  }),
  withHashParams(flatCodec<SearchFilter>())
)

// Search Filter Component
function SearchFilter() {
  const [filter, setFilter] = useStatelet(searchFilterState)

  const handleReset = () => {
    setFilter({
      category: '',
      minPrice: 0,
      maxPrice: 1000,
      inStock: false,
      sortBy: 'name'
    })
  }

  return (
    <div style={{ 
      border: '2px solid #007bff', 
      borderRadius: '8px', 
      padding: '20px', 
      marginTop: '40px',
      backgroundColor: '#f8f9ff'
    }}>
      <h2 style={{ marginTop: 0, color: '#0056b3' }}>Product Search Filter (Hash Params Demo)</h2>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        This form demonstrates <code>withHashParams()</code> enhancer. All form data is synced to URL hash on submit. 
        Try submitting, then refresh the page!
      </p>
      
      <form>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Category:
            </label>
            <select
              value={filter.category}
              onChange={e => setFilter(prev => ({ ...prev, category: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ced4da'
              }}
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
              <option value="home">Home & Garden</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Min Price: ${filter.minPrice}
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={filter.minPrice}
              onChange={e => setFilter(prev => ({ ...prev, minPrice: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Max Price: ${filter.maxPrice}
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={filter.maxPrice}
              onChange={e => setFilter(prev => ({ ...prev, maxPrice: parseInt(e.target.value) }))}
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Sort By:
            </label>
            <select
              value={filter.sortBy}
              onChange={e => setFilter(prev => ({ ...prev, sortBy: e.target.value }))}
              style={{ 
                width: '100%', 
                padding: '8px', 
                borderRadius: '4px', 
                border: '1px solid #ced4da'
              }}
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filter.inStock}
              onChange={e => setFilter(prev => ({ ...prev, inStock: e.target.checked }))}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontWeight: 'bold' }}>Only show items in stock</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>          
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reset Filter
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Current Filter (Synced to Hash):</h4>
        <pre style={{ margin: 0, fontSize: '12px', color: '#495057' }}>
          {JSON.stringify(filter, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
        <strong>Try this:</strong>
        <ol style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Change some filter values</li>
          <li>Refresh the page - your filters are preserved!</li>
        </ol>
      </div>
    </div>
  )
}

// Validation Widget Component
function ValidationWidget() {
  const [formData, setFormData] = useStatelet(userFormState)
  const [savedProfile, setSavedProfile] = useStatelet(userProfileState)

  // Load saved profile into form on mount
  React.useEffect(() => {
    const saved = savedProfile
    if (saved.name || saved.email || saved.website) {
      setFormData(saved)
    }
  }, [])

  const handleSubmit = () => {
    try {
      // This uses the withValidation enhancer with Standard Schema!
      // Just pass the schema directly - clean and simple!
      setSavedProfile(formData)
      alert('Profile validated and saved! ✅\n\nStandard Schema makes this so clean - just withValidation(schema)!')
    } catch (error) {
      const issues = (error as any).issues || []
      const messages = issues.map((issue: any) => `${issue.path?.[0]?.key || 'field'}: ${issue.message}`).join('\n')
      alert(`Standard Schema validation blocked invalid data:\n${messages}`)
    }
  }

  const handleValidateNow = () => {
    try {
      // Manual validation check to show current status
      v.parse(userSchema, formData)
      alert('All fields are valid! ✅ Ready to save with withValidation enhancer.')
    } catch (error) {
      const issues = (error as any).issues || []
      const messages = issues.map((issue: any) => `${issue.path?.[0]?.key || 'field'}: ${issue.message}`).join('\n')
      alert(`Validation errors (will be caught by withValidation):\n${messages}`)
    }
  }

  return (
    <div style={{ 
      border: '2px solid #e9ecef', 
      borderRadius: '8px', 
      padding: '20px', 
      marginTop: '40px',
      backgroundColor: '#f8f9fa'
    }}>
      <h2 style={{ marginTop: 0, color: '#495057' }}>withValidation() + Standard Schema</h2>
      <p style={{ color: '#6c757d', marginBottom: '20px' }}>
        This demonstrates the <code>withValidation()</code> enhancer with <strong>Standard Schema</strong> support! 
        You can now pass Valibot, Zod, ArkType schemas directly - no wrapper needed.
        Type freely in the form, then try saving invalid data to see validation in action.
      </p>
      
      <div style={{ display: 'grid', gap: '15px', maxWidth: '400px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Name (min 2 chars):
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da'
            }}
            placeholder="Enter your name"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email:
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da'
            }}
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Age (13-120):
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={e => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da'
            }}
            placeholder="Enter your age"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Website URL:
          </label>
          <input
            type="url"
            value={formData.website}
            onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '8px', 
              borderRadius: '4px', 
              border: '1px solid #ced4da'
            }}
            placeholder="https://example.com"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleValidateNow}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: 1
            }}
          >
            Check Validation
          </button>
          
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: 1
            }}
          >
            Save (Standard Schema)
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Current Form Data:</h4>
        <pre style={{ margin: 0, fontSize: '12px', color: '#495057' }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Saved Profile (localStorage):</h4>
        <pre style={{ margin: 0, fontSize: '12px', color: '#495057' }}>
          {JSON.stringify(savedProfile, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#6c757d' }}>
        <strong>Try this to see Standard Schema + withValidation() in action:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Enter invalid data (name with 1 char, bad email, age below 13, invalid URL)</li>
          <li>Click "Save (Standard Schema)" - the enhancer will block the save automatically</li>
          <li>Fix the data and try again - clean validation with no wrapper code needed!</li>
          <li>Notice how clean the code is: <code>withValidation(userSchema)</code> ✨</li>
        </ul>
      </div>
    </div>
  )
}

export function TodoApp() {
  const [todos, setTodos] = useStatelet(todoState)
  const [filterData, setFilter] = useStatelet(filterState)

  const addTodo = () => {
    if (todos.newTodo.trim()) {
      setTodos(prev => ({
        ...prev,
        todos: [
          ...prev.todos,
          { id: Date.now(), text: prev.newTodo, done: false }
        ],
        newTodo: ''
      }))
    }
  }

  const toggleTodo = (id: number) => {
    setTodos(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    }))
  }

  const filteredTodos = todos.todos.filter(todo => {
    if (filterData.filter === 'active') return !todo.done
    if (filterData.filter === 'completed') return todo.done
    return true
  })

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Statelet-Next Todo App</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={todos.newTodo}
          onChange={e => setTodos(prev => ({ ...prev, newTodo: e.target.value }))}
          onKeyPress={e => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
          style={{ padding: '8px', marginRight: '8px', minWidth: '300px' }}
        />
        <button onClick={addTodo} style={{ padding: '8px 16px' }}>
          Add Todo
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setFilter({ filter: 'all' })}
          style={{ 
            padding: '6px 12px', 
            marginRight: '8px',
            backgroundColor: filterData.filter === 'all' ? '#007bff' : '#f8f9fa',
            color: filterData.filter === 'all' ? 'white' : 'black'
          }}
        >
          All
        </button>
        <button
          onClick={() => setFilter({ filter: 'active' })}
          style={{ 
            padding: '6px 12px', 
            marginRight: '8px',
            backgroundColor: filterData.filter === 'active' ? '#007bff' : '#f8f9fa',
            color: filterData.filter === 'active' ? 'white' : 'black'
          }}
        >
          Active
        </button>
        <button
          onClick={() => setFilter({ filter: 'completed' })}
          style={{ 
            padding: '6px 12px',
            backgroundColor: filterData.filter === 'completed' ? '#007bff' : '#f8f9fa',
            color: filterData.filter === 'completed' ? 'white' : 'black'
          }}
        >
          Completed
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredTodos.map(todo => (
          <li
            key={todo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              marginBottom: '4px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px'
            }}
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
              style={{ marginRight: '12px' }}
            />
            <span
              style={{
                textDecoration: todo.done ? 'line-through' : 'none',
                color: todo.done ? '#6c757d' : 'black'
              }}
            >
              {todo.text}
            </span>
          </li>
        ))}
      </ul>

      {filteredTodos.length === 0 && (
        <p style={{ textAlign: 'center', color: '#6c757d', marginTop: '40px' }}>
          {filterData.filter === 'all' ? 'No todos yet!' : `No ${filterData.filter} todos`}
        </p>
      )}

      <SearchFilter />
      <ValidationWidget />
    </div>
  )
}
