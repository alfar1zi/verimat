import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.database import init_db
from models.verification_session import clear_all_audit_data

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    
    print("Clearing all audit trail data...")
    if clear_all_audit_data():
        print("✓ All verification sessions and logs have been cleared.")
    else:
        print("✗ Failed to clear audit data.")
