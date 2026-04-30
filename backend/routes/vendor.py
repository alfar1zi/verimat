from flask import Blueprint, request, jsonify
from utils.database import get_db_connection

vendor_bp = Blueprint('vendor', __name__)

@vendor_bp.route('/search', methods=['GET'])
def search_vendors():
    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify([])
    conn = get_db_connection()
    # Search dari transaksi nyata (prioritas) + seed data
    real_vendors = conn.execute(
        """SELECT DISTINCT vendor_name FROM verification_sessions 
           WHERE vendor_name LIKE ? AND vendor_name IS NOT NULL AND vendor_name != ''
           ORDER BY vendor_name LIMIT 5""",
        (f'%{q}%',)
    ).fetchall()
    seed_vendors = conn.execute(
        """SELECT DISTINCT vendor_name FROM vendor_seeds 
           WHERE vendor_name LIKE ?
           ORDER BY vendor_name LIMIT 5""",
        (f'%{q}%',)
    ).fetchall()
    conn.close()
    
    # Merge, deduplicate, prioritize real transactions
    all_vendors = [r['vendor_name'] for r in real_vendors]
    seen = set(v.lower() for v in all_vendors)
    for r in seed_vendors:
        if r['vendor_name'].lower() not in seen:
            all_vendors.append(r['vendor_name'])
            seen.add(r['vendor_name'].lower())
    
    return jsonify(all_vendors[:10])
