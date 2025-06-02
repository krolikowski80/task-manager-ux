import { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Normalne');
  const [editingTask, setEditingTask] = useState(null);
  const [addingTask, setAddingTask] = useState(false);

  const API_URL = 'https://app.krolikowski.cloud/tasks';

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(setTasks)
      .catch(console.error);
  }, []);

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

  const EditModal = ({ task, onClose, onSave, isNew = false }) => {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description);
    const [completed, setCompleted] = useState(task.completed);
    const [dueDate, setDueDate] = useState(task.due_date?.split('T')[0] || '');
    const [priority, setPriority] = useState(task.priority ?? 'Normalne');

    const handleSave = async () => {
      const updated = {
        title,
        description,
        completed,
        due_date: dueDate,
        priority
      };

      if (isNew) {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });

        if (response.ok) {
          const newTask = await response.json();
          onSave(newTask);
          onClose();
          window.location.reload();
        }
      } else {
        const response = await fetch(`${API_URL}/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });

        if (response.ok) {
          setTasks(prev => prev.map(t => (t.id === task.id ? { ...t, ...updated } : t)));
          onClose();
        }
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

      {addingTask && (
        <EditModal
          task={{ title: '', description: '', completed: 0, due_date: '', priority: 'Normalne' }}
          onClose={() => setAddingTask(false)}
          onSave={(newTask) => {
            setTasks(prev => [...prev, newTask]);
            setAddingTask(false);
          }}
          isNew
        />
      )}

      <button
        className="add-button"
        onClick={() => setAddingTask(true)}
      >
        ➕ Dodaj zadanie
      </button>

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
                  <div className="title-wrapper">
                    <strong>{task.title}</strong>
                    <div className={`priority-label ${task.priority.toLowerCase().replace(' ', '-')}`}>
                      {task.priority === 'Ważne' && '🔥 '}
                      {task.priority === 'Normalne' && '📌 '}
                      {task.priority === 'Może poczekać' && '⏳ '}
                      {task.priority}
                    </div>
                  </div>
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
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default App;