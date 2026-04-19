"""
Mock document extraction function
Returns structured sample data for testing
Replace with Azure AI Document Intelligence integration later
"""
from models.purchase_order import get_purchase_order

def extract_document_data(filepath, doc_type, po_number=None):
    """
    Mock extraction function that returns sample structured data
    based on document type and PO number
    
    Args:
        filepath: Path to the uploaded document
        doc_type: Type of document ('surat_jalan', 'coa', 'halal')
        po_number: PO number to match data against
    
    Returns:
        Dictionary with extracted field data
    """
    # Get PO data from database
    po_data = get_purchase_order(po_number) if po_number else None
    
    # Default values if PO not found
    supplier = po_data.get('supplier_name', 'PT Kimia Farma') if po_data else 'PT Kimia Farma'
    material = po_data.get('material_name', 'Paracetamol') if po_data else 'Paracetamol'
    quantity = po_data.get('quantity', 100) if po_data else 100
    unit = po_data.get('unit', 'kg') if po_data else 'kg'
    
    if doc_type == 'surat_jalan':
        return {
            'doc_type': 'surat_jalan',
            'supplier_name': supplier,
            'material_name': material,
            'batch_number': 'BTX-2024-001',
            'quantity': str(quantity),
            'unit': unit,
            'delivery_date': '2026-04-19',
            'po_number': po_number if po_number else 'PO-2024-001'
        }
    
    elif doc_type == 'coa':
        return {
            'doc_type': 'coa',
            'material_name': material,
            'batch_number': 'BTX-2024-001',
            'manufacture_date': '2026-01-15',
            'expiry_date': '2028-01-15',
            'test_result': 'Sesuai Spesifikasi',
            'qc_signature': 'Dr. Ahmad QC'
        }
    
    elif doc_type == 'halal':
        return {
            'doc_type': 'halal',
            'material_name': material,
            'certificate_number': 'ID12345678901234',
            'valid_until': '2027-12-31'
        }
    
    else:
        return {
            'doc_type': doc_type,
            'error': 'Unknown document type'
        }
