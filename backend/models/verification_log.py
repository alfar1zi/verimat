from datetime import datetime
from utils.database import get_db_connection, _fetchall_as_dicts
import logging

logger = logging.getLogger(__name__)


def create_verification_log(session_id, field_name, expected_value,
                             actual_value, status, explanation=''):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO verification_logs
               (session_id, field_name, expected_value, actual_value,
                status, explanation, created_at)
               VALUES (?,?,?,?,?,?,?)""",
            (session_id, field_name, str(expected_value or ''),
             str(actual_value or ''), status, explanation,
             datetime.now().isoformat())
        )
        conn.commit()
    except Exception as e:
        logger.error(f"create_verification_log error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


def get_verification_logs(session_id: str) -> list[dict]:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM verification_logs WHERE session_id = ? ORDER BY id",
            (session_id,)
        )
        return _fetchall_as_dicts(cursor)
    finally:
        conn.close()
