

import React from 'react';

export default function AddTaskModal({ show, onClose, onSubmit, taskData, setTaskData }) {
    if (!show) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTaskData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h2>Nowe zadanie</h2>
                <input
                    type="text"
                    name="title"
                    placeholder="Tytuł"
                    value={taskData.title}
                    onChange={handleChange}
                />
                <textarea
                    name="description"
                    placeholder="Opis"
                    value={taskData.description}
                    onChange={handleChange}
                />
                <input
                    type="date"
                    name="due_date"
                    value={taskData.due_date}
                    onChange={handleChange}
                />
                <select name="priority" value={taskData.priority} onChange={handleChange}>
                    <option value="Ważne">Ważne</option>
                    <option value="Normalne">Normalne</option>
                    <option value="Może poczekać">Może poczekać</option>
                </select>
                <div className="modal-buttons">
                    <button onClick={onSubmit}>Dodaj</button>
                    <button onClick={onClose}>Anuluj</button>
                </div>
            </div>
        </div>
    );
}