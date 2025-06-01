import React, { useState, useEffect } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedTask, setEditedTask] = useState({ title: '', description: '', completed: false });
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  useEffect(() => {
    fetch('https://app.krolikowski.cloud/tasks')
      .then(res => res.json())
      .then(data => setTasks(data));
  }, []);

  const handleInputChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  const handleEditedInputChange = (e) => {
    setEditedTask({ ...editedTask, [e.target.name]: e.target.value });
  };

  const handleAddTask = () => {
    fetch('https://app.krolikowski.cloud/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })
      .then(res => res.json())
      .then(task => {
        setTasks([...tasks, task]);
        setNewTask({ title: '', description: '' });
      });
  };

  const handleEditClick = (task) => {
    setEditingTaskId(task.id);
    setEditedTask({
      title: task.title,
      description: task.description,
      completed: !!task.completed
    });
  };

  const handleSaveEdit = (id) => {
    fetch(`https://app.krolikowski.cloud/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedTask)
    })
      .then(res => res.json())
      .then(updated => {
        setTasks(tasks.map(t => (t.id === id ? updated : t)));
        setEditingTaskId(null);
      });
  };

  const handleDeleteTask = (id) => {
    fetch(`https://app.krolikowski.cloud/tasks/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        setTasks(tasks.filter(t => t.id !== id));
      });
  };

  const toggleExpanded = (id) => {
    setExpandedTaskId(prev => (prev === id ? null : id));
  };

  return (
    <div className="app">
      <h1>Lista Zadań</h1>

      <div className="new-task">
        <input
          type="text"
          name="title"
          placeholder="Tytuł zadania"
          value={newTask.title}
          onChange={handleInputChange}
        />
        <input
          type="text"
          name="description"
          placeholder="Opis zadania"
          value={newTask.description}
          onChange={handleInputChange}
        />
        <button onClick={handleAddTask}>Dodaj zadanie</button>
      </div>

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className={task.completed ? 'completed' : ''}>
            {editingTaskId === task.id ? (
              <>
                <input
                  type="text"
                  name="title"
                  value={editedTask.title}
                  onChange={handleEditedInputChange}
                />
                <input
                  type="text"
                  name="description"
                  value={editedTask.description}
                  onChange={handleEditedInputChange}
                />
                <label>
                  <input
                    type="checkbox"
                    checked={editedTask.completed}
                    onChange={(e) =>
                      setEditedTask({ ...editedTask, completed: e.target.checked })
                    }
                  />{' '}
                  Zrobione
                </label>
                <button onClick={() => handleSaveEdit(task.id)}>Zapisz</button>
              </>
            ) : (
              <>
                <div onClick={() => toggleExpanded(task.id)}>
                  <strong>{task.title}</strong>{' '}
                  <span className="status">{task.completed ? '✅' : '🕓'}</span>
                </div>

                {expandedTaskId === task.id && (
                  <>
                    <div className="description">{task.description}</div>
                    <button onClick={() => handleEditClick(task)}>Edytuj</button>
                  </>
                )}

                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id);
                  }}
                >
                  🗑️
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;