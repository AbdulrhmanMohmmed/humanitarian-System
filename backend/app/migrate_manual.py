import sqlite3

def migrate():
    conn = sqlite3.connect('humanitarian.db')
    cursor = conn.cursor()
    
    print("Starting manual migration...")
    
    # Add columns to projects table
    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN latitude FLOAT")
        print("Added projects.latitude")
    except sqlite3.OperationalError:
        print("projects.latitude already exists")

    try:
        cursor.execute("ALTER TABLE projects ADD COLUMN longitude FLOAT")
        print("Added projects.longitude")
    except sqlite3.OperationalError:
        print("projects.longitude already exists")
    
    # Drop grants table to recreate with new schema (SQLite doesn't support complex ALTERS)
    try:
        cursor.execute("DROP TABLE grants")
        print("Dropped grants table")
    except sqlite3.OperationalError:
        print("grants table did not exist")

    conn.commit()
    conn.close()
    print("Migration finished.")

if __name__ == "__main__":
    migrate()
