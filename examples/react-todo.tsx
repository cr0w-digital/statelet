// Example: React Todo App with URL sync and localStorage
import React from 'react'
import { state, compose } from '../src/index.js'
import { withUrlParams, withStorage } from '../src/enhancers.js'
import { useStatelet } from '../src/react.js'
import { flatCodec, jsonCodec } from '@kvkit/codecs'

// Define our state shape
interface TodoState {
  todos: Array<{ id: number; text: string; done: boolean }>
  filter: 'all' | 'active' | 'completed'
  newTodo: string
}

// Create enhanced state with URL sync for filter and localStorage for todos
const todoState = compose(
  state<TodoState>({
    todos: [],
    filter: 'all',
    newTodo: ''
  }),
  withUrlParams(flatCodec<Pick<TodoState, 'filter'>>()),
  withStorage('todos', jsonCodec<TodoState>())
)

export function TodoApp() {
  const [todos, setTodos] = useStatelet(todoState)

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
    if (todos.filter === 'active') return !todo.done
    if (todos.filter === 'completed') return todo.done
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
          onClick={() => setTodos(prev => ({ ...prev, filter: 'all' }))}
          style={{ 
            padding: '6px 12px', 
            marginRight: '8px',
            backgroundColor: todos.filter === 'all' ? '#007bff' : '#f8f9fa',
            color: todos.filter === 'all' ? 'white' : 'black'
          }}
        >
          All
        </button>
        <button
          onClick={() => setTodos(prev => ({ ...prev, filter: 'active' }))}
          style={{ 
            padding: '6px 12px', 
            marginRight: '8px',
            backgroundColor: todos.filter === 'active' ? '#007bff' : '#f8f9fa',
            color: todos.filter === 'active' ? 'white' : 'black'
          }}
        >
          Active
        </button>
        <button
          onClick={() => setTodos(prev => ({ ...prev, filter: 'completed' }))}
          style={{ 
            padding: '6px 12px',
            backgroundColor: todos.filter === 'completed' ? '#007bff' : '#f8f9fa',
            color: todos.filter === 'completed' ? 'white' : 'black'
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
          {todos.filter === 'all' ? 'No todos yet!' : `No ${todos.filter} todos`}
        </p>
      )}
    </div>
  )
}
