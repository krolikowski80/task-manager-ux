const handleSave = async () => {
  if (isNew) {
    const updated = {
      title,
      description,
      completed: Number(completed),
      due_date: dueDate,
      priority: String(priority)  // Upewnij się że to string
    };

    console.log('DEBUG priority is:', priority);
    console.log('Wysyłane dane JSON:', JSON.stringify(updated, null, 2));

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      console.log('Status odpowiedzi:', response.status);

      if (response.ok) {
        const newTask = await response.json();
        console.log('Otrzymane z serwera (RAW):', newTask);

        // TUTAJ JEST PROBLEM - nie nadpisuj priorytetu!
        // Użyj tego co zwrócił serwer lub upewnij się że serwer zwraca poprawny priorytet
        console.log('Priorytet z serwera:', newTask.priority);

        // Jeśli serwer nie zwraca priorytetu lub zwraca błędny, użyj lokalnego
        if (!newTask.priority) {
          newTask.priority = priority;
        }

        onSave(newTask); // Przekaż cały obiekt z serwera
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
    // kod dla edycji pozostaje bez zmian
    const updated = {
      title,
      description,
      completed: Number(completed),
      due_date: dueDate,
      priority: String(priority)  // Też upewnij się że to string
    };

    try {
      const response = await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (response.ok) {
        const updatedTask = await response.json();

        // Jeśli serwer nie zwraca priorytetu, użyj lokalnego
        if (!updatedTask.priority) {
          updatedTask.priority = priority;
        }

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
};