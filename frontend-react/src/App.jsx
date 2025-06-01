import { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editId, setEditId] = useState(null);
  const [status, setStatus] = useState('do_zrobienia');
  const [expandedId, setExpandedId] = useState(null);

  const API_URL = 'https://app.krolikowski.cloud/tasks';

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setTasks)
      .catch(console.error);
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setStatus('do_zrobienia');
    setEditId(null);
  };

  const handleAddOrEditTask = async () => {
    if (!title || !description) return alert('Uzupełnij wszystkie pola');

    const taskData = {
      title,
      description,
      status,
      due_date: dueDate
    };

    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `${API_URL}/${editId}` : API_URL;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });

    if (response.ok) {
      const updatedTask = await response.json();
      if (editId) {
        setTasks(prev => prev.map(t => (t.id === editId ? updatedTask : t)));
      } else {
        setTasks(prev => [...prev, updatedTask]);
      }
      resetForm();
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
      setTasks(prev =>
        prev.map(t => (t.id === task.id ? updated : t))
      );
    }
  };

  const handleEditClick = (task) => {
    setEditId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status || 'do_zrobienia');
    setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
  };

  const toggleExpanded = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
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
        <textarea
          placeholder="Opis zadania"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="do_zrobienia">🕒 Do zrobienia</option>
          <option value="w_trakcie">🔧 W trakcie</option>
          <option value="zrobione">✅ Zrobione</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
        />
        <button onClick={handleAddOrEditTask}>
          {editId ? '✏️ Zapisz zmiany' : '➕ Dodaj zadanie'}
        </button>
      </div>

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={task.completed ? 'done' : ''}>
            <div onClick={() => toggleExpanded(task.id)}>
              <strong>{task.title}</strong> — {task.status || '🕒'}
            </div>

            {expandedId === task.id && (
              <div className="expanded">
                <p><em>{task.description}</em></p>
                {task.due_date && <p>📅 Termin: {task.due_date.split('T')[0]}</p>}
              </div>
            )}

            <div className="buttons">
              <button onClick={() => handleToggleComplete(task)}>
                {task.completed ? '✅' : '⬜'}
              </button>
              <button onClick={() => handleEditClick(task)}>✏️</button>
              <button onClick={() => handleDelete(task.id)}>🗑️</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;