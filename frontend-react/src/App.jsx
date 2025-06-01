import React, { useEffect, useState } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('https://app.krolikowski.cloud/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Błąd pobierania zadań:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const response = await fetch('https://app.krolikowski.cloud/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        setTitle('');
        setDescription('');
        fetchTasks();
      }
    } catch (error) {
      console.error('Błąd dodawania zadania:', error);
    }
  };

  return (
    <div className="app-container">
      <h1>📝 Lista Zadań</h1>

      <form onSubmit={handleSubmit} className="task-form">
        <input
          type="text"
          placeholder="Tytuł zadania"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Opis zadania"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">➕ Dodaj zadanie</button>
      </form>

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-item">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <span className={task.completed ? 'done' : 'pending'}>
              {task.completed ? '✔️ Ukończone' : '⏳ W trakcie'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;