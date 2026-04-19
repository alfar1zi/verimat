from flask import Blueprint, jsonify
from models.purchase_order import get_all_purchase_orders

po_bp = Blueprint('po', __name__)

@po_bp.route('/list', methods=['GET'])
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
