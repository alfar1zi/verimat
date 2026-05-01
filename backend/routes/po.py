from flask import Blueprint, jsonify, request
from models.purchase_order import get_all_purchase_orders
from utils.database import get_db_connection

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

@po_bp.route('/search', methods=['GET'])
def search_po():
    """Search purchase orders by PO number or material name"""
    try:
        query = request.args.get('q', '')
        if not query or len(query) < 2:
            return jsonify([]), 200
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT po_number, material_name, supplier_name, quantity, unit
            FROM purchase_orders
            WHERE po_number LIKE ? OR material_name LIKE ?
            LIMIT 5
        ''', (f'%{query}%', f'%{query}%'))
        
        results = cursor.fetchall()
        conn.close()
        
        formatted_results = []
        for row in results:
            formatted_results.append({
                'po_number': row['po_number'],
                'material_name': row['material_name'],
                'display': f"{row['po_number']}: {row['material_name']}"
            })
        
        return jsonify(formatted_results), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
