from flask import Blueprint, request, jsonify
from utils.database import get_db_connection

vendor_bp = Blueprint('vendor', __name__)

@vendor_bp.route('/search', methods=['GET'])
def search_vendors():
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify([])
    conn = get_db_connection()
    rows = conn.execute(
        """SELECT DISTINCT vendor_name FROM verification_sessions 
           WHERE vendor_name LIKE ? AND vendor_name IS NOT NULL AND vendor_name != ''
           ORDER BY vendor_name LIMIT 10""",
        (f'%{q}%',)
    ).fetchall()
    conn.close()
    return jsonify([row['vendor_name'] for row in rows])
