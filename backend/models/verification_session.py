from utils.database import get_db_connection
import uuid
from datetime import datetime

def create_verification_session(po_number, doc_type, file_path, validation_status):
    """Create a new verification session"""
    conn = get_db_connection()
    cursor = conn.cursor()
    session_id = str(uuid.uuid4())
    timestamp = datetime.now().isoformat()
    
    cursor.execute('''
        INSERT INTO verification_sessions (session_id, po_number, doc_type, file_path, validation_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (session_id, po_number, doc_type, file_path, validation_status, timestamp))
    
    conn.commit()
    conn.close()
    
    return session_id

def get_verification_session(session_id):
    """Get verification session by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM verification_sessions WHERE session_id = ?', (session_id,))
    row = cursor.fetchone()
    conn.close()
    
    return dict(row) if row else None

def get_all_verification_sessions(po_number=None, doc_type=None, status=None):
    """Get all verification sessions with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM verification_sessions WHERE 1=1'
    params = []
    
    if po_number:
        query += ' AND po_number = ?'
        params.append(po_number)
    
    if doc_type:
        query += ' AND doc_type = ?'
        params.append(doc_type)
    
    if status:
        query += ' AND validation_status = ?'
        params.append(status)
    
    query += ' ORDER BY created_at DESC'
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]
