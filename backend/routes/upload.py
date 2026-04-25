from flask import Blueprint, request, jsonify
import os
from datetime import datetime
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
    """Verify document with multiple files and new form fields"""
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    try:
        # Get required files
        if 'surat_jalan' not in request.files:
            return jsonify({'error': 'Surat Jalan file is required'}), 400
        
        surat_jalan = request.files['surat_jalan']
        coa = request.files.get('coa')
        faktur = request.files.get('faktur')
        dokumen_lain = request.files.getlist('dokumen_lain')
        
        if surat_jalan.filename == '':
            return jsonify({'error': 'Surat Jalan file is required'}), 400
        
        # Get form fields
        reference_number = request.form.get('reference_number', '')
        vendor_name = request.form.get('vendor_name', '')
        material_name = request.form.get('material_name', '')
        batch_number = request.form.get('batch_number', '')
        quantity = request.form.get('quantity', '0')
        unit = request.form.get('unit', '')
        document_date = request.form.get('document_date', '')
        packaging_condition = request.form.get('packaging_condition', '')
        storage_condition = request.form.get('storage_condition', '')
        temperature = request.form.get('temperature')
        notes = request.form.get('notes', '')
        
        # Save files
        saved_files = {}
        surat_jalan_path = os.path.join(UPLOAD_FOLDER, f"surat_jalan_{surat_jalan.filename}")
        surat_jalan.save(surat_jalan_path)
        saved_files['surat_jalan'] = surat_jalan_path
        
        if coa and coa.filename:
            coa_path = os.path.join(UPLOAD_FOLDER, f"coa_{coa.filename}")
            coa.save(coa_path)
            saved_files['coa'] = coa_path
        
        if faktur and faktur.filename:
            faktur_path = os.path.join(UPLOAD_FOLDER, f"faktur_{faktur.filename}")
            faktur.save(faktur_path)
            saved_files['faktur'] = faktur_path
        
        dokumen_lain_paths = []
        for doc in dokumen_lain:
            if doc.filename:
                doc_path = os.path.join(UPLOAD_FOLDER, f"doc_lain_{doc.filename}")
                doc.save(doc_path)
                dokumen_lain_paths.append(doc_path)
        saved_files['dokumen_lain'] = dokumen_lain_paths
        
        # Extract document data from Surat Jalan
        extracted_data = extract_document_data(surat_jalan_path, 'surat_jalan', reference_number)
        
        # Validate against PO/reference
        validation_result = validate_document(extracted_data, reference_number)
        
        # Create verification session with new fields
        from utils.database import get_db_connection
        import uuid
        session_id = str(uuid.uuid4())
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO verification_sessions (
                session_id, po_number, doc_type, file_path, validation_status, created_at,
                reference_number, vendor_name, material_name, batch_number, quantity, unit,
                document_date, packaging_condition, storage_condition, temperature, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_id, reference_number, 'surat_jalan', surat_jalan_path,
            validation_result['status'], datetime.now().isoformat(),
            reference_number, vendor_name, material_name, batch_number,
            float(quantity) if quantity else 0, unit, document_date,
            packaging_condition, storage_condition,
            float(temperature) if temperature else None, notes
        ))
        
        conn.commit()
        conn.close()
        
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
