from flask import Blueprint, request, jsonify
import os
import uuid
import magic
from datetime import datetime
from werkzeug.utils import secure_filename
from utils.document_extractor import extract_document_data
from models.verification_session import create_verification_session
from models.verification_log import create_verification_log
from utils.validation_engine import validate_document
from utils.auth_middleware import require_auth
from utils.ai_explainer import generate_ai_explanation

upload_bp = Blueprint('upload', __name__)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
}
MAX_FILE_SIZE_MB = 10

def _validate_file(file) -> tuple[bool, str]:
    """Validate file extension, MIME type, and size."""
    if not file or file.filename == '':
        return False, 'File tidak ditemukan.'

    # Check extension
    filename = secure_filename(file.filename)
    if not filename or '.' not in filename:
        return False, 'Nama file tidak valid.'
    ext = filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f'Format file tidak didukung. Gunakan: {", ".join(ALLOWED_EXTENSIONS).upper()}'

    # Read first 2048 bytes for MIME check (don't load whole file)
    header = file.read(2048)
    file.seek(0)  # Reset stream

    try:
        mime = magic.from_buffer(header, mime=True)
        if mime not in ALLOWED_MIME_TYPES:
            return False, f'Tipe file tidak valid (terdeteksi: {mime}).'
    except Exception:
        # If magic unavailable, skip MIME check but log warning
        pass

    return True, ''

def _safe_save(file, prefix: str) -> str:
    """Save file with secure random filename, return saved path."""
    filename = secure_filename(file.filename)
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'bin'
    # Use UUID to prevent filename collision and path traversal
    safe_name = f"{prefix}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, safe_name)
    file.save(filepath)
    return filepath

def _sanitize(value: str, max_len: int = 255) -> str:
    """Strip whitespace and limit length."""
    if not value:
        return ''
    # Remove null bytes and control characters
    value = value.replace('\x00', '').strip()
    return value[:max_len]

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
        
        # Create per-field verification logs
        validation_results_list = validation_result.get('validation_results', [])
        if validation_results_list:
            for field_result in validation_results_list:
                create_verification_log(
                    session_id=session_id,
                    field_name=field_result.get('field', 'unknown'),
                    expected_value=str(field_result.get('expected', '')),
                    actual_value=str(field_result.get('actual', '')),
                    status=field_result.get('status', validation_result['status']),
                    explanation=field_result.get('message', '')
                )
        else:
            # Create a single summary log if no field-level results
            create_verification_log(
                session_id=session_id,
                field_name='summary',
                expected_value='',
                actual_value='',
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
@require_auth
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
        
        # Get form fields with sanitization
        reference_number = _sanitize(request.form.get('reference_number', ''), 100)
        vendor_name      = _sanitize(request.form.get('vendor_name', ''), 200)
        material_name    = _sanitize(request.form.get('material_name', ''), 200)
        batch_number     = _sanitize(request.form.get('batch_number', ''), 100)
        quantity         = _sanitize(request.form.get('quantity', '0'), 20)
        unit             = _sanitize(request.form.get('unit', ''), 20)
        document_date    = _sanitize(request.form.get('document_date', ''), 10)
        packaging_condition = _sanitize(request.form.get('packaging_condition', ''), 100)
        storage_condition   = _sanitize(request.form.get('storage_condition', ''), 100)
        temperature      = request.form.get('temperature')
        notes            = _sanitize(request.form.get('notes', ''), 1000)
        expiry_date      = _sanitize(request.form.get('expiry_date', ''), 10)
        material_code    = _sanitize(request.form.get('material_code', ''), 20)
        items_json = request.form.get('items', '') or request.form.get('items_json', '')
        dokumen_lain_subtype = request.form.get('dokumen_lain_subtype', 'lainnya')

        # Jika items ada, ekstrak field dari item pertama sebagai fallback
        if items_json and not material_name:
            try:
                import json as _json
                _items = _json.loads(items_json)
                if _items:
                    first = _items[0]
                    material_name = first.get('materialName', material_name)
                    batch_number = first.get('batchNumber', batch_number)
                    quantity = str(first.get('quantity', quantity))
                    unit = first.get('unit', unit)
                    expiry_date = first.get('expiryDate', expiry_date)
                    material_code = first.get('materialCode', material_code)
            except Exception:
                pass
        
        # Save files with validation
        saved_files = {}
        valid, err = _validate_file(surat_jalan)
        if not valid:
            return jsonify({'error': f'Surat Jalan: {err}'}), 400
        surat_jalan_path = _safe_save(surat_jalan, 'sj')
        saved_files['surat_jalan'] = surat_jalan_path

        if coa and coa.filename:
            valid, err = _validate_file(coa)
            if not valid:
                return jsonify({'error': f'CoA: {err}'}), 400
            coa_path = _safe_save(coa, 'coa')
            saved_files['coa'] = coa_path

        if faktur and faktur.filename:
            valid, err = _validate_file(faktur)
            if not valid:
                return jsonify({'error': f'Faktur: {err}'}), 400
            faktur_path = _safe_save(faktur, 'faktur')
            saved_files['faktur'] = faktur_path

        dokumen_lain_paths = []
        for doc in dokumen_lain:
            if doc.filename:
                valid, err = _validate_file(doc)
                if not valid:
                    continue  # Skip invalid files silently
                doc_path = _safe_save(doc, 'lain')
                dokumen_lain_paths.append(doc_path)
        saved_files['dokumen_lain'] = dokumen_lain_paths

        # Extract document data from Surat Jalan
        extracted_data = extract_document_data(surat_jalan_path, 'surat_jalan', reference_number)
        
        # Build form_data for validation engine (what user claims is in document)
        form_data = {
            'supplier_name': vendor_name,
            'material_name': material_name,
            'batch_number': batch_number,
            'quantity': quantity,
            'unit': unit,
            'po_number': reference_number,
        }
        
        # Ensure doc_type is always set
        extracted_data['doc_type'] = 'surat_jalan'
        
        # Validate against PO/reference with form_data
        validation_result = validate_document(extracted_data, reference_number, form_data=form_data)
        
        # Cross-validate CoA dengan form data jika CoA diupload
        if coa and coa.filename and 'coa' in saved_files:
            coa_extracted = extract_document_data(saved_files['coa'], 'coa', reference_number)
            
            cross_issues = []
            
            # Batch number CoA harus sama dengan yang ada di form
            coa_batch = coa_extracted.get('batch_number', '').strip()
            if coa_batch and batch_number:
                from utils.validation_engine import _strings_match
                if not _strings_match(coa_batch, batch_number):
                    cross_issues.append({
                        'field': 'batch_number_cross',
                        'status': 'MISMATCH',
                        'message': f"Nomor batch di CoA '{coa_batch}' tidak sama dengan Surat Jalan '{batch_number}'",
                        'expected': batch_number,
                        'actual': coa_batch
                    })
            
            # Expiry date: jika CoA ada expiry, cocokkan dengan form expiry_date
            coa_expiry = coa_extracted.get('expiry_date', '').strip()
            if coa_expiry and expiry_date:
                if not _strings_match(coa_expiry, expiry_date):
                    cross_issues.append({
                        'field': 'expiry_date_cross',
                        'status': 'MISMATCH', 
                        'message': f"Expired date di CoA '{coa_expiry}' tidak sama dengan form '{expiry_date}'",
                        'expected': expiry_date,
                        'actual': coa_expiry
                    })
            
            # Jika ada cross issues, ubah status jadi MISMATCH
            if cross_issues:
                existing_results = validation_result.get('validation_results', [])
                existing_results.extend(cross_issues)
                validation_result['validation_results'] = existing_results
                validation_result['status'] = 'MISMATCH'
                
                # Update explanation
                validation_result['explanation'] = (
                    validation_result.get('explanation', '') + 
                    ' Ditemukan ketidaksesuaian antara CoA dan Surat Jalan.'
                )
        
        # Build uploaded_doc_types list for database
        uploaded_doc_types = ['surat_jalan']  # selalu ada
        if coa and coa.filename:
            uploaded_doc_types.append('coa')
        if faktur and faktur.filename:
            uploaded_doc_types.append('faktur')
        if dokumen_lain_paths:
            uploaded_doc_types.append(f'dokumen_lain:{dokumen_lain_subtype}')
        uploaded_doc_types_str = ','.join(uploaded_doc_types)
        
        # Generate AI explanation jika belum ada
        if not validation_result.get('explanation'):
            validation_result['explanation'] = generate_ai_explanation(
                status=validation_result.get('status', 'INCOMPLETE'),
                validation_results=validation_result.get('validation_results', []),
                vendor_name=vendor_name or '',
                material_name=material_name or '',
                reference_number=reference_number or ''
            )
        
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
                document_date, packaging_condition, storage_condition, temperature, notes, explanation,
                expiry_date, items_json, material_code
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_id, reference_number, uploaded_doc_types_str, surat_jalan_path,
            validation_result['status'], datetime.now().isoformat(),
            reference_number, vendor_name, material_name, batch_number,
            float(quantity) if quantity else 0, unit, document_date,
            packaging_condition, storage_condition,
            float(temperature) if temperature else None, notes,
            validation_result.get('explanation', ''),
            expiry_date, items_json, material_code
        ))
        
        conn.commit()
        conn.close()
        
        # Save material code mapping untuk setiap item (jika ada items_json)
        if items_json:
            try:
                import json
                items = json.loads(items_json)
                for item in items:
                    code = item.get('materialCode', '').strip()
                    name = item.get('materialName', '').strip()
                    if code and name:
                        from utils.database import upsert_material
                        upsert_material(code, name)
            except (json.JSONDecodeError, Exception):
                pass
        
        # Fallback: save material code mapping dari field lama
        if material_code and material_name:
            from utils.database import upsert_material
            upsert_material(material_code, material_name)
        
        # Create per-field verification logs
        validation_results_list = validation_result.get('validation_results', [])
        if validation_results_list:
            for field_result in validation_results_list:
                create_verification_log(
                    session_id=session_id,
                    field_name=field_result.get('field', 'unknown'),
                    expected_value=str(field_result.get('expected', '')),
                    actual_value=str(field_result.get('actual', '')),
                    status=field_result.get('status', validation_result['status']),
                    explanation=field_result.get('message', '')
                )
        else:
            # Create a single summary log if no field-level results
            create_verification_log(
                session_id=session_id,
                field_name='summary',
                expected_value='',
                actual_value='',
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
