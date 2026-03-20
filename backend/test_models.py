import sys
import os
import traceback
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from backend import models
    print("Models imported successfully")
except Exception as e:
    with open("error.txt", "w", encoding="utf-8") as f:
        traceback.print_exc(file=f)

