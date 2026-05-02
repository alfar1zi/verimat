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

def get_all_verification_sessions(
    po_number=None, material_name=None, vendor_name=None,
    doc_type=None, status=None, material_code=None,
    date_from=None, date_to=None, batch_number=None
):
    """Get all verification sessions with optional filters"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = 'SELECT * FROM verification_sessions WHERE 1=1'
    params = []
    
    if po_number:
        query += ' AND po_number = ?'
        params.append(po_number)
    
    if material_name:
        query += ' AND material_name LIKE ?'
        params.append(f'%{material_name}%')
    
    if vendor_name:
        query += ' AND vendor_name LIKE ?'
        params.append(f'%{vendor_name}%')
    
    if doc_type:
        query += ' AND doc_type = ?'
        params.append(doc_type)
    
    if status:
        query += ' AND validation_status = ?'
        params.append(status)

    if material_code:
        query += ' AND material_code LIKE ?'
        params.append(f'%{material_code}%')

    if batch_number:
        query += ' AND batch_number LIKE ?'
        params.append(f'%{batch_number}%')

    if date_from:
        query += ' AND DATE(created_at) >= ?'
        params.append(date_from)

    if date_to:
        query += ' AND DATE(created_at) <= ?'
        params.append(date_to)
    
    query += ' ORDER BY created_at DESC'
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def clear_all_audit_data():
    """Clear all verification sessions and logs"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Delete all logs first (due to foreign key)
    cursor.execute('DELETE FROM verification_logs')
    
    # Delete all sessions
    cursor.execute('DELETE FROM verification_sessions')
    
    conn.commit()
    conn.close()
    
    return True
