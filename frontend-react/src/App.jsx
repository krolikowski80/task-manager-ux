import { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const API_URL = 'https://app.krolikowski.cloud/tasks';

  // Pobieranie zadań z API
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setTasks)
      .catch(console.error);
  }, []);

  // Dodaj zadanie
  const handleAddTask = async () => {
    if (!title || !description) return alert('Uzupełnij wszystkie pola');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });

    if (response.ok) {
      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      setTitle('');
      setDescription('');
    }
  };

  // Usuń zadanie
  const handleDelete = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Zmień status
  const handleToggleComplete = async (task) => {
    const updated = { ...task, completed: task.completed ? 0 : 1 };
    const response = await fetch(`${API_URL}/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (response.ok) {
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? updated : t))
      );
    }
  };

  return (
    <div className="container">
      <h1>Lista Zadań</h1>

      <div className="form">
        <input
          type="text"
          placeholder="Tytuł"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Opis"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button onClick={handleAddTask}>➕ Dodaj zadanie</button>
      </div>

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={task.completed ? 'done' : ''}>
            <div>
              <strong>{task.title}</strong> — {task.description}
            </div>
            <div>
              <button onClick={() => handleToggleComplete(task)}>
                {task.completed ? '✅' : '⬜'}
              </button>
              <button onClick={() => handleDelete(task.id)}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;