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

  const API_URL = 'https://app.krolikowski.cloud/api';
  // const API_URL = 'http://localhost:5000';
  // const API_URL = 'http://85.193.192.108:5000';

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak daty dodania';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `Dodano w dniu: ${day}-${month}-${year}`;
  };

  const parseSubTasks = (text) => {
    if (!text) return [];
    const lines = text.split('\n');
    const parsed = lines.map(line => {
      const checkboxMatch = line.match(/^- \[([ x])\] (.+)$/);
      if (checkboxMatch) {
        return {
          type: 'checkbox',
          checked: checkboxMatch[1] === 'x',
          text: checkboxMatch[2]
        };
      }
      return { type: 'text', text: line };
    });
    return parsed;
  };

  const SubTaskRenderer = ({ description, taskId, onUpdate }) => {
    const parsedLines = parseSubTasks(description);

    const handleCheckboxToggle = async (lineIndex) => {
      const newLines = parsedLines.map((line, index) => {
        if (index === lineIndex && line.type === 'checkbox') {
          return { ...line, checked: !line.checked };
        }
        return line;
      });

      // Odbuduj tekst
      const newDescription = newLines.map(line => {
        if (line.type === 'checkbox') {
          const check = line.checked ? 'x' : ' ';
          return `- [${check}] ${line.text}`;
        }
        return line.text;
      }).join('\n');

      // Wywołaj update
      if (onUpdate) {
        await onUpdate(newDescription);
      }
    };

    return (
      <div className="subtasks">
        {parsedLines.map((line, index) => (
          <div key={index} className="subtask-line">
            {line.type === 'checkbox' ? (
              <label className="subtask-checkbox">
                <input
                  type="checkbox"
                  checked={line.checked}
                  onChange={() => handleCheckboxToggle(index)}
                />
                <span className={line.checked ? 'subtask-done' : ''}>{line.text}</span>
              </label>
            ) : (
              <div className="subtask-text">{line.text}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Funkcja do aktualizacji pod-zadań
  const handleSubTaskUpdate = async (taskId, newDescription) => {
    // Znajdź zadanie
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Utwórz zaktualizowane zadanie
    const updatedTask = { ...task, description: newDescription };

    try {
      // Wyślij do API
      const response = await makeAuthenticatedRequest(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTask)
      });

      if (response && response.ok) {
        // Aktualizuj state
        setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
        console.log('Sub-zadanie zaktualizowane pomyślnie');
      } else {
        console.error('Błąd aktualizacji sub-zadania');
      }
    } catch (error) {
      console.error('Błąd podczas aktualizacji sub-zadania:', error);
    }
  };

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
    const [priority, setPriority] = useState(task.priority || 'Zwykłe');

    // Debug - sprawdź co otrzymuje komponent
    console.log('=== EditModal inicjalizacja ===');
    console.log('task.priority:', task.priority);
    console.log('ustawiony priority:', task.priority || 'Zwykłe');
    console.log('isNew:', isNew);

    const handleSave = async () => {
      const taskData = {
        title,
        description,
        completed: Number(completed),
        due_date: dueDate,
        priority: priority // Bez String() - to już jest string
      };

      // Debug - co wysyłamy
      console.log('=== Zapisywanie zadania ===');
      console.log('Dane do wysłania:', taskData);
      console.log('Priority w danych:', taskData.priority, typeof taskData.priority);

      try {
        let response;
        if (isNew) {
          console.log('Wysyłam POST na:', `${API_URL}/tasks`);
          response = await makeAuthenticatedRequest(`${API_URL}/tasks`, {
            method: 'POST',
            body: JSON.stringify(taskData),
          });
        } else {
          console.log('Wysyłam PUT na:', `${API_URL}/tasks/${task.id}`);
          response = await makeAuthenticatedRequest(`${API_URL}/tasks/${task.id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
          });
        }

        if (response && response.ok) {
          const updatedTask = await response.json();
          console.log('Otrzymane z serwera:', updatedTask);
          console.log('Priority z serwera:', updatedTask.priority);
          
          if (isNew) {
            onSave(updatedTask);
          } else {
            setTasks(prev => prev.map(t => (t.id === task.id ? updatedTask : t)));
            onClose();
          }
        } else {
          const errorText = await response?.text() || 'Nieznany błąd';
          console.error('Błąd serwera:', errorText);
          alert('Nie udało się zapisać zadania: ' + errorText);
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
            placeholder="Wprowadź opis zadania lub sub-zadania w formacie:&#10;- [ ] Zadanie do zrobienia&#10;- [x] Zadanie wykonane&#10;Zwykły tekst"
            rows="4"
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
            <option value="Zwykłe">📌 Zwykłe</option>
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
            priority: 'Zwykłe'
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
          .sort((a, b) => {
            if (a.completed !== b.completed) return a.completed - b.completed;
            return new Date(a.due_date) - new Date(b.due_date);
          })
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
          <h3>📅 {date}</h3>
          <ul className="task-list">
            {group.map(task => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? 'done' : ''}`}
              >
                <div className="task-content">
                  <div className="title-wrapper">
                    <strong>{task.title}</strong>
                  </div>
                  <div className={`priority-label ${task.priority?.toLowerCase().replace(' ', '-')}`}>
                    {task.priority === 'Ważne' && '🔥 '}
                    {task.priority === 'Zwykłe' && '📌 '}
                    {task.priority === 'Może poczekać' && '⏳ '}
                    {task.priority}
                  </div>
                  <SubTaskRenderer
                    description={task.description}
                    taskId={task.id}
                    onUpdate={(newDescription) => handleSubTaskUpdate(task.id, newDescription)}
                  />
                  <div className="date">
                    {task.created_at ? formatDate(task.created_at) : 'Brak daty dodania'}
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
          <h3>📅 Bez terminu</h3>
          <ul className="task-list">
            {tasks.filter(t => !t.due_date).sort((a, b) => a.completed - b.completed).map(task => (
              <li
                key={task.id}
                className={`task-item ${task.completed ? 'done' : ''}`}
              >
                <div className="task-content">
                  <div className="title-wrapper">
                    <strong>{task.title}</strong>
                  </div>
                  <div className={`priority-label ${task.priority?.toLowerCase().replace(' ', '-')}`}>
                    {task.priority === 'Ważne' && '🔥 '}
                    {task.priority === 'Zwykłe' && '📌 '}
                    {task.priority === 'Może poczekać' && '⏳ '}
                    {task.priority}
                  </div>
                  {/* TUTAJ BYŁA GŁÓWNA ZMIANA - używamy SubTaskRenderer zamiast zwykłego div */}
                  <SubTaskRenderer
                    description={task.description}
                    taskId={task.id}
                    onUpdate={(newDescription) => handleSubTaskUpdate(task.id, newDescription)}
                  />
                  <div className="date">
                    {task.created_at ? formatDate(task.created_at) : 'Brak daty dodania'}
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
      )}
    </div>
  );
}

export default App;