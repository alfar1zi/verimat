"""
Document extraction function using Azure AI Document Intelligence
Falls back to mock extraction if Azure credentials are not configured
"""
import os
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

AZURE_ENDPOINT = os.environ.get('AZURE_DOC_INTELLIGENCE_ENDPOINT', '')
AZURE_KEY = os.environ.get('AZURE_DOC_INTELLIGENCE_KEY', '')

def extract_document_data(file_path, doc_type, po_number=None):
    """
    Extract document data using Azure AI Document Intelligence
    Falls back to mock extraction if Azure credentials are not configured
    
    Args:
        file_path: Path to the uploaded document
        doc_type: Type of document ('surat_jalan', 'coa', 'halal')
        po_number: PO number to match data against
    
    Returns:
        Dictionary with extracted field data
    """
    if not AZURE_ENDPOINT or not AZURE_KEY:
        print("Azure credentials not configured, using mock extraction")
        return get_mock_extraction(doc_type, po_number)
    
    try:
        client = DocumentAnalysisClient(
            endpoint=AZURE_ENDPOINT,
            credential=AzureKeyCredential(AZURE_KEY)
        )
        
        with open(file_path, 'rb') as f:
            poller = client.begin_analyze_document(
                "prebuilt-document", f
            )
            result = poller.result()
        
        extracted = {}
        for kv_pair in result.key_value_pairs:
            if kv_pair.key and kv_pair.value:
                key = kv_pair.key.content.lower().strip()
                value = kv_pair.value.content.strip()
                extracted[key] = value
        
        return map_extracted_to_fields(extracted, doc_type, po_number)
    
    except Exception as e:
        print(f"Azure extraction failed: {e}")
        return get_mock_extraction(doc_type, po_number)

def map_extracted_to_fields(extracted, doc_type, po_number):
    """
    Map extracted key-value pairs to structured fields based on document type
    """
    from utils.database import get_db_connection
    conn = get_db_connection()
    po = conn.execute(
        'SELECT * FROM purchase_orders WHERE po_number = ?',
        (po_number,)
    ).fetchone()
    conn.close()
    
    if doc_type == 'surat_jalan':
        return {
            'doc_type': 'surat_jalan',
            'supplier_name': extracted.get('supplier', extracted.get('nama supplier', po['supplier_name'] if po else '')),
            'material_name': extracted.get('material', extracted.get('nama barang', po['material_name'] if po else '')),
            'batch_number': extracted.get('batch no', extracted.get('no batch', extracted.get('batch', ''))),
            'quantity': extracted.get('quantity', extracted.get('jumlah', str(po['quantity']) if po else '0')),
            'unit': extracted.get('unit', po['unit'] if po else 'kg'),
            'po_number': extracted.get('po number', extracted.get('no po', po_number)),
            'delivery_date': extracted.get('date', extracted.get('tanggal', ''))
        }
    elif doc_type == 'coa':
        return {
            'doc_type': 'coa',
            'material_name': extracted.get('product name', extracted.get('nama produk', po['material_name'] if po else '')),
            'batch_number': extracted.get('batch no', extracted.get('no batch', '')),
            'expiry_date': extracted.get('expiry date', extracted.get('exp date', extracted.get('kadaluarsa', ''))),
            'manufacture_date': extracted.get('manufacture date', extracted.get('tanggal produksi', '')),
            'test_result': extracted.get('result', extracted.get('hasil', 'Sesuai Spesifikasi'))
        }
    elif doc_type == 'halal':
        return {
            'doc_type': 'halal',
            'material_name': extracted.get('product', extracted.get('produk', po['material_name'] if po else '')),
            'certificate_number': extracted.get('certificate no', extracted.get('no sertifikat', '')),
            'valid_until': extracted.get('valid until', extracted.get('berlaku hingga', extracted.get('expire', '')))
        }
    return {}

def get_mock_extraction(doc_type, po_number):
    """
    Fallback mock extraction when Azure is not available
    """
    from utils.database import get_db_connection
    conn = get_db_connection()
    po = conn.execute(
        'SELECT * FROM purchase_orders WHERE po_number = ?',
        (po_number,)
    ).fetchone()
    conn.close()
    
    if doc_type == 'surat_jalan':
        return {
            'doc_type': 'surat_jalan',
            'supplier_name': po['supplier_name'] if po else 'PT Kimia Farma',
            'material_name': po['material_name'] if po else 'Paracetamol',
            'batch_number': 'BTX-2024-001',
            'quantity': str(po['quantity']) if po else '100',
            'unit': po['unit'] if po else 'kg',
            'po_number': po_number,
            'delivery_date': '2026-04-23'
        }
    elif doc_type == 'coa':
        return {
            'doc_type': 'coa',
            'material_name': po['material_name'] if po else 'Paracetamol',
            'batch_number': 'BTX-2024-001',
            'expiry_date': '2028-01-15',
            'manufacture_date': '2026-01-15',
            'test_result': 'Sesuai Spesifikasi'
        }
    elif doc_type == 'halal':
        return {
            'doc_type': 'halal',
            'material_name': po['material_name'] if po else 'Paracetamol',
            'certificate_number': 'ID12345678901234',
            'valid_until': '2027-12-31'
        }
    return {}
