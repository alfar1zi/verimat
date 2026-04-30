from flask import Blueprint, request, jsonify
from models.verification_session import get_verification_session
from models.verification_log import get_verification_logs

verification_bp = Blueprint('verification', __name__)

@verification_bp.route('/result/<session_id>', methods=['GET'])
def get_verification_result(session_id):
    """Get verification result by session ID"""
    try:
        session = get_verification_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        return jsonify(session), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@verification_bp.route('/<session_id>', methods=['GET'])
def get_verification(session_id):
    """Get verification by session ID - returns full format including all form fields"""
    try:
        session = get_verification_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        logs = get_verification_logs(session_id)
        
        return jsonify({
            'session_id': session.get('session_id'),
            'po_number': session.get('po_number'),
            'reference_number': session.get('reference_number'),
            'vendor_name': session.get('vendor_name'),
            'material_name': session.get('material_name'),
            'batch_number': session.get('batch_number'),
            'quantity': session.get('quantity'),
            'unit': session.get('unit'),
            'document_date': session.get('document_date'),
            'packaging_condition': session.get('packaging_condition'),
            'storage_condition': session.get('storage_condition'),
            'temperature': session.get('temperature'),
            'notes': session.get('notes'),
            'expiry_date': session.get('expiry_date'),
            'doc_type': session.get('doc_type'),
            'status': session.get('validation_status'),
            'explanation': session.get('explanation', ''),
            'created_at': session.get('created_at'),
            'validation_result': {
                'validation_results': logs
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
