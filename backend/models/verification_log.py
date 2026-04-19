from utils.database import get_db_connection
from datetime import datetime

def create_verification_log(session_id, field_name, expected_value, actual_value, status, explanation):
    """Create a verification log entry"""
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO verification_logs (session_id, field_name, expected_value, actual_value, status, explanation, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (session_id, field_name, expected_value, actual_value, status, explanation, timestamp))
    
    conn.commit()
    conn.close()

def get_verification_logs(session_id):
    """Get all logs for a specific verification session"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM verification_logs WHERE session_id = ? ORDER BY created_at', (session_id,))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
