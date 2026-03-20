import sys
import os
import traceback
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from backend import models
    from backend.database import engine
    models.Base.metadata.create_all(bind=engine)
    print("Tables created successfully")
except Exception as e:
    with open("error_db.txt", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)
    print("Failed to create tables")
