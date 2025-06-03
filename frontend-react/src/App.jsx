import { useState, useEffect } from 'react';
import './style.css';
import Login from './Login';
import Register from './Register';

function App() {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [addingTask, setAddingTask] = useState(false);

  // Nowe stany dla autoryzacji
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // const API_URL = 'https://app.krolikowski.cloud';
  // const API_URL = 'http://localhost:5000';
  const API_URL = 'http://85.193.192.108:5000';

  // Sprawdź czy użytkownik jest już zalogowany przy starcie
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Pobierz zadania gdy użytkownik jest zalogowany
  useEffect(() => {
    if (user && token) {
      fetchTasks();
    }
  }, [user, token]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else if (response.status === 401) {
        // Token wygasł - wyloguj
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setTasks([]);
  };

  const makeAuthenticatedRequest = async (url, options = {}) => {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, defaultOptions);

    if (response.status === 401) {
      // Token wygasł - wyloguj
      handleLogout();
      return null;
    }

    return response;
  };

  const handleDelete = async (id) => {
    const response = await makeAuthenticatedRequest(`${API_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    if (response && response.ok) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleComplete = async (task) => {
    const updated = { ...task, completed: task.completed ? 0 : 1 };
    const response = await makeAuthenticatedRequest(`${API_URL}/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    if (response && response.ok) {
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
    const [priority, setPriority] = useState(task.priority || 'Normalne');

    const handleSave = async () => {
      const taskData = {
        title,
        description,
        completed: Number(completed),
        due_date: dueDate,
        priority: String(priority)
      };

      try {
        let response;
        if (isNew) {
          response = await makeAuthenticatedRequest(`${API_URL}/tasks`, {
            method: 'POST',
            body: JSON.stringify(taskData),
          });
        } else {
          response = await makeAuthenticatedRequest(`${API_URL}/tasks/${task.id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
          });
        }

        if (response && response.ok) {
          const updatedTask = await response.json();
          if (isNew) {
            onSave(updatedTask);
          } else {
            setTasks(prev => prev.map(t => (t.id === task.id ? updatedTask : t)));
            onClose();
          }
        } else {
          alert('Nie udało się zapisać zadania');
        }
      } catch (error) {
        console.error('Error saving task:', error);
        alert('Błąd połączenia z serwerem');
      }
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
            onChange={e => setPriority(e.target.value)}
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

  // Loading state
  if (isLoading) {
    return <div className="loading">Ładowanie...</div>;
  }

  // Jeśli nie zalogowany - pokaż formularze logowania/rejestracji
  if (!user) {
    return (
      <>
        {isLoginMode ? (
          <Login
            onLogin={handleLogin}
            switchToRegister={() => setIsLoginMode(false)}
          />
        ) : (
          <Register
            onLogin={handleLogin}
            switchToLogin={() => setIsLoginMode(true)}
          />
        )}
      </>
    );
  }

  // Główna aplikacja dla zalogowanych użytkowników
  return (
    <div className="container">
      <div className="header">
        <h1>Lista Zadań</h1>
        <div className="user-info">
          <span>Witaj, {user.username}!</span>
          <button onClick={handleLogout} className="logout-button">
            🚪 Wyloguj
          </button>
        </div>
      </div>

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