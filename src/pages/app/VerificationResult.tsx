import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon, PrinterIcon } from "@heroicons/react/24/outline";
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
            
            {data.validation_result?.validation_results && data.validation_result.validation_results.length > 0 ? (
              <div className="space-y-3">
                {data.validation_result.validation_results.map((log, index) => {
                  const fieldNameMap: Record<string, string> = {
                    reference_number: "Nomor Referensi",
                    vendor_name: "Nama Vendor",
                    material_name: "Nama Bahan",
                    material_code: "Kode Bahan",
                    batch_number: "Nomor Batch",
                    quantity: "Jumlah",
                    expiry_date: "Tanggal Kedaluwarsa",
                    document_date: "Tanggal Dokumen",
                    packaging_condition: "Kondisi Kemasan",
                    storage_condition: "Kondisi Penyimpanan",
                  };
                  const displayName = fieldNameMap[log.field_name] || log.field_name.replace(/_/g, ' ');
                  
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
            ) : data.status === "PASS" ? (
              <div className="flex items-center gap-2 text-[15px] text-[#374151]">
                <CheckIcon className="h-5 w-5 text-[#16A34A] flex-shrink-0" />
                <span>Semua field dokumen telah diverifikasi dan sesuai dengan data Purchase Order internal.</span>
              </div>
            ) : (
              <p className="text-[15px] text-[#374151]">{data.explanation || 'Tidak ada detail tersedia.'}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => navigate("/verify")}
              className="flex-1 bg-[#0D4B3B] text-white rounded-lg px-6 py-3 font-semibold text-[15px] hover:bg-[#0a3d30] transition"
            >
              ← Verifikasi Baru
            </button>
            {data.status === "PASS" && (
              <button
                onClick={() => window.print()}
                className="flex-1 border-[1.5px] border-[#0D4B3B] text-[#0D4B3B] rounded-lg px-6 py-3 font-semibold text-[15px] hover:bg-[#F7F8F6] transition flex items-center justify-center gap-2"
              >
                <PrinterIcon className="h-5 w-5" />
                Cetak Tanda Terima
              </button>
            )}
          </div>
        </div>

        {/* Print Receipt Section - Only visible when printing */}
        <div className="print-only hidden">
          <div className="p-8 border-2 border-black">
            {/* Header */}
            <div className="text-center mb-6 border-b-2 border-black pb-4">
              <h1 className="text-2xl font-bold">TANDA TERIMA BAHAN BAKU</h1>
              <p className="text-sm mt-1">VeriMat - Sistem Verifikasi Dokumen Farmasi</p>
              <p className="text-xs mt-2">{formatDate(data.verification_time || data.created_at || '')}</p>
            </div>

            {/* Summary Table */}
            <table className="w-full mb-6">
              <tbody>
                <tr>
                  <td className="py-2 font-semibold">Nama Bahan:</td>
                  <td className="py-2">{data.material_name || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Kode Bahan:</td>
                  <td className="py-2">{data.material_code || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Nomor Batch:</td>
                  <td className="py-2">{data.batch_number || '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Jumlah:</td>
                  <td className="py-2">{data.quantity ? `${data.quantity} ${data.unit || ''}` : '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold">Status:</td>
                  <td className="py-2 font-bold text-green-600">{data.status}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t-2 border-black">
              <div className="flex justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold">Diterima oleh:</p>
                  <div className="border-b border-black w-48 mt-2"></div>
                </div>
                <div>
                  <p className="text-sm font-semibold">Tanggal:</p>
                  <div className="border-b border-black w-32 mt-2"></div>
                </div>
              </div>
              <p className="text-xs text-center mt-4">
                Dokumen ini diverifikasi secara otomatis oleh sistem VeriMat. ID Verifikasi: {data.session_id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default VerificationResult;
