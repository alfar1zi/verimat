from flask import Blueprint, request, jsonify
from utils.database import get_db_connection, USE_AZURE_SQL, _fetchall_as_dicts
from utils.auth_middleware import require_auth

material_bp = Blueprint('material', __name__)

@material_bp.route('/search', methods=['GET'])
@require_auth
def search_materials():
    q = request.args.get('q', '').strip()
    if len(q) < 1:
        return jsonify([])
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if USE_AZURE_SQL:
            cursor.execute(
                "SELECT TOP 10 material_code, material_name FROM materials "
                "WHERE UPPER(material_code) LIKE UPPER(?) "
                "ORDER BY material_code", (f'%{q}%',)
            )
        else:
            cursor.execute(
                "SELECT material_code, material_name FROM materials "
                "WHERE UPPER(material_code) LIKE UPPER(?) "
                "ORDER BY material_code LIMIT 10", (f'%{q}%',)
            )
        rows = _fetchall_as_dicts(cursor)
        return jsonify([{
            'code': r['material_code'],
            'name': r['material_name'],
            'display': f"{r['material_code']}: {r['material_name']}"
        } for r in rows])
    finally:
        conn.close()
