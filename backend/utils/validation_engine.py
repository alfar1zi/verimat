from datetime import datetime
import re
from models.purchase_order import get_purchase_order_by_number
from utils.ai_explainer import generate_ai_explanation

def _normalize_string(s):
    """Normalize string for comparison: lowercase, strip whitespace, remove common legal suffixes."""
    if not s:
        return ''
    s = str(s).lower().strip()
    # Remove common legal suffixes
    s = re.sub(r'\b(tbk|pt|cv|ud|co|ltd|inc)\b\.?', '', s)
    # Collapse multiple spaces
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def _strings_match(a, b):
    """Case-insensitive, normalized string comparison."""
    return _normalize_string(a) == _normalize_string(b)

def _safe_float(val):
    """Safely convert value to float, extracting digits only if needed."""
    if val is None:
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        # Try extracting digits only (handles "100 kg" → 100.0)
        digits = re.sub(r'[^\d.]', '', str(val))
        try:
            return float(digits) if digits else None
        except ValueError:
            return None

def _get_comparison_value(extracted_data, form_data, field_key):
    """
    Priority:
    1. Jika Azure mengekstrak nilai (non-empty, non-None): pakai Azure
    2. Jika Azure kosong tapi form_data ada: pakai form_data
    3. Jika keduanya kosong: return None (akan menjadi INCOMPLETE)
    
    Jangan pernah pakai PO data sebagai fallback —
    PO data hanya untuk dibandingkan, bukan sebagai sumber extracted.
    """
    azure_val = extracted_data.get(field_key)
    if azure_val and str(azure_val).strip():
        return str(azure_val).strip()
    if form_data:
        form_val = form_data.get(field_key)
        if form_val and str(form_val).strip():
            return str(form_val).strip()
    return None

def validate_document(extracted_data, po_number, form_data=None):
    """
    Deterministic rules engine for document validation
    Returns: PASS, MISMATCH, or INCOMPLETE
    """
    # Get PO data
    po = get_purchase_order_by_number(po_number)
    
    if not po:
        return {
            'status': 'MISMATCH',
            'explanation': f'PO number {po_number} not found in database'
        }
    
    validation_results = []
    all_fields_present = True
    
    # Check required fields based on document type
    doc_type = extracted_data.get('doc_type', '')
    
    if doc_type == 'surat_jalan':
        # Ambil nilai dari dokumen (Azure > form fallback > None)
        doc_supplier   = _get_comparison_value(extracted_data, form_data, 'supplier_name')
        doc_material   = _get_comparison_value(extracted_data, form_data, 'material_name')
        doc_batch      = _get_comparison_value(extracted_data, form_data, 'batch_number')
        doc_quantity   = _get_comparison_value(extracted_data, form_data, 'quantity')
        doc_po_number  = _get_comparison_value(extracted_data, form_data, 'po_number')

        # Validasi supplier_name
        if not doc_supplier:
            all_fields_present = False
            validation_results.append({
                'field': 'supplier_name',
                'status': 'INCOMPLETE',
                'message': 'Nama supplier tidak ditemukan di dokumen.'
            })
        elif not _strings_match(doc_supplier, po['supplier_name']):
            validation_results.append({
                'field': 'supplier_name',
                'status': 'MISMATCH',
                'message': f"Nama vendor tidak sesuai: dokumen '{doc_supplier}' ≠ PO '{po['supplier_name']}'",
                'expected': po['supplier_name'],
                'actual': doc_supplier
            })

        # Validasi material_name
        if not doc_material:
            all_fields_present = False
            validation_results.append({
                'field': 'material_name',
                'status': 'INCOMPLETE',
                'message': 'Nama bahan baku tidak ditemukan di dokumen.'
            })
        elif not _strings_match(doc_material, po['material_name']):
            validation_results.append({
                'field': 'material_name',
                'status': 'MISMATCH',
                'message': f"Nama bahan tidak sesuai: dokumen '{doc_material}' ≠ PO '{po['material_name']}'",
                'expected': po['material_name'],
                'actual': doc_material
            })

        # Validasi batch_number — hanya cek keberadaan, tidak cocokkan dengan PO
        if not doc_batch:
            all_fields_present = False
            validation_results.append({
                'field': 'batch_number',
                'status': 'INCOMPLETE',
                'message': 'Nomor batch tidak ditemukan di dokumen.'
            })

        # Validasi quantity
        if not doc_quantity:
            all_fields_present = False
            validation_results.append({
                'field': 'quantity',
                'status': 'INCOMPLETE',
                'message': 'Jumlah tidak ditemukan di dokumen.'
            })
        else:
            extracted_qty = _safe_float(doc_quantity)
            po_qty = _safe_float(po['quantity'])
            if extracted_qty is not None and po_qty is not None:
                if abs(extracted_qty - po_qty) > 0.01:
                    validation_results.append({
                        'field': 'quantity',
                        'status': 'MISMATCH',
                        'message': f"Jumlah tidak sesuai: dokumen '{doc_quantity}' ≠ PO '{po['quantity']}'",
                        'expected': str(po['quantity']),
                        'actual': str(doc_quantity)
                    })

        # Validasi po_number
        if not doc_po_number:
            all_fields_present = False
            validation_results.append({
                'field': 'po_number',
                'status': 'INCOMPLETE',
                'message': 'Nomor PO tidak ditemukan di dokumen.'
            })
        elif not _strings_match(doc_po_number, po_number):
            validation_results.append({
                'field': 'po_number',
                'status': 'MISMATCH',
                'message': f"Nomor PO tidak sesuai: dokumen '{doc_po_number}' ≠ sistem '{po_number}'",
                'expected': po_number,
                'actual': doc_po_number
            })
    
    elif doc_type == 'coa':
        # Validate CoA fields
        if 'material_name' not in extracted_data or not extracted_data['material_name']:
            all_fields_present = False
            validation_results.append({
                'field': 'material_name',
                'status': 'INCOMPLETE',
                'message': 'Material name not found in CoA'
            })
        elif not _strings_match(extracted_data['material_name'], po['material_name']):
            validation_results.append({
                'field': 'material_name',
                'status': 'MISMATCH',
                'message': f"Material mismatch: expected '{po['material_name']}', got '{extracted_data['material_name']}'",
                'expected': po['material_name'],
                'actual': extracted_data['material_name']
            })
        
        if 'batch_number' not in extracted_data or not extracted_data['batch_number']:
            all_fields_present = False
            validation_results.append({
                'field': 'batch_number',
                'status': 'INCOMPLETE',
                'message': 'Batch number not found in CoA'
            })
        
        if 'expiry_date' not in extracted_data or not extracted_data['expiry_date']:
            all_fields_present = False
            validation_results.append({
                'field': 'expiry_date',
                'status': 'INCOMPLETE',
                'message': 'Expiry date not found in CoA'
            })
        else:
            # Check if expired
            try:
                expiry = datetime.strptime(extracted_data['expiry_date'], '%Y-%m-%d')
                if expiry < datetime.now():
                    validation_results.append({
                        'field': 'expiry_date',
                        'status': 'MISMATCH',
                        'message': f'CoA has expired on {extracted_data["expiry_date"]}'
                    })
            except:
                validation_results.append({
                    'field': 'expiry_date',
                    'status': 'INCOMPLETE',
                    'message': 'Invalid expiry date format'
                })
    
    elif doc_type == 'halal':
        # Validate Halal certificate fields
        if 'material_name' not in extracted_data or not extracted_data['material_name']:
            all_fields_present = False
            validation_results.append({
                'field': 'material_name',
                'status': 'INCOMPLETE',
                'message': 'Material name not found in halal certificate'
            })
        
        if 'certificate_number' not in extracted_data or not extracted_data['certificate_number']:
            all_fields_present = False
            validation_results.append({
                'field': 'certificate_number',
                'status': 'INCOMPLETE',
                'message': 'Certificate number not found'
            })
        
        if 'valid_until' not in extracted_data or not extracted_data['valid_until']:
            all_fields_present = False
            validation_results.append({
                'field': 'valid_until',
                'status': 'INCOMPLETE',
                'message': 'Valid until date not found'
            })
        else:
            # Check if expired
            try:
                valid_until = datetime.strptime(extracted_data['valid_until'], '%Y-%m-%d')
                if valid_until < datetime.now():
                    validation_results.append({
                        'field': 'valid_until',
                        'status': 'MISMATCH',
                        'message': f'Halal certificate expired on {extracted_data["valid_until"]}'
                    })
            except:
                validation_results.append({
                    'field': 'valid_until',
                    'status': 'INCOMPLETE',
                    'message': 'Invalid valid until date format'
                })
    
    # Determine overall status
    if not all_fields_present:
        overall_status = 'INCOMPLETE'
    elif any(result['status'] == 'MISMATCH' for result in validation_results):
        overall_status = 'MISMATCH'
    else:
        overall_status = 'PASS'
    
    return {
        'status': overall_status,
        'validation_results': validation_results,
        'explanation': _generate_explanation(
            overall_status, validation_results,
            vendor_name=extracted_data.get('supplier_name', ''),
            material_name=extracted_data.get('material_name', ''),
            reference_number=po_number
        )
    }

def _generate_explanation(status, validation_results, vendor_name='', material_name='', reference_number=''):
    return generate_ai_explanation(
        status=status,
        validation_results=validation_results,
        vendor_name=vendor_name,
        material_name=material_name,
        reference_number=reference_number
    )
