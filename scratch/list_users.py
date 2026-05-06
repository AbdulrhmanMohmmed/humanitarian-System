import sqlite3
import os

db_path = os.path.join('backend', 'humanitarian.db')
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, username, email, is_active FROM users;")
        rows = cursor.fetchall()
        print("ID | Username | Email | Is Active")
        print("-" * 40)
        for row in rows:
            print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]}")
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()
