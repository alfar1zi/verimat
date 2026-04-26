import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, ClipboardDocumentListIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";

interface AuditRecord {
  session_id: string;
  po_number: string;
  material_name?: string;
  vendor_name?: string;
  doc_type: string;
  status: "PASS" | "MISMATCH" | "INCOMPLETE" | "QUARANTINE";
  verification_time: string;
}

const AuditTrail = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    po_number: "",
    material_name: "",
    vendor_name: "",
    doc_type: "",
    status: "",
  });

  useEffect(() => {
    fetchAuditData();
  }, [filters]);

  const fetchAuditData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.po_number) params.append("po_number", filters.po_number);
      if (filters.material_name) params.append("material_name", filters.material_name);
      if (filters.vendor_name) params.append("vendor_name", filters.vendor_name);
      if (filters.doc_type) params.append("doc_type", filters.doc_type);
      if (filters.status) params.append("status", filters.status);

      const response = await fetch(`${API_URL}/api/audit/list?${params.toString()}`);
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setRecords(data);
    } catch (err) {
      setError("Gagal memuat data. Pastikan server berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    const confirmed = window.confirm(
      'Hapus semua riwayat verifikasi?\n\n' +
      'Semua data audit trail akan dihapus permanen dan ' +
      'tidak dapat dikembalikan. Lanjutkan?'
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/audit/clear`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setRecords([]);
        alert('Semua riwayat verifikasi telah dihapus.');
      } else {
        alert('Gagal menghapus riwayat. Coba lagi.');
      }
    } catch {
      alert('Tidak dapat terhubung ke server.');
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
      coa: "Certificate of Analysis",
      faktur_pajak: "Faktur Pajak",
      invoice: "Invoice / Faktur",
      kwitansi: "Kwitansi",
      halal: "Sertifikat Halal",
      tanda_terima: "Tanda Terima / DO",
      lainnya: "Dokumen Lainnya",
      multi: "Multi-Dokumen",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PASS: "bg-[#DCFCE7] text-[#166534]",
      MISMATCH: "bg-[#FEE2E2] text-[#991B1B]",
      INCOMPLETE: "bg-[#FEF9C3] text-[#854D0E]",
      QUARANTINE: "bg-[#FEF3C7] text-[#92400E]",
    };
    return badges[status as keyof typeof badges] || "";
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      <AppNavbar />
      
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-[#0F1A16]">Audit Trail</h1>
          <p className="text-[14px] text-[#4A5568] mt-1">
            Riwayat semua verifikasi dokumen
          </p>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 mt-6">
          <div className="flex flex-col gap-4">
            {/* Row 1: Nomor Referensi + Status + Buttons */}
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1 lg:flex-[2]">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nomor referensi..."
                  value={filters.po_number}
                  onChange={(e) => setFilters({ ...filters, po_number: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[15px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                />
              </div>
              <div className="flex-1">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[15px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="PASS">PASS</option>
                  <option value="MISMATCH">MISMATCH</option>
                  <option value="INCOMPLETE">INCOMPLETE</option>
                  <option value="QUARANTINE">KARANTINA</option>
                </select>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={fetchAuditData}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white text-[13px] text-[#4A5568] font-medium hover:bg-[#F9FAFB] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Refresh
                </button>
                {Object.values(filters).some(v => v) && (
                  <button
                    onClick={() => setFilters({ po_number: '', material_name: '', vendor_name: '', doc_type: '', status: '' })}
                    className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white text-[13px] text-[#6B7280] font-medium hover:bg-[#F9FAFB] transition-colors"
                  >
                    Reset Filter
                  </button>
                )}
                <button
                  onClick={handleClearHistory}
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#FEE2E2] rounded-lg bg-white text-[13px] text-[#DC2626] font-medium hover:bg-[#FFF5F5] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                    fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Clear History
                </button>
              </div>
            </div>
            {/* Row 2: Bahan Baku + Vendor + Jenis Dokumen */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari nama bahan baku..."
                  value={filters.material_name}
                  onChange={(e) => setFilters({ ...filters, material_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[15px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Cari nama vendor..."
                  value={filters.vendor_name}
                  onChange={(e) => setFilters({ ...filters, vendor_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[15px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                />
              </div>
              <div className="flex-1">
                <select
                  value={filters.doc_type}
                  onChange={(e) => setFilters({ ...filters, doc_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[15px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all bg-white"
                >
                  <option value="">Semua Jenis</option>
                  <option value="surat_jalan">Surat Jalan</option>
                  <option value="coa">Certificate of Analysis (CoA)</option>
                  <option value="faktur_pajak">Faktur Pajak</option>
                  <option value="invoice">Invoice / Faktur Penjualan</option>
                  <option value="kwitansi">Kwitansi</option>
                  <option value="halal">Sertifikat Halal</option>
                  <option value="tanda_terima">Tanda Terima / Delivery Order</option>
                  <option value="lainnya">Dokumen Lainnya</option>
                  <option value="multi">Multi-Dokumen</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] mt-4 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <p className="text-[15px] text-[#DC2626] mb-4">{error}</p>
              <button
                onClick={fetchAuditData}
                className="bg-[#0D4B3B] text-white px-6 py-2.5 rounded-lg font-semibold text-[15px] hover:bg-[#0a3d30] transition"
              >
                Coba Lagi
              </button>
            </div>
          ) : records.length === 0 ? (
            <div style={{
              padding: '60px 24px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#D1D5DB">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                {Object.values(filters).some(v => v) ? 'Tidak ada data yang sesuai filter' : 'Belum Ada Verifikasi'}
              </p>
              <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
                {Object.values(filters).some(v => v) 
                  ? 'Coba ubah atau reset filter pencarian' 
                  : 'Mulai verifikasi dokumen dari halaman Dashboard'}
              </p>
              {!Object.values(filters).some(v => v) && (
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    marginTop: '8px', background: '#0D4B3B', color: 'white',
                    border: 'none', borderRadius: '8px', padding: '10px 20px',
                    fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Mulai Verifikasi →
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase hidden md:table-cell">
                    Session ID
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase">
                    Nomor Referensi
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase">
                    Bahan Baku
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase hidden md:table-cell">
                    Vendor
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase">
                    Jenis Dokumen
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase">
                    Waktu Verifikasi
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.session_id}
                    onClick={() => navigate(`/verification/${record.session_id}`)}
                    className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB] cursor-pointer transition"
                  >
                    <td className="px-5 py-4 font-mono text-[13px] text-[#374151] hidden md:table-cell">
                      {record.session_id.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-4 font-medium text-[#0F1A16]">
                      {record.po_number}
                    </td>
                    <td className="px-5 py-4 text-[#4A5568]">
                      {record.material_name || <span style={{color: '#9CA3AF', fontStyle: 'italic'}}>-</span>}
                    </td>
                    <td className="px-5 py-4 text-[#4A5568] hidden md:table-cell">
                      {record.vendor_name ? (record.vendor_name.length > 18 ? (
                        <span title={record.vendor_name}>{record.vendor_name.slice(0, 18)}...</span>
                      ) : record.vendor_name) : <span style={{color: '#9CA3AF', fontStyle: 'italic'}}>-</span>}
                    </td>
                    <td className="px-5 py-4 text-[#4A5568]">
                      {getDocTypeLabel(record.doc_type)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[12px] font-semibold ${getStatusBadge(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#6B7280] text-[13px]">
                      {formatDate(record.verification_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
