
import { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [editingId, setEditingId] = useState(null);

  const API_URL = 'https://app.krolikowski.cloud/tasks';

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setTasks)
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return alert('Uzupełnij wszystkie pola');

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const result = await response.json();
      setFormData({ title: '', description: '', due_date: '' });
      setEditingId(null);
      const updated = await fetch(API_URL).then(r => r.json());
      setTasks(updated);
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleToggleComplete = async (task) => {
    const updated = { ...task, completed: task.completed ? 0 : 1 };
    const res = await fetch(`${API_URL}/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    }
  };

  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description,
      due_date: task.due_date?.split('T')[0] || ''
    });
    setEditingId(task.id);
  };

  return (
    <div className="container">
      <h1>Lista Zadań</h1>
      <div className="form">
        <input name="title" value={formData.title} onChange={handleChange} placeholder="Tytuł" />
        <input name="description" value={formData.description} onChange={handleChange} placeholder="Opis" />
        <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} />
        <button onClick={handleSubmit}>{editingId ? '✏️ Zapisz zmiany' : '➕ Dodaj zadanie'}</button>
      </div>
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task">
            <div className="info">
              <div>
                <strong>{task.title}</strong><br />
                <span>{task.description}</span><br />
                <span className="due-date">{task.due_date ? `📅 ${task.due_date.split('T')[0]}` : 'Brak terminu'}</span>
              </div>
              <div className="actions">
                <button onClick={() => handleToggleComplete(task)}>
                  {task.completed ? '✅' : '⬜'}
                </button>
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
