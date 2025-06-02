import { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
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
    const [title, setTitle] = useState(task.title || '');
    const [description, setDescription] = useState(task.description || '');
    const [completed, setCompleted] = useState(task.completed || 0);
    const [dueDate, setDueDate] = useState(task.due_date?.split('T')[0] || '');
    const [priority, setPriority] = useState(task.priority ?? '');

    // Debug inicjalizacji
    console.log('=== INICJALIZACJA MODAL ===');
    console.log('task.priority z props:', task.priority);
    console.log('Ustawiony priority w state:', task.priority || 'Normalne');
    console.log('isNew:', isNew);
    console.log('Cały task object:', task);

    const handleSave = async () => {
      const updated = {
        title,
        description,
        completed: Number(completed),
        due_date: dueDate,
        priority
      };

      // Szczegółowe debugowanie
      console.log('=== DEBUG SAVE ===');
      console.log('Stan priority w komponencie:', priority);
      console.log('Typ priority:', typeof priority);
      console.log('Wysyłane dane JSON:', JSON.stringify(updated, null, 2));
      console.log('Headers:', { 'Content-Type': 'application/json' });

      if (isNew) {
        try {
          console.log('Wysyłam POST do:', API_URL);
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          });

          console.log('Status odpowiedzi:', response.status);
          console.log('Headers odpowiedzi:', [...response.headers.entries()]);

          if (response.ok) {
            const newTask = await response.json();
            console.log('Otrzymane z serwera (RAW):', newTask);
            console.log('Priorytet z serwera:', newTask.priority, typeof newTask.priority);
            onSave(newTask);
          } else {
            const errorText = await response.text();
            console.error('Błąd serwera:', response.status, errorText);
            alert('Nie udało się dodać zadania: ' + errorText);
          }
        } catch (error) {
          console.error('Błąd sieci:', error);
          alert('Błąd połączenia z serwerem');
        }
      } else {
        try {
          console.log('Wysyłam PUT do:', `${API_URL}/${task.id}`);
          const response = await fetch(`${API_URL}/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          });

          console.log('Status odpowiedzi PUT:', response.status);

          if (response.ok) {
            const updatedTask = await response.json();
            console.log('Zaktualizowane zadanie z serwera:', updatedTask);
            console.log('Priorytet po aktualizacji:', updatedTask.priority);
            setTasks(prev => prev.map(t => (t.id === task.id ? updatedTask : t)));
            onClose();
          } else {
            const errorText = await response.text();
            console.error('Błąd aktualizacji:', errorText);
            alert('Nie udało się zaktualizować zadania');
          }
        } catch (error) {
          console.error('Błąd sieci:', error);
          alert('Błąd połączenia z serwerem');
        }
      }
      console.log('=== END DEBUG ===');
    };

    return (
      <div className="modal-backdrop">
        <div className="modal">
          <h3>{isNew ? 'Dodaj nowe zadanie' : 'Edytuj zadanie'}</h3>

          <label>Tytuł:</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Wprowadź tytuł zadania"
          />

          <label>Opis:</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Wprowadź opis zadania"
            rows="3"
          />

          <label>Termin wykonania:</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
          />

          <label>Priorytet:</label>
          <select
            value={priority}
            onChange={e => {
              console.log('Zmiana priorytetu z:', priority, 'na:', e.target.value);
              setPriority(e.target.value);
            }}
          >
            <option value="Ważne">🔥 Ważne</option>
            <option value="Normalne">📌 Normalne</option>
            <option value="Może poczekać">⏳ Może poczekać</option>
          </select>

          <div className="checkbox-label">
            <input
              type="checkbox"
              checked={completed === 1}
              onChange={e => setCompleted(e.target.checked ? 1 : 0)}
            />
            <span>Zadanie wykonane</span>
          </div>

          <div className="modal-buttons">
            <button onClick={handleSave}>💾 Zapisz</button>
            <button onClick={onClose}>❌ Anuluj</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <h1>Lista Zadań</h1>

      {editingTask && (
        <EditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={() => setEditingTask(null)}
        />
      )}

      {addingTask && (
        <EditModal
          task={{
            title: '',
            description: '',
            completed: 0,
            due_date: '',
            priority: 'Normalne'
          }}
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
          <ul className="task-list">
            {group.map(task => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? 'done' : ''}`}
              >
                <div className="task-content">
                  <div className="title-wrapper">
                    <strong>{task.title}</strong>
                    <div className={`priority-label ${task.priority?.toLowerCase().replace(' ', '-')}`}>
                      {task.priority === 'Ważne' && '🔥 '}
                      {task.priority === 'Normalne' && '📌 '}
                      {task.priority === 'Może poczekać' && '⏳ '}
                      {task.priority}
                    </div>
                  </div>
                  <div className="description">{task.description}</div>
                  <div className="date">
                    {task.due_date ? task.due_date.split('T')[0] : 'Brak terminu'}
                  </div>
                </div>
                <div className="actions">
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

      {tasks.filter(t => !t.due_date).length > 0 && (
        <div>
          <h3>Bez terminu</h3>
          <ul className="task-list">
            {tasks.filter(t => !t.due_date).map(task => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? 'done' : ''}`}
              >
                <div className="task-content">
                  <div className="title-wrapper">
                    <strong>{task.title}</strong>
                    <div className={`priority-label ${task.priority?.toLowerCase().replace(' ', '-')}`}>
                      {task.priority === 'Ważne' && '🔥 '}
                      {task.priority === 'Normalne' && '📌 '}
                      {task.priority === 'Może poczekać' && '⏳ '}
                      {task.priority}
                    </div>
                  </div>
                  <div className="description">{task.description}</div>
                </div>
                <div className="actions">
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
      )}
    </div>
  );
}

export default App;