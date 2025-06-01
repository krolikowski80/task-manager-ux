import React, { useEffect, useState } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    console.log("useEffect start");
    fetch('https://app.krolikowski.cloud/tasks')
      .then(response => response.json())
      .then(data => {
        console.log("Odebrane dane:", data);
        setTasks(data);
      })
      .catch(error => console.error("Błąd fetcha:", error));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch('https://app.krolikowski.cloud/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
      .then(res => res.json())
      .then(() => {
        setTitle('');
        setDescription('');
        return fetch('https://app.krolikowski.cloud/tasks');
      })
      .then(res => res.json())
      .then(data => setTasks(data))
      .catch(error => console.error("Błąd dodawania zadania:", error));
  };

  return (
    <div className="app">
      <h1>Lista Zadań</h1>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <strong>{task.title}</strong>: {task.description}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <h2>Dodaj zadanie</h2>
        <input
          type="text"
          placeholder="Tytuł"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <br />
        <input
          type="text"
          placeholder="Opis"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <br />
        <button type="submit">Dodaj</button>
      </form>
    </div>
  );
}

export default App;