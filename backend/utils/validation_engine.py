from datetime import datetime
from models.purchase_order import get_purchase_order

def validate_document(extracted_data, po_number):
    """
    Deterministic rules engine for document validation
    Returns: PASS, MISMATCH, or INCOMPLETE
    """
    # Get PO data
    po = get_purchase_order(po_number)
    
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
        # Validate Surat Jalan fields
        if 'supplier_name' not in extracted_data or not extracted_data['supplier_name']:
            all_fields_present = False
            validation_results.append({
                'field': 'supplier_name',
                'status': 'INCOMPLETE',
                'message': 'Supplier name not found in document'
            })
        elif extracted_data['supplier_name'] != po['supplier_name']:
            validation_results.append({
                'field': 'supplier_name',
                'status': 'MISMATCH',
                'message': f"Supplier mismatch: expected '{po['supplier_name']}', got '{extracted_data['supplier_name']}'"
            })
        
        if 'material_name' not in extracted_data or not extracted_data['material_name']:
            all_fields_present = False
            validation_results.append({
                'field': 'material_name',
                'status': 'INCOMPLETE',
                'message': 'Material name not found in document'
            })
        elif extracted_data['material_name'] != po['material_name']:
            validation_results.append({
                'field': 'material_name',
                'status': 'MISMATCH',
                'message': f"Material mismatch: expected '{po['material_name']}', got '{extracted_data['material_name']}'"
            })
        
        if 'batch_number' not in extracted_data or not extracted_data['batch_number']:
            all_fields_present = False
            validation_results.append({
                'field': 'batch_number',
                'status': 'INCOMPLETE',
                'message': 'Batch number not found in document'
            })
        
        if 'quantity' not in extracted_data or not extracted_data['quantity']:
            all_fields_present = False
            validation_results.append({
                'field': 'quantity',
                'status': 'INCOMPLETE',
                'message': 'Quantity not found in document'
            })
        elif float(extracted_data['quantity']) != po['quantity']:
            validation_results.append({
                'field': 'quantity',
                'status': 'MISMATCH',
                'message': f"Quantity mismatch: expected {po['quantity']}, got {extracted_data['quantity']}"
            })
        
        if 'po_number' not in extracted_data or not extracted_data['po_number']:
            all_fields_present = False
            validation_results.append({
                'field': 'po_number',
                'status': 'INCOMPLETE',
                'message': 'PO number not found in document'
            })
        elif extracted_data['po_number'] != po_number:
            validation_results.append({
                'field': 'po_number',
                'status': 'MISMATCH',
                'message': f"PO number mismatch: expected '{po_number}', got '{extracted_data['po_number']}'"
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
        elif extracted_data['material_name'] != po['material_name']:
            validation_results.append({
                'field': 'material_name',
                'status': 'MISMATCH',
                'message': f"Material mismatch: expected '{po['material_name']}', got '{extracted_data['material_name']}'"
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
        'explanation': _generate_explanation(overall_status, validation_results)
    }

def _generate_explanation(status, validation_results):
    """Generate human-readable explanation"""
    if status == 'PASS':
        return 'Semua field dokumen telah diverifikasi dan sesuai dengan data Purchase Order internal.'
    elif status == 'INCOMPLETE':
        incomplete_fields = [r['field'] for r in validation_results if r['status'] == 'INCOMPLETE']
        return f"Satu atau lebih field wajib tidak dapat dibaca: {', '.join(incomplete_fields)}. Periksa kualitas dokumen dan upload ulang."
    else:
        mismatch_messages = [r['message'] for r in validation_results if r['status'] == 'MISMATCH']
        return f"Field berikut tidak sesuai dengan Purchase Order: {', '.join(mismatch_messages)}"
