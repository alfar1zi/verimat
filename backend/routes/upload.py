from flask import Blueprint, request, jsonify
import os
from utils.document_extractor import extract_document_data
from models.verification_session import create_verification_session
from models.verification_log import create_verification_log
from utils.validation_engine import validate_document

upload_bp = Blueprint('upload', __name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@upload_bp.route('/document', methods=['POST'])
def upload_document():
    """Upload document and trigger verification process"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        po_number = request.form.get('po_number')
        doc_type = request.form.get('doc_type')  # 'surat_jalan', 'coa', 'halal'
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        
        # Extract document data (mock for now)
        extracted_data = extract_document_data(filepath, doc_type, po_number)
        
        # Validate against PO
        validation_result = validate_document(extracted_data, po_number)
        
        # Create verification session
        session_id = create_verification_session(
            po_number=po_number,
            doc_type=doc_type,
            file_path=filepath,
            validation_status=validation_result['status']
        )
        
        # Create verification log
        create_verification_log(
            session_id=session_id,
            field_name='all',
            expected_value='',
            actual_value=str(extracted_data),
            status=validation_result['status'],
            explanation=validation_result.get('explanation', '')
        )
        
        return jsonify({
            'session_id': session_id,
            'validation_result': validation_result,
            'extracted_data': extracted_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/verify', methods=['POST', 'OPTIONS'])
def verify_document():
    """Verify document with FormData: file, po_number, doc_type"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        po_number = request.form.get('po_number')
        doc_type = request.form.get('doc_type')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)
        
        # Extract document data
        extracted_data = extract_document_data(filepath, doc_type, po_number)
        
        # Validate against PO
        validation_result = validate_document(extracted_data, po_number)
        
        # Create verification session
        session_id = create_verification_session(
            po_number=po_number,
            doc_type=doc_type,
            file_path=filepath,
            validation_status=validation_result['status']
        )
        
        # Create verification log
        create_verification_log(
            session_id=session_id,
            field_name='all',
            expected_value='',
            actual_value=str(extracted_data),
            status=validation_result['status'],
            explanation=validation_result.get('explanation', '')
        )
        
        return jsonify({
            'session_id': session_id,
            'status': validation_result['status'],
            'explanation': validation_result.get('explanation', ''),
            'details': validation_result.get('validation_results', [])
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
