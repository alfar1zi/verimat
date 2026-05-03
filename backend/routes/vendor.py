from flask import Blueprint, request, jsonify
from utils.database import get_db_connection, USE_AZURE_SQL
from utils.auth_middleware import require_auth

vendor_bp = Blueprint('vendor', __name__)

@vendor_bp.route('/search', methods=['GET'])
@require_auth
def search_vendors():
    q = request.args.get('q', '').strip()
    if len(q) < 1:
        return jsonify([])
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if USE_AZURE_SQL:
            cursor.execute(
                "SELECT TOP 5 DISTINCT vendor_name FROM verification_sessions "
                "WHERE vendor_name LIKE ? AND vendor_name IS NOT NULL "
                "ORDER BY vendor_name", (f'%{q}%',)
            )
            real = [r[0] for r in cursor.fetchall()]
            cursor.execute(
                "SELECT TOP 5 DISTINCT vendor_name FROM vendor_seeds "
                "WHERE vendor_name LIKE ? ORDER BY vendor_name", (f'%{q}%',)
            )
            seeds = [r[0] for r in cursor.fetchall()]
        else:
            cursor.execute(
                "SELECT DISTINCT vendor_name FROM verification_sessions "
                "WHERE vendor_name LIKE ? AND vendor_name IS NOT NULL "
                "ORDER BY vendor_name LIMIT 5", (f'%{q}%',)
            )
            real = [r[0] for r in cursor.fetchall()]
            cursor.execute(
                "SELECT DISTINCT vendor_name FROM vendor_seeds "
                "WHERE vendor_name LIKE ? ORDER BY vendor_name LIMIT 5",
                (f'%{q}%',)
            )
            seeds = [r[0] for r in cursor.fetchall()]

        seen = set(v.lower() for v in real)
        result = list(real)
        for s in seeds:
            if s.lower() not in seen:
                result.append(s)
                seen.add(s.lower())
        return jsonify(result[:10])
    finally:
        conn.close()
