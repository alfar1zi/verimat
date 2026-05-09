import os
import json
import time
import logging
import urllib.request
import urllib.error

logger = logging.getLogger(__name__)

# Azure OpenAI (fallback jika Gemini tidak ada)
AZURE_OPENAI_ENDPOINT = os.environ.get('AZURE_OPENAI_ENDPOINT', '')
AZURE_OPENAI_KEY = os.environ.get('AZURE_OPENAI_KEY', '')
AZURE_OPENAI_DEPLOYMENT = os.environ.get('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')

# Google Gemini (primary)
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
GEMINI_MODEL = 'gemini-1.5-flash'
GEMINI_URL = f'https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent'


def generate_ai_explanation(
    status: str,
    validation_results: list,
    vendor_name: str = '',
    material_name: str = '',
    reference_number: str = ''
) -> str:
    """
    Generate penjelasan verifikasi dalam Bahasa Indonesia.
    Priority: Gemini > Azure OpenAI > Rules-based
    """
    # 1. Coba Gemini dulu
    if GEMINI_API_KEY:
        try:
            return _call_gemini(status, validation_results, vendor_name, 
                                material_name, reference_number)
        except Exception as e:
            logger.warning(f"Gemini unavailable: {e}, trying Azure OpenAI")

    # 2. Coba Azure OpenAI
    if AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY:
        try:
            return _call_azure_openai(status, validation_results, vendor_name,
                                       material_name, reference_number)
        except Exception as e:
            logger.warning(f"Azure OpenAI unavailable: {e}, using rules-based")

    # 3. Fallback rules-based
    return _rule_based_explanation(status, validation_results, 
                                    material_name, reference_number)


def _build_prompt(status, validation_results, vendor_name, 
                   material_name, reference_number):
    """Build prompt yang dipakai oleh semua model."""
    mismatch_details = []
    for r in validation_results:
        if r.get('status') in ('MISMATCH', 'INCOMPLETE'):
            field = r.get('field_name', r.get('field', ''))
            expected = r.get('expected_value', r.get('expected', ''))
            actual = r.get('actual_value', r.get('actual', ''))
            msg = r.get('message', '')
            if expected and actual:
                mismatch_details.append(
                    f"- {field}: dokumen '{actual}' vs PO '{expected}'"
                )
            elif msg:
                mismatch_details.append(f"- {msg}")

    detail_text = '\n'.join(mismatch_details) if mismatch_details else \
                  'Tidak ada ketidaksesuaian spesifik.'

    return f"""Kamu adalah sistem verifikasi dokumen farmasi VeriMat yang membantu 
staf gudang memahami hasil verifikasi bahan baku.

Hasil verifikasi:
- Status: {status}
- Nomor Referensi: {reference_number}
- Vendor: {vendor_name or 'tidak diketahui'}
- Bahan Baku: {material_name or 'tidak diketahui'}
- Detail ketidaksesuaian:
{detail_text}

Berikan penjelasan singkat (2-3 kalimat) dalam Bahasa Indonesia yang:
1. Menjelaskan hasil verifikasi secara jelas untuk staf gudang
2. Menyebut field yang bermasalah jika ada MISMATCH
3. Memberikan rekomendasi tindakan konkret yang harus dilakukan

Jangan gunakan jargon teknis. Tulis seperti menjelaskan kepada petugas gudang.
Hanya balas dengan penjelasannya, tanpa label atau format tambahan."""


def _call_gemini(status, validation_results, vendor_name, 
                  material_name, reference_number):
    """Call Google Gemini API."""
    prompt = _build_prompt(status, validation_results, vendor_name,
                           material_name, reference_number)

    payload = json.dumps({
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {
            'temperature': 0.3,
            'maxOutputTokens': 250,
        }
    }).encode('utf-8')

    url = f'{GEMINI_URL}?key={GEMINI_API_KEY}'
    req = urllib.request.Request(
        url, data=payload,
        headers={'Content-Type': 'application/json'}
    )

    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                result = json.loads(resp.read().decode())
                return result['candidates'][0]['content']['parts'][0]['text'].strip()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 2:
                wait_time = (attempt + 1) * 8  # 8s, 16s
                logger.warning(f"Gemini rate limit, retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            raise
    raise Exception("Gemini API failed after 3 attempts")


def _call_azure_openai(status, validation_results, vendor_name,
                        material_name, reference_number):
    """Call Azure OpenAI (fallback)."""
    prompt = _build_prompt(status, validation_results, vendor_name,
                           material_name, reference_number)

    payload = json.dumps({
        'messages': [{'role': 'user', 'content': prompt}],
        'max_tokens': 300,
        'temperature': 0.3
    }).encode('utf-8')

    url = (f"{AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/deployments/"
           f"{AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-01")

    req = urllib.request.Request(
        url, data=payload,
        headers={
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_KEY
        }
    )

    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read().decode())
        return result['choices'][0]['message']['content'].strip()


def _rule_based_explanation(status, validation_results, 
                              material_name, reference_number):
    """Fallback rules-based tanpa API."""
    field_map = {
        'supplier_name': 'Nama Vendor', 'material_name': 'Nama Bahan Baku',
        'batch_number': 'Nomor Batch', 'quantity': 'Jumlah',
        'po_number': 'Nomor PO', 'expiry_date': 'Expired Date',
        'material_code': 'Kode Bahan', 'unit': 'Satuan',
        'batch_number_cross': 'Nomor Batch (CoA)', 
        'expiry_date_cross': 'Expired Date (CoA)',
    }

    material = material_name or 'bahan baku'
    po = reference_number or ''

    if status == 'PASS':
        return (
            f"Verifikasi {material} berhasil. Semua data pada dokumen sesuai "
            f"dengan Purchase Order {po}. Bahan baku dapat diterima dan "
            f"diproses sesuai prosedur CPOB."
        )

    if status == 'INCOMPLETE':
        missing = [field_map.get(r.get('field', ''), r.get('field', ''))
                   for r in validation_results if r.get('status') == 'INCOMPLETE']
        fields = ', '.join(missing) if missing else 'beberapa field'
        return (
            f"Verifikasi tidak dapat diselesaikan karena {fields} tidak "
            f"ditemukan pada dokumen. Pastikan dokumen terbaca jelas dan "
            f"semua kolom formulir telah diisi sebelum mengulang verifikasi."
        )

    # MISMATCH
    mismatches = [r for r in validation_results if r.get('status') == 'MISMATCH']
    parts = []
    for m in mismatches[:3]:
        field = field_map.get(m.get('field', ''), m.get('field', ''))
        expected = m.get('expected', '')
        actual = m.get('actual', '')
        if field and expected and actual:
            parts.append(f"{field} (dokumen: '{actual}', PO: '{expected}')")

    detail = '; '.join(parts) if parts else 'data tidak sesuai dengan PO'
    return (
        f"Verifikasi GAGAL — ditemukan {len(mismatches)} ketidaksesuaian: "
        f"{detail}. Bahan baku TIDAK DAPAT diterima. Konfirmasi dengan "
        f"supplier dan laporkan ke QC Manager sebelum tindakan lebih lanjut."
    )
