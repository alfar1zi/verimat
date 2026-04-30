from flask import Blueprint, request, jsonify
from utils.database import get_db_connection

material_bp = Blueprint('material', __name__)

@material_bp.route('/search', methods=['GET'])
def search_materials():
    q = request.args.get('q', '').strip()
    if len(q) < 1:
        return jsonify([])
    conn = get_db_connection()
    rows = conn.execute(
        '''SELECT material_code, material_name FROM materials
           WHERE UPPER(material_code) LIKE UPPER(?) OR material_name LIKE ?
           ORDER BY material_code LIMIT 10''',
        (f'%{q}%', f'%{q}%')
    ).fetchall()
    conn.close()
    return jsonify([{
        'code': row['material_code'],
        'name': row['material_name'],
        'display': f"{row['material_code']} — {row['material_name']}"
    } for row in rows])
