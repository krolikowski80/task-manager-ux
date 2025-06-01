import React, { useEffect, useState } from 'react';
import './style.css';

function App() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    console.log("useEffect start");

    fetch('https://app.krolikowski.cloud/tasks')
      .then(response => {
        console.log("Odpowiedź serwera:", response);
        return response.json();
      })
      .then(data => {
        console.log("Odebrane dane:", data);
        setTasks(data);
      })
      .catch(error => console.error("Błąd fetcha:", error));
  }, []);

  return (
    <div className="app">
      <h1>Lista zadań</h1>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <strong>{task.title}</strong>: {task.description}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
