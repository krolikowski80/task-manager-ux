import os
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_cors import CORS
import mysql.connector
import bcrypt
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Wczytaj zmienne środowiskowe z pliku .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# Konfiguracja JWT
app.config['JWT_SECRET_KEY'] = os.environ.get(
    'JWT_SECRET_KEY', 'your-secret-key-change-me')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
jwt = JWTManager(app)

db_config = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME', 'task_manager')
}


def get_db_connection():
    return mysql.connector.connect(**db_config)


# ENDPOINTY UŻYTKOWNIKÓW

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email i password są wymagane'}), 400

    # Hash hasła
    password_hash = bcrypt.hashpw(password.encode(
        'utf-8'), bcrypt.gensalt()).decode('utf-8')

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s)',
            (username, email, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        cursor.close()
        conn.close()

        # Utwórz token dla nowego użytkownika
        access_token = create_access_token(identity=user_id)

        return jsonify({
            'message': 'Użytkownik utworzony pomyślnie',
            'access_token': access_token,
            'user': {'id': user_id, 'username': username, 'email': email}
        }), 201

    except mysql.connector.IntegrityError:
        return jsonify({'error': 'Username lub email już istnieje'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username i password są wymagane'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'error': 'Nieprawidłowy username lub password'}), 401

    access_token = create_access_token(identity=user['id'])

    return jsonify({
        'access_token': access_token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email']
        }
    })


# ENDPOINTY ZADAŃ (z autoryzacją)

@app.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = get_jwt_identity()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM tasks WHERE user_id = %s', (user_id,))
    tasks = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(tasks)


@app.route('/tasks', methods=['POST'])
@jwt_required()
def add_task():
    user_id = get_jwt_identity()
    data = request.get_json()

    title = data.get('title')
    description = data.get('description', '')
    due_date = data.get('due_date')
    priority = data.get('priority', 'Normalne')
    created_at = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO tasks (title, description, completed, created_at, due_date, priority, user_id) VALUES (%s, %s, %s, %s, %s, %s, %s)',
        (title, description, 0, created_at, due_date, priority, user_id)
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
        'due_date': due_date,
        'priority': priority,
        'user_id': user_id
    }), 201


@app.route('/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = get_jwt_identity()
    data = request.get_json()

    # Sprawdź czy task należy do użytkownika
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT user_id FROM tasks WHERE id = %s', (task_id,))
    result = cursor.fetchone()

    if not result or result[0] != user_id:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Zadanie nie znalezione lub nie masz uprawnień'}), 404

    title = data.get('title')
    description = data.get('description')
    completed = data.get('completed')
    due_date = data.get('due_date')
    priority = data.get('priority', 'Normalne')

    cursor.execute(
        'UPDATE tasks SET title = %s, description = %s, completed = %s, due_date = %s, priority = %s WHERE id = %s AND user_id = %s',
        (title, description, completed, due_date, priority, task_id, user_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        'id': task_id,
        'title': title,
        'description': description,
        'completed': completed,
        'due_date': due_date,
        'priority': priority,
        'user_id': user_id
    })


@app.route('/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Sprawdź czy task należy do użytkownika i usuń
    cursor.execute(
        'DELETE FROM tasks WHERE id = %s AND user_id = %s', (task_id, user_id))

    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Zadanie nie znalezione lub nie masz uprawnień'}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'message': f'Task {task_id} deleted successfully'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
