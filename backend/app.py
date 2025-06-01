import os
from flask import Flask, request, jsonify
import mysql.connector
from datetime import datetime, timezone
from dotenv import load_dotenv

# Wczytaj zmienne środowiskowe z pliku .env
load_dotenv()

app = Flask(__name__)

db_config = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'task_manager')
}


def get_db_connection():
    return mysql.connector.connect(**db_config)


@app.route('/tasks', methods=['GET'])
def get_tasks():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM tasks')
    tasks = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(tasks)


@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    due_date = data.get('due_date')  # format ISO z frontend
    created_at = datetime.now(timezone.utc).isoformat()

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


@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    completed = data.get('completed')
    due_date = data.get('due_date')

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'UPDATE tasks SET title = %s, description = %s, completed = %s, due_date = %s WHERE id = %s',
        (title, description, completed, due_date, task_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        'id': task_id,
        'title': title,
        'description': description,
        'completed': completed,
        'due_date': due_date
    })


@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM tasks WHERE id = %s', (task_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'message': f'Task {task_id} deleted successfully'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
