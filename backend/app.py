@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    due_date = data.get('due_date')  # Accept due_date from request
    created_at = datetime.utcnow().isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO tasks (title, description, completed, created_at, due_date) VALUES (%s, %s, %s, %s, %s)',
        (title, description, 0, created_at, due_date)
    )
    conn.commit()
    task_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return jsonify({
        'id': task_id,
        'title': title,
        'description': description,
        'completed': 0,
        'created_at': created_at,
        'due_date': due_date
    }), 201
