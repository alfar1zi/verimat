from datetime import datetime
from utils.database import get_db_connection, USE_AZURE_SQL, _fetchall_as_dicts, _fetchone_as_dict
import logging

logger = logging.getLogger(__name__)


def create_verification_session(session_id, po_number, doc_type, file_path,
                                 validation_status, reference_number=None,
                                 vendor_name=None, material_name=None,
                                 material_code=None, batch_number=None,
                                 quantity=None, unit=None, document_date=None,
                                 expiry_date=None, packaging_condition=None,
                                 storage_condition=None, temperature=None,
                                 notes=None, explanation=None, items_json=None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        cursor.execute(
            """INSERT INTO verification_sessions
               (session_id, po_number, doc_type, file_path, validation_status,
                reference_number, vendor_name, material_name, material_code,
                batch_number, quantity, unit, document_date, expiry_date,
                packaging_condition, storage_condition, temperature, notes,
                explanation, items_json, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (session_id, po_number, doc_type, file_path, validation_status,
             reference_number, vendor_name, material_name, material_code,
             batch_number, quantity, unit, document_date, expiry_date,
             packaging_condition, storage_condition, temperature, notes,
             explanation, items_json, now)
        )
        conn.commit()
        return session_id
    except Exception as e:
        logger.error(f"create_verification_session error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def get_verification_session(session_id: str) -> dict | None:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM verification_sessions WHERE session_id = ?",
            (session_id,)
        )
        return _fetchone_as_dict(cursor)
    finally:
        conn.close()


def get_all_verification_sessions(
    po_number=None, material_name=None, vendor_name=None,
    doc_type=None, status=None, material_code=None,
    date_from=None, date_to=None, batch_number=None
) -> list[dict]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        query = "SELECT * FROM verification_sessions WHERE 1=1"
        params = []

        if po_number:
            query += " AND (po_number LIKE ? OR reference_number LIKE ?)"
            params += [f'%{po_number}%', f'%{po_number}%']
        if material_name:
            query += " AND material_name LIKE ?"
            params.append(f'%{material_name}%')
        if vendor_name:
            query += " AND vendor_name LIKE ?"
            params.append(f'%{vendor_name}%')
        if material_code:
            query += " AND material_code LIKE ?"
            params.append(f'%{material_code}%')
        if batch_number:
            query += " AND batch_number LIKE ?"
            params.append(f'%{batch_number}%')
        if doc_type:
            query += " AND doc_type = ?"
            params.append(doc_type)
        if status:
            query += " AND validation_status = ?"
            params.append(status)
        if date_from:
            if USE_AZURE_SQL:
                query += " AND CAST(created_at AS DATE) >= ?"
            else:
                query += " AND DATE(created_at) >= ?"
            params.append(date_from)
        if date_to:
            if USE_AZURE_SQL:
                query += " AND CAST(created_at AS DATE) <= ?"
            else:
                query += " AND DATE(created_at) <= ?"
            params.append(date_to)

        query += " ORDER BY created_at DESC"
        cursor.execute(query, params)
        return _fetchall_as_dicts(cursor)
    finally:
        conn.close()


def delete_all_verification_sessions():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM verification_logs")
        cursor.execute("DELETE FROM verification_sessions")
        conn.commit()
    finally:
        conn.close()
