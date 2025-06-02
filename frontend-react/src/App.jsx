import { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Normalne'
  });

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

  const EditModal = ({ task, onClose }) => {
    const isEditing = !!task;
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [dueDate, setDueDate] = useState(task?.due_date?.split('T')[0] || '');
    const [priority, setPriority] = useState(task?.priority || 'Normalne');
    const [completed, setCompleted] = useState(task?.completed || 0);

    const handleSave = async () => {
      const payload = { title, description, due_date: dueDate, priority, completed };
      const response = await fetch(
        isEditing ? `${API_URL}/${task.id}` : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (response.ok) {
        const updated = await response.json();
        if (isEditing) {
          setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
        } else {
          setTasks(prev => [...prev, updated]);
        }
        onClose();
      }
    };

    return (
      <div className="modal">
        <h3>{isEditing ? 'Edytuj zadanie' : 'Dodaj zadanie'}</h3>
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

      {(editingTask || showAddModal) && (
        <EditModal task={editingTask || null} onClose={() => {
          setEditingTask(null);
          setShowAddModal(false);
        }} />
      )}

      <button className="add-button" onClick={() => setShowAddModal(true)}>➕ Dodaj zadanie</button>

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
                  <div className={`priority-label ${task.priority?.toLowerCase().replace(/\s/g, '-') || 'normalne'}`}>
                    {task.priority || 'Normalne'}
                  </div>
                  <div className="description">{task.description}</div>
                  <div className="date">
                    {task.due_date
                      ? new Date(task.due_date).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })
                      : 'Brak terminu'}
                  </div>
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