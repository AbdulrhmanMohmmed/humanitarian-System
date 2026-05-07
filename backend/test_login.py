from app.database import SessionLocal
from app.models import User
from app.auth import verify_password, get_password_hash

db = SessionLocal()
admin = db.query(User).filter(User.username == 'admin').first()

if admin:
    print(f"Admin found. is_active: {admin.is_active}")
    print(f"Stored Hash: {admin.hashed_password}")
    new_hash = get_password_hash("admin123")
    print(f"New Hash of admin123: {new_hash}")
    
    is_valid = verify_password("admin123", admin.hashed_password)
    print(f"verify_password('admin123', admin.hashed_password) = {is_valid}")
    
    if not is_valid:
        print("Password mismatch. Resetting password to admin123...")
        admin.hashed_password = new_hash
        db.commit()
        print("Password reset successful.")
else:
    print("Admin user not found!")

db.close()
