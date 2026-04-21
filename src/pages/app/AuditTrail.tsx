import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, ClipboardDocumentListIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";

interface AuditRecord {
  session_id: string;
  po_number: string;
  doc_type: string;
  status: "PASS" | "MISMATCH" | "INCOMPLETE";
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
      halal: "Dokumen Halal",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PASS: "bg-[#DCFCE7] text-[#166534]",
      MISMATCH: "bg-[#FEE2E2] text-[#991B1B]",
      INCOMPLETE: "bg-[#FEF9C3] text-[#854D0E]",
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
          <div className="flex justify-between items-center mb-4">
            <div className="grid grid-cols-3 gap-4 flex-1">
            {/* Filter 1 - PO Number */}
            <div>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nomor PO..."
                  value={filters.po_number}
                  onChange={(e) => setFilters({ ...filters, po_number: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[15px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                />
              </div>
            </div>

            {/* Filter 2 - Document Type */}
            <div>
              <select
                value={filters.doc_type}
                onChange={(e) => setFilters({ ...filters, doc_type: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[15px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
              >
                <option value="">Semua Jenis</option>
                <option value="surat_jalan">Surat Jalan</option>
                <option value="coa">Certificate of Analysis</option>
                <option value="halal">Dokumen Halal</option>
              </select>
            </div>

            {/* Filter 3 - Status */}
            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[15px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
              >
                <option value="">Semua Status</option>
                <option value="PASS">PASS</option>
                <option value="MISMATCH">MISMATCH</option>
                <option value="INCOMPLETE">INCOMPLETE</option>
              </select>
            </div>
            </div>
            <button
              onClick={fetchAuditData}
              className="flex items-center gap-2 border border-[#E5E7EB] rounded-lg px-4 py-2.5 text-sm hover:bg-[#F9FAFB] transition ml-4"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </button>
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
            <div className="py-16 px-6 text-center">
              <ClipboardDocumentListIcon className="h-14 w-14 mx-auto text-[#D1D5DB] mb-4" />
              <p className="text-[16px] font-semibold text-[#374151] mb-2">Belum Ada Verifikasi</p>
              <p className="text-[14px] text-[#9CA3AF] mb-1">
                Mulai verifikasi dokumen pertama Anda dari Dashboard
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-[#0D4B3B] text-white px-5 py-2.5 rounded-lg font-semibold text-[15px] hover:bg-[#0a3d30] transition mt-5"
              >
                Mulai Verifikasi →
              </button>
            </div>
          ) : (
            <table className="w-full">
              {/* Table Header */}
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase">
                    Session ID
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-[#6B7280] tracking-[0.05em] uppercase">
                    Nomor PO
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
                    <td className="px-5 py-4 font-mono text-[13px] text-[#374151]">
                      {record.session_id.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-4 font-medium text-[#0F1A16]">
                      {record.po_number}
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
