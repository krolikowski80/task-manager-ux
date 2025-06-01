from flask import Flask, request, jsonify
import mysql.connector
from datetime import datetime
import os

app = Flask(__name__)


def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'localhost'),
        user=os.environ.get('DB_USER', 'nobody'),
        password=os.environ.get('DB_PASSWORD', ''),
        database=os.environ.get('DB_NAME', 'task_manager')
    )


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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
