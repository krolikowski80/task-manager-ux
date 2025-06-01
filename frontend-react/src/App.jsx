
import { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);

  const API_URL = 'https://app.krolikowski.cloud/tasks';

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setTasks)
      .catch(console.error);
  }, []);

  const handleAddTask = async () => {
    if (!title || !description) return alert('Uzupełnij wszystkie pola');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, due_date: dueDate })
    });

    if (response.ok) {
      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      setTitle('');
      setDescription('');
      setDueDate('');
    }
  };

  const handleDelete = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (response.ok) setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleComplete = async (task) => {
    const updated = { ...task, completed: task.completed ? 0 : 1 };
    const response = await fetch(`${API_URL}/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (response.ok) {
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    }
  };

  const handleEdit = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(task.due_date || '');
    setEditingTaskId(task.id);
  };

  const handleSaveEdit = async () => {
    const updated = {
      title, description,
      due_date: dueDate,
      completed: 0
    };
    const response = await fetch(`${API_URL}/${editingTaskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    if (response.ok) {
      const newTasks = tasks.map(t =>
        t.id === editingTaskId ? { ...t, ...updated } : t
      );
      setTasks(newTasks);
      setEditingTaskId(null);
      setTitle('');
      setDescription('');
      setDueDate('');
    }
  };

  return (
    <div className="container">
      <h1>Lista Zadań</h1>

      <div className="form">
        <input type="text" placeholder="Tytuł" value={title} onChange={e => setTitle(e.target.value)} />
        <input type="text" placeholder="Opis" value={description} onChange={e => setDescription(e.target.value)} />
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        {editingTaskId ? (
          <button onClick={handleSaveEdit}>💾 Zapisz zmiany</button>
        ) : (
          <button onClick={handleAddTask}>➕ Dodaj zadanie</button>
        )}
      </div>

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={task.completed ? 'done' : ''}>
            <div className="task-main">
              <div className="task-info">
                <strong>{task.title}</strong>
                <p>{task.description}</p>
                <small>{task.due_date || 'Brak terminu'}</small>
              </div>
              <div className="task-actions">
                <button onClick={() => handleToggleComplete(task)}>{task.completed ? '✅' : '⬜'}</button>
                <button onClick={() => handleEdit(task)}>✏️</button>
                <button onClick={() => handleDelete(task.id)}>🗑️</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
