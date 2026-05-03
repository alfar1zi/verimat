from flask import Blueprint, jsonify, request
from models.purchase_order import get_all_purchase_orders, search_purchase_orders
from utils.database import USE_AZURE_SQL, _fetchall_as_dicts
from utils.auth_middleware import require_auth

po_bp = Blueprint('po', __name__)

@po_bp.route('/list', methods=['GET'])
@require_auth
def get_po_list():
    """Get list of all purchase orders"""
    try:
        pos = get_all_purchase_orders()
        # Transform to required format
        result = []
        for po in pos:
            po_number = po.get('po_number', '')
            material_name = po.get('material_name', '')
            supplier_name = po.get('supplier_name', '')
            quantity = po.get('quantity', 0)
            unit = po.get('unit', '')
            
            result.append({
                'id': po_number,
                'po_number': po_number,
                'material_name': material_name,
                'display': f"{po_number} - {material_name}",
                'supplier': supplier_name,
                'quantity': quantity,
                'unit': unit
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@po_bp.route('/search', methods=['GET'])
@require_auth
def search_po():
    """Search purchase orders by PO number or material name"""
    try:
        query = request.args.get('q', '')
        if not query or len(query) < 2:
            return jsonify([]), 200

        results = search_purchase_orders(query)

        formatted_results = []
        for row in results:
            formatted_results.append({
                'po_number': row.get('po_number', ''),
                'material_name': row.get('material_name', ''),
                'display': f"{row.get('po_number', '')}: {row.get('material_name', '')}"
            })

        return jsonify(formatted_results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
