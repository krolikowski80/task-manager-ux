import { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Normalne');
  const [editingTask, setEditingTask] = useState(null);

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
      body: JSON.stringify({
        title,
        description,
        due_date: dueDate || null,
        priority
      })
    });

    if (response.ok) {
      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('Normalne');
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
    setEditingTask(task);
  };

  const EditModal = ({ task, onClose }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [completed, setCompleted] = useState(task.completed);
    const [dueDate, setDueDate] = useState(task.due_date?.split('T')[0] || '');
    const [priority, setPriority] = useState(task.priority || 'Normalne');

    const handleSave = async () => {
      const updated = { title, description, completed, due_date: dueDate, priority };
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (response.ok) {
        setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, ...updated } : t)));
        onClose();
      }
    };

    return (
      <div className="modal">
        <h3>Edytuj zadanie</h3>
        <input value={title} onChange={e => setTitle(e.target.value)} />
        <input value={description} onChange={e => setDescription(e.target.value)} />
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="Ważne">Ważne</option>
          <option value="Normalne">Normalne</option>
          <option value="Może poczekać">Może poczekać</option>
        </select>
        <label>
          <input type="checkbox" checked={completed} onChange={e => setCompleted(e.target.checked ? 1 : 0)} />
          <small>Zrobione</small>
        </label>
        <button onClick={handleSave}>💾 Zapisz</button>
        <button onClick={onClose}>❌ Anuluj</button>
      </div>
    );
  };

  return (
    <div className="container">
      <h1>Lista Zadań</h1>

      {editingTask && (
        <EditModal task={editingTask} onClose={() => setEditingTask(null)} />
      )}

      <div className="form">
        <input
          type="text"
          placeholder="Tytuł"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: "10rem" }}
        />
        <input
          type="text"
          placeholder="Opis"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ width: "10rem" }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          style={{ width: "10rem" }}
        />
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ width: '10rem' }}>
          <option value="Ważne">Ważne</option>
          <option value="Normalne">Normalne</option>
          <option value="Może poczekać">Może poczekać</option>
        </select>
        <button
          className="add-button"
          onClick={handleAddTask}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.2rem',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ➕ Dodaj zadanie
        </button>
      </div>

      {Object.entries(
        tasks
          .filter(t => t.due_date)
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
          .reduce((acc, task) => {
            const date = new Date(task.due_date).toLocaleDateString('pl-PL', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            });
            acc[date] = acc[date] || [];
            acc[date].push(task);
            return acc;
          }, {})
      ).map(([date, group]) => (
        <div key={date}>
          <h3>{date}</h3>
          <ul className="task-list" style={{ padding: 0 }}>
            {group.map(task => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? 'done' : ''}`}
              >
                <div>
                  <strong>{task.title}</strong>
                  <div><em>Priorytet: {task.priority || 'Normalne'}</em></div>
                  <div className="description">{task.description}</div>
                  <div className="date">{task.due_date ? task.due_date.split('T')[0] : 'Brak terminu'}</div>
                </div>
                <div className="actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                  <button onClick={() => handleToggleComplete(task)}>
                    {task.completed ? '✅' : '⬜'}
                  </button>
                  <button onClick={() => handleEdit(task)}>✏️</button>
                  <button onClick={() => handleDelete(task.id)}>🗑️</button>
                </div>
              </li>
            ))}s
          </ul>
        </div>
      ))}
    </div>
  );
}

export default App;