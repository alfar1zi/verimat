"""
Document extraction function using Azure AI Document Intelligence
Falls back to mock extraction if Azure credentials are not configured
"""
import os
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential
from models.purchase_order import get_purchase_order_by_number

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
    po = get_purchase_order_by_number(po_number)
    
    if doc_type == 'surat_jalan':
        return {
            'doc_type': 'surat_jalan',
            'supplier_name': extracted.get('supplier', extracted.get('nama supplier', '')),
            'material_name': extracted.get('material', extracted.get('nama barang', '')),
            'batch_number': extracted.get('batch no', extracted.get('no batch', extracted.get('batch', ''))),
            'quantity': extracted.get('quantity', extracted.get('jumlah', '')),
            'unit': extracted.get('unit', ''),
            'po_number': extracted.get('po number', extracted.get('no po', po_number)),
            'delivery_date': extracted.get('date', extracted.get('tanggal', ''))
        }
    elif doc_type == 'coa':
        return {
            'doc_type': 'coa',
            'material_name': extracted.get('product name', extracted.get('nama produk', '')),
            'batch_number': extracted.get('batch no', extracted.get('no batch', '')),
            'expiry_date': extracted.get('expiry date', extracted.get('exp date', extracted.get('kadaluarsa', ''))),
            'manufacture_date': extracted.get('manufacture date', extracted.get('tanggal produksi', '')),
            'test_result': extracted.get('result', extracted.get('hasil', 'Sesuai Spesifikasi'))
        }
    elif doc_type == 'halal':
        return {
            'doc_type': 'halal',
            'material_name': extracted.get('product', extracted.get('produk', '')),
            'certificate_number': extracted.get('certificate no', extracted.get('no sertifikat', '')),
            'valid_until': extracted.get('valid until', extracted.get('berlaku hingga', extracted.get('expire', '')))
        }
    return {}

def get_mock_extraction(doc_type, po_number):
    """
    Fallback ketika Azure tidak tersedia.
    Return empty extraction — jangan isi dengan PO data.
    Form data dari user akan menjadi fallback melalui upload.py.
    """
    if doc_type == 'surat_jalan':
        return {
            'doc_type': 'surat_jalan',
            'supplier_name': '',   # kosong — biarkan form_data mengisi
            'material_name': '',
            'batch_number': '',
            'quantity': '',
            'unit': '',
            'po_number': '',
            'delivery_date': '',
            '_source': 'mock'      # flag: Azure tidak aktif
        }
    elif doc_type == 'coa':
        return {
            'doc_type': 'coa',
            'material_name': '',
            'batch_number': '',
            'expiry_date': '',
            'manufacture_date': '',
            'test_result': '',
            '_source': 'mock'
        }
    elif doc_type == 'halal':
        return {
            'doc_type': 'halal',
            'material_name': '',
            'certificate_number': '',
            'valid_until': '',
            '_source': 'mock'
        }
    return {'_source': 'mock'}
