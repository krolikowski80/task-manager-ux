from flask import Flask, Response
import mysql.connector
import json
from datetime import datetime

app = Flask(__name__)

db_config = {
    'host': '85.193.192.108',
    'user': 'tm_user',
    'password': 'TaskHaslo!123',
    'database': 'task_manager'
}

@app.route('/tasks', methods=['GET'])
def get_tasks():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tasks")
        tasks = cursor.fetchall()
        cursor.close()
        conn.close()

        # Konwersja datetime → string
        for task in tasks:
            if isinstance(task['created_at'], datetime):
                task['created_at'] = task['created_at'].isoformat()

        return Response(
            json.dumps(tasks, ensure_ascii=False, indent=2),
            content_type="application/json; charset=utf-8"
        )

    except mysql.connector.Error as err:
        return Response(
            json.dumps({"error": str(err)}, ensure_ascii=False),
            status=500,
            content_type="application/json; charset=utf-8"
        )

if __name__ == '__main__':
    app.run(debug=True)