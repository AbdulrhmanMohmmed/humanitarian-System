from app.database import SessionLocal
from app.models import User

db = SessionLocal()
users = db.query(User).all()
print(f"Total users found: {len(users)}")
for u in users:
    print(f"Username: {u.username}, Email: {u.email}, Role: {u.role}")
db.close()
