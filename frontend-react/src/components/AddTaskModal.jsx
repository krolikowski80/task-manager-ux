import React, { useState, useEffect } from 'react';
import AddTaskModal from './components/AddTaskModal';

const API_URL = 'http://localhost:3001/tasks';

function App() {
    const [tasks, setTasks] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [taskData, setTaskData] = useState({
        title: '',
        description: '',
        due_date: '',
        priority: 'Normalne'
    });

    useEffect(() => {
        fetch(API_URL)
            .then(res => res.json())
            .then(data => setTasks(data))
            .catch(console.error);
    }, []);

    return (
        <div className="App">
            <button onClick={() => setShowAddModal(true)}>Dodaj zadanie</button>
            {showAddModal && (
                <AddTaskModal
                    show={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onSubmit={async () => {
                        if (!taskData.title || !taskData.description) return alert('Uzupełnij wszystkie pola');
                        const response = await fetch(API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(taskData)
                        });
                        if (response.ok) {
                            const newTask = await response.json();
                            setTasks(prev => [...prev, newTask]);
                            setShowAddModal(false);
                            setTaskData({ title: '', description: '', due_date: '', priority: 'Normalne' });
                        }
                    }}
                    taskData={taskData}
                    setTaskData={setTaskData}
                />
            )}
            {/* Rest of your app rendering tasks */}
        </div>
    );
}

export default App;