import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon, PrinterIcon, DocumentTextIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";
import { apiFetch } from "../../lib/api";

interface VerificationData {
  session_id: string;
  po_number?: string;
  reference_number?: string;
  vendor_name?: string;
  material_name?: string;
  material_code?: string;
  batch_number?: string;
  quantity?: number | string;
  unit?: string;
  document_date?: string;
  expiry_date?: string;
  packaging_condition?: string;
  storage_condition?: string;
  temperature?: number | string;
  notes?: string;
  doc_type?: string;
  status: "PASS" | "MISMATCH" | "INCOMPLETE";
  explanation?: string;
  verification_time?: string;
  created_at?: string;
  validation_result?: {
    validation_results?: Array<{
      field_name: string;
      status: string;
      explanation: string;
      expected_value?: string;
      actual_value?: string;
    }>;
  };
}

const VerificationResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVerificationData();
  }, [id]);

  const fetchVerificationData = async () => {
    try {
      const response = await apiFetch(`/api/verification/${id}`);
      if (!response.ok) throw new Error("Server error");
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Gagal memuat data verifikasi. Pastikan server berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      surat_jalan: "Surat Jalan",
      coa: "Certificate of Analysis (CoA)",
      halal: "Dokumen Halal",
    };
    return labels[type] || type;
  };

  const translateFieldName = (fieldName: string): string => {
    const map: Record<string, string> = {
      'vendor_name': 'Nama Vendor/Supplier',
      'material_name': 'Nama Bahan Baku',
      'material_code': 'Kode Bahan',
      'batch_number': 'Nomor Batch',
      'quantity': 'Jumlah',
      'unit': 'Satuan',
      'expiry_date': 'Expired Date',
      'storage_condition': 'Kondisi Penyimpanan',
      'packaging_condition': 'Kondisi Kemasan',
      'document_date': 'Tanggal Dokumen',
      'po_number': 'Nomor PO',
      'reference_number': 'Nomor Referensi',
      'summary': 'Ringkasan Verifikasi',
    };
    return map[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const handlePrint = () => {
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tanda Terima - ${data.reference_number || data.po_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #000; padding: 20mm; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 1px; }
    .header h2 { font-size: 13px; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 4px 16px; border-radius: 4px; 
                    font-weight: bold; font-size: 14px; margin: 12px 0;
                    background: #D1FAE5; color: #065F46; border: 1px solid #065F46; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #f5f5f5; font-size: 11px; text-transform: uppercase; padding: 8px; text-align: left; border: 1px solid #ccc; }
    td { padding: 8px; border: 1px solid #ccc; font-size: 12px; }
    .footer { margin-top: 32px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; }
    .signature-line { border-top: 1px solid #000; margin-top: 48px; padding-top: 4px; font-size: 11px; }
    .note { font-size: 10px; color: #666; margin-top: 16px; border-top: 1px solid #ccc; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>TANDA TERIMA BAHAN BAKU</h1>
    <h2>VeriMat — Sistem Verifikasi Dokumen Farmasi</h2>
    <p style="font-size:11px;margin-top:4px;">Diterbitkan: ${new Date().toLocaleDateString('id-ID', {weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
  </div>
  
  <div style="text-align:center">
    <div class="status-badge">✓ DOKUMEN LOLOS VERIFIKASI (PASS)</div>
  </div>
  
  <table>
    <tr><th>Field</th><th>Keterangan</th></tr>
    <tr><td>Nomor Referensi</td><td>${data.reference_number || data.po_number || '-'}</td></tr>
    <tr><td>Nama Vendor</td><td>${data.vendor_name || '-'}</td></tr>
    <tr><td>Kode Bahan</td><td>${data.material_code || '-'}</td></tr>
    <tr><td>Nama Bahan Baku</td><td>${data.material_name || '-'}</td></tr>
    <tr><td>Nomor Batch</td><td>${data.batch_number || '-'}</td></tr>
    <tr><td>Jumlah</td><td>${data.quantity ? data.quantity + ' ' + (data.unit || '') : '-'}</td></tr>
    <tr><td>Expired Date</td><td>${data.expiry_date || '-'}</td></tr>
    <tr><td>Kondisi Kemasan</td><td>${data.packaging_condition || '-'}</td></tr>
    <tr><td>Kondisi Penyimpanan</td><td>${data.storage_condition || '-'}</td></tr>
    <tr><td>Tanggal Verifikasi</td><td>${new Date().toLocaleDateString('id-ID')}</td></tr>
    <tr><td>ID Verifikasi</td><td style="font-family:monospace;font-size:10px">${data.session_id || '-'}</td></tr>
  </table>
  
  <div class="footer">
    <div class="signature-box">
      <p>Diterima oleh (Staf Gudang):</p>
      <div class="signature-line">Nama & Tanda Tangan</div>
    </div>
    <div class="signature-box" style="text-align:right">
      <p>Disetujui oleh (QC):</p>
      <div class="signature-line">Nama & Tanda Tangan</div>
    </div>
  </div>
  
  <div class="note">
    Dokumen ini diverifikasi secara otomatis oleh sistem VeriMat sesuai standar CPOB. 
    ID Sesi: ${data.session_id || '-'}. Cetak dokumen ini sebagai arsip fisik.
  </div>
</body>
</html>
`;
  
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8F6]">
        <AppNavbar />
        <div className="max-w-[800px] mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded mt-6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F7F8F6]">
        <AppNavbar />
        <div className="max-w-[800px] mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
            <p className="text-[#DC2626]">{error || "Data not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = {
    PASS: {
      icon: CheckCircleIcon,
      iconColor: "#16A34A",
      bg: "#D1FAE5",
      border: "#10B981",
      title: "DOKUMEN INI LOLOS VERIFIKASI",
      subtitle: "Semua data yang tertera pada dokumen sesuai dengan Purchase Order internal. Bahan baku dapat diterima.",
    },
    MISMATCH: {
      icon: XCircleIcon,
      iconColor: "#DC2626",
      bg: "#FEE2E2",
      border: "#EF4444",
      title: "DITEMUKAN KETIDAKSESUAIAN",
      subtitle: "Ada data yang tidak cocok antara dokumen dan Purchase Order. Bahan baku TIDAK DAPAT diterima sebelum ketidaksesuaian diselesaikan.",
    },
    INCOMPLETE: {
      icon: ExclamationTriangleIcon,
      iconColor: "#D97706",
      bg: "#FEF3C7",
      border: "#F59E0B",
      title: "DOKUMEN TIDAK LENGKAP",
      subtitle: "Sistem tidak dapat membaca semua data yang diperlukan. Cek kelengkapan dokumen dan ulangi verifikasi.",
    },
  };

  const config = statusConfig[data.status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      <div className="no-print">
        <AppNavbar />
      </div>
      
      <div className="max-w-[800px] mx-auto px-6 py-8 no-print">
        {/* Back Button */}
        <button
          onClick={() => navigate("/verify")}
          className="text-[#0D4B3B] text-[14px] mb-6 hover:underline"
        >
          ← Verifikasi Lain
        </button>

        {/* Result Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
          {/* Summary Banner */}
          <div
            className="rounded-xl p-6 mb-6"
            style={{
              background: config.bg,
              border: `2px solid ${config.border}`,
            }}
          >
            <div className="flex items-start gap-4">
              <StatusIcon className="h-12 w-12 flex-shrink-0" style={{ color: config.iconColor }} />
              <div>
                <h2 className="text-[20px] font-bold text-[#0F1A16] mb-2">{config.title}</h2>
                <p className="text-[14px] text-[#4A5568] leading-relaxed">{config.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {[
              { label: 'Nomor Referensi', value: data.reference_number || data.po_number },
              { label: 'Nama Vendor', value: data.vendor_name },
              { label: 'Kode Bahan', value: data.material_code, badge: true },
              { label: 'Bahan Baku', value: data.material_name },
              { label: 'Nomor Batch', value: data.batch_number, mono: true },
              { label: 'Jumlah', value: data.quantity ? `${data.quantity}${data.unit ? ' ' + data.unit : ''}` : undefined },
              { label: 'Kondisi Kemasan', value: data.packaging_condition },
              { label: 'Kondisi Penyimpanan', value: data.storage_condition },
              { label: 'Tanggal Dokumen', value: data.document_date },
              { label: 'Expired Date (ED)', value: data.expiry_date, highlight: true },
              { label: 'Waktu Verifikasi', value: data.verification_time || data.created_at, format: true },
              { label: 'Session ID', value: data.session_id, mono: true, truncate: true },
            ].map((item, idx) => (
              item.value ? (
                <div key={idx} className="bg-[#F9FAFB] rounded-xl p-4 border border-[#F3F4F6]">
                  <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-medium mb-1.5">
                    {item.label}
                  </p>
                  {item.badge ? (
                    <span className="inline-block bg-[#E8F5F0] text-[#0D4B3B] px-2.5 py-0.5 rounded-md text-[14px] font-bold">
                      {item.value}
                    </span>
                  ) : (
                    <p className={`text-[15px] font-medium text-[#0F1A16] ${item.mono ? 'font-mono' : ''} ${item.truncate ? 'truncate' : ''} ${item.highlight ? 'text-[#0D4B3B]' : ''}`}>
                      {item.format ? formatDate(String(item.value)) : String(item.value)}
                    </p>
                  )}
                </div>
              ) : null
            ))}
          </div>

          {/* Detail Verifikasi Section */}
          <div className="mt-6 bg-[#F9FAFB] rounded-xl p-5">
            <h3 className="font-semibold text-[#0F1A16] mb-4 text-[16px]">Detail Per Field</h3>
            
            {data.status === "PASS" ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-[#F0FDF4] border border-[#BBF7D0]">
                <CheckCircleIcon className="h-6 w-6 text-[#16A34A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-semibold text-[#15803D]">Semua data sesuai dengan Purchase Order</p>
                  <p className="text-[13px] text-[#4A5568] mt-1">
                    Nama vendor, kode bahan, nomor batch, jumlah, dan kondisi penyimpanan telah dicocokkan 
                    dengan data PO internal. Bahan baku dapat diterima dan diproses lebih lanjut.
                  </p>
                </div>
              </div>
            ) : data.validation_result?.validation_results && data.validation_result.validation_results.length > 0 ? (
              <div className="space-y-3">
                {data.validation_result.validation_results
                  .filter(log => log.field_name !== 'summary')
                  .map((log, index) => {
                  const displayName = translateFieldName(log.field_name);
                  
                  const isMatch = log.status === 'MATCH';
                  const isMismatch = log.status === 'MISMATCH';
                  const isNotFound = log.status === 'INCOMPLETE' || log.status === 'NOT_FOUND';
                  
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg p-4 border"
                      style={{
                        borderColor: isMismatch ? '#FECACA' : isNotFound ? '#FDE68A' : '#BBF7D0',
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isMatch ? (
                            <CheckIcon className="h-5 w-5 text-[#16A34A]" />
                          ) : isMismatch ? (
                            <XMarkIcon className="h-5 w-5 text-[#DC2626]" />
                          ) : (
                            <ExclamationTriangleIcon className="h-5 w-5 text-[#D97706]" />
                          )}
                          <span className="font-medium text-[#0F1A16] text-[14px]">{displayName}</span>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-semibold"
                          style={{
                            background: isMatch ? '#DCFCE7' : isMismatch ? '#FEE2E2' : '#FEF3C7',
                            color: isMatch ? '#166534' : isMismatch ? '#991B1B' : '#854D0E',
                          }}
                        >
                          {isMatch ? '✓ Sesuai' : isMismatch ? '✗ Tidak Sesuai' : '⚠ Tidak Ditemukan'}
                        </span>
                      </div>
                      
                      {(log.actual_value || log.expected_value) && (
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <div>
                            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wider mb-1">Nilai Dokumen</p>
                            <p className="text-[13px] font-medium text-[#0F1A16]">{log.actual_value || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wider mb-1">Nilai PO</p>
                            <p className="text-[13px] font-medium text-[#0F1A16]">{log.expected_value || '-'}</p>
                          </div>
                        </div>
                      )}
                      
                      {log.explanation && (
                        <p
                          className="text-[12px] mt-2"
                          style={{ color: isMismatch ? '#DC2626' : isNotFound ? '#D97706' : '#6B7280' }}
                        >
                          {log.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[15px] text-[#374151]">{data.explanation || 'Detail verifikasi tidak tersedia.'}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            {/* Tombol 1: Verifikasi Baru */}
            <button
              onClick={() => navigate("/verify")}
              className="flex-1 bg-[#0D4B3B] text-white rounded-lg px-6 py-3 font-semibold text-[15px] hover:bg-[#0a3d30] transition flex items-center justify-center gap-2"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Verifikasi Baru
            </button>

            {/* Tombol 2: Lihat Audit Trail */}
            <button
              onClick={() => navigate("/audit")}
              className="flex-1 border-[1.5px] border-[#0D4B3B] text-[#0D4B3B] rounded-lg px-6 py-3 font-semibold text-[15px] hover:bg-[#F0FAF7] transition flex items-center justify-center gap-2"
            >
              <DocumentTextIcon className="h-5 w-5" />
              Lihat Audit Trail
            </button>

            {/* Tombol 3: Cetak Tanda Terima - hanya muncul saat PASS */}
            {data.status === "PASS" && (
              <button
                onClick={handlePrint}
                className="flex-1 border-[1.5px] border-[#4B5563] text-[#4B5563] rounded-lg px-6 py-3 font-semibold text-[15px] hover:bg-[#F9FAFB] transition flex items-center justify-center gap-2"
              >
                <PrinterIcon className="h-5 w-5" />
                Cetak Tanda Terima
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationResult;
