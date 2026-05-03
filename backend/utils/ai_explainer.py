import os
import logging

logger = logging.getLogger(__name__)

AZURE_OPENAI_ENDPOINT = os.environ.get('AZURE_OPENAI_ENDPOINT', '')
AZURE_OPENAI_KEY = os.environ.get('AZURE_OPENAI_KEY', '')
AZURE_OPENAI_DEPLOYMENT = os.environ.get('AZURE_OPENAI_DEPLOYMENT', 'gpt-4o')

def generate_ai_explanation(
    status: str,
    validation_results: list,
    vendor_name: str = '',
    material_name: str = '',
    reference_number: str = ''
) -> str:
    """
    Generate intelligent explanation using Azure OpenAI.
    Falls back to rule-based explanation if Azure OpenAI is unavailable.
    """
    if AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY:
        try:
            return _call_azure_openai(
                status, validation_results, vendor_name, material_name, reference_number
            )
        except Exception as e:
            logger.warning(f"Azure OpenAI unavailable, using fallback: {e}")

    return _rule_based_explanation(status, validation_results)


def _call_azure_openai(
    status: str,
    validation_results: list,
    vendor_name: str,
    material_name: str,
    reference_number: str
) -> str:
    """Call Azure OpenAI GPT-4o for contextual explanation in Bahasa Indonesia."""
    import urllib.request
    import json

    mismatch_details = []
    for r in validation_results:
        if r.get('status') in ('MISMATCH', 'INCOMPLETE'):
            mismatch_details.append(
                f"- Field '{r.get('field_name', r.get('field', ''))}': "
                f"Ekspektasi '{r.get('expected_value', r.get('expected', ''))}', "
                f"Ditemukan '{r.get('actual_value', r.get('actual', ''))}'"
            )

    detail_text = '\n'.join(mismatch_details) if mismatch_details else 'Tidak ada ketidaksesuaian'

    prompt = f"""Kamu adalah sistem verifikasi dokumen farmasi yang membantu staf gudang memahami hasil verifikasi.

Hasil verifikasi dokumen:
- Status: {status}
- Nomor Referensi: {reference_number}
- Vendor: {vendor_name}
- Bahan Baku: {material_name}
- Detail:
{detail_text}

Berikan penjelasan singkat (2-3 kalimat) dalam Bahasa Indonesia yang:
1. Menjelaskan apa yang terjadi secara jelas
2. Menyebutkan field yang bermasalah (jika ada)
3. Memberikan rekomendasi tindakan konkret

Jangan gunakan jargon teknis. Fokus pada tindakan yang harus dilakukan staf gudang."""

    payload = json.dumps({
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
        "temperature": 0.3
    }).encode('utf-8')

    url = f"{AZURE_OPENAI_ENDPOINT.rstrip('/')}/openai/deployments/{AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-01"

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_KEY
        }
    )

    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read().decode('utf-8'))
        return result['choices'][0]['message']['content'].strip()


def _rule_based_explanation(status: str, validation_results: list) -> str:
    """Fallback rule-based explanation when Azure OpenAI is unavailable."""
    if status == 'PASS':
        return 'Semua field dokumen telah diverifikasi dan sesuai dengan data Purchase Order internal.'
    elif status == 'INCOMPLETE':
        incomplete = [r.get('field_name', r.get('field', '')) for r in validation_results if r.get('status') == 'INCOMPLETE']
        return f"Dokumen tidak lengkap. Field yang tidak terbaca: {', '.join(incomplete)}. Periksa kualitas scan dan upload ulang."
    else:
        mismatches = [r.get('message', '') for r in validation_results if r.get('status') == 'MISMATCH']
        return f"Terdapat ketidaksesuaian dengan Purchase Order: {'; '.join(mismatches[:2])}. Hubungi supplier untuk klarifikasi."
