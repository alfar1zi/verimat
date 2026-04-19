from flask import Blueprint, request, jsonify
from models.verification_session import get_all_verification_sessions
from models.verification_log import get_verification_logs

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/trail', methods=['GET'])
def get_audit_trail():
    """Get all verification sessions with optional filters"""
    try:
        po_number = request.args.get('po_number')
        doc_type = request.args.get('doc_type')
        status = request.args.get('status')
        
        sessions = get_all_verification_sessions(
            po_number=po_number,
            doc_type=doc_type,
            status=status
        )
        
        return jsonify(sessions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audit_bp.route('/list', methods=['GET'])
def get_audit_list():
    """Get audit list with optional filters - returns simplified format"""
    try:
        po_number = request.args.get('po_number')
        doc_type = request.args.get('doc_type')
        status = request.args.get('status')
        
        sessions = get_all_verification_sessions(
            po_number=po_number,
            doc_type=doc_type,
            status=status
        )
        
        # Transform to required format
        result = []
        for session in sessions:
            result.append({
                'session_id': session.get('session_id'),
                'po_number': session.get('po_number'),
                'doc_type': session.get('doc_type'),
                'status': session.get('validation_status'),
                'created_at': session.get('created_at')
            })
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@audit_bp.route('/logs/<session_id>', methods=['GET'])
def get_session_logs(session_id):
    """Get detailed logs for a specific verification session"""
    try:
        logs = get_verification_logs(session_id)
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
