import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlassIcon, ClipboardDocumentListIcon, ArrowPathIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";
import { apiFetch } from "../../lib/api";
import * as XLSX from 'xlsx';

interface AuditRecord {
  session_id: string;
  po_number: string;
  material_name?: string;
  material_code?: string;
  batch_number?: string;
  vendor_name?: string;
  doc_type: string;
  status: "PASS" | "MISMATCH" | "INCOMPLETE" | "QUARANTINE";
  expiry_date?: string;
  packaging_condition?: string;
  verification_time: string;
}

const formatDocType = (docType: string): string => {
  if (!docType) return '-';
  
  const typeMap: Record<string, string> = {
    'surat_jalan': 'Surat Jalan',
    'coa': 'CoA',
    'faktur': 'Faktur/Invoice',
    'dokumen_lain': 'Dok. Lain',
    'dokumen_lain:halal': 'Sertifikat Halal',
    'dokumen_lain:msds': 'MSDS',
    'dokumen_lain:kwitansi': 'Kwitansi',
    'dokumen_lain:tanda_terima': 'Tanda Terima',
    'dokumen_lain:lainnya': 'Dok. Lainnya',
  };
  
  // Handle comma-separated multi-doc
  const types = docType.split(',');
  if (types.length > 1) {
    const labels = types.map(t => typeMap[t.trim()] || t.trim()).join(' + ');
    return labels;
  }
  
  return typeMap[docType] || docType;
};

const AuditTrail = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  const [filters, setFilters] = useState({
    po_number: "",
    material_name: "",
    material_code: "",
    batch_number: "",
    vendor_name: "",
    doc_type: "",
    status: "",
    date_from: "",
    date_to: "",
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
      if (filters.material_code) params.append("material_code", filters.material_code);
      if (filters.batch_number) params.append("batch_number", filters.batch_number);
      if (filters.vendor_name) params.append("vendor_name", filters.vendor_name);
      if (filters.doc_type) params.append("doc_type", filters.doc_type);
      if (filters.status) params.append("status", filters.status);
      if (filters.date_from) params.append("date_from", filters.date_from);
      if (filters.date_to) params.append("date_to", filters.date_to);

      const response = await apiFetch(`/api/audit/list?${params.toString()}`);
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
      const response = await apiFetch('/api/audit/clear', {
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

  const handleExportToExcel = () => {
    const hasActiveFilters = Object.values(filters).some(v => v);
    
    if (hasActiveFilters) {
      setShowExportConfirm(true);
    } else {
      performExport();
    }
  };

  const performExport = () => {
    setShowExportConfirm(false);

    // Get username from localStorage
    const username = localStorage.getItem("username") || "Admin";
    
    // Format current date for filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const exportDate = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create filter description
    const filterDescriptions: string[] = [];
    if (filters.po_number) filterDescriptions.push(`Ref: ${filters.po_number}`);
    if (filters.material_name) filterDescriptions.push(`Bahan: ${filters.material_name}`);
    if (filters.material_code) filterDescriptions.push(`Kode: ${filters.material_code}`);
    if (filters.batch_number) filterDescriptions.push(`Batch: ${filters.batch_number}`);
    if (filters.vendor_name) filterDescriptions.push(`Vendor: ${filters.vendor_name}`);
    if (filters.status) filterDescriptions.push(`Status: ${filters.status}`);
    if (filters.doc_type) filterDescriptions.push(`Jenis: ${filters.doc_type}`);
    if (filters.date_from) filterDescriptions.push(`Dari: ${filters.date_from}`);
    if (filters.date_to) filterDescriptions.push(`Sampai: ${filters.date_to}`);
    const filterDesc = filterDescriptions.length > 0 ? filterDescriptions.join(', ') : 'Tidak ada';

    // Format date for Excel (DD/MM/YYYY HH:MM)
    const formatExcelDate = (dateStr: string) => {
      if (!dateStr) return '-';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '-';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      } catch {
        return '-';
      }
    };

    // Prepare data for export
    const exportData = records.map((record) => ({
      "Tanggal & Waktu": formatExcelDate(record.verification_time),
      "Nomor Referensi": record.po_number || '-',
      "Vendor": record.vendor_name || '-',
      "Nama Bahan": record.material_name || '-',
      "Kode Bahan": record.material_code || '-',
      "Nomor Batch": record.batch_number || '-',
      "Jumlah": '-', // Not available in current data structure
      "Satuan": '-', // Not available in current data structure
      "Status": record.status,
      "Catatan Mismatch": record.status === 'MISMATCH' ? 'Perlu review manual' : '-',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create header rows
    const headerRows = [
      ["LAPORAN AUDIT TRAIL VERIFIKASI BAHAN BAKU"],
      [`Diekspor oleh: ${username} | Tanggal Export: ${exportDate} | Filter Aktif: ${filterDesc}`],
      [],
      Object.keys(exportData[0] || {}),
    ];

    // Combine header rows with data
    const wsData = [...headerRows, ...exportData.map(row => Object.values(row))];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Apply styles to header rows
    // Row 1: Title
    ws['A1'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: 'center' }
    };
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

    // Row 2: Metadata
    ws['A2'].s = {
      font: { sz: 10 },
      alignment: { horizontal: 'left' }
    };
    ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 9 } });

    // Row 4: Column headers
    const headerRow = 3; // 0-indexed, so row 4
    const headers = Object.keys(exportData[0] || {});
    headers.forEach((header, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: colIndex });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "F3F4F6" } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    });

    // Apply color to status cells
    const statusColIndex = headers.indexOf("Status");
    exportData.forEach((row, rowIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow + 1 + rowIndex, c: statusColIndex });
      if (ws[cellRef]) {
        const status = row.Status;
        let fillColor = "FFFFFF";
        if (status === "PASS") fillColor = "DCFCE7";
        else if (status === "MISMATCH") fillColor = "FEE2E2";
        else if (status === "INCOMPLETE") fillColor = "F3F4F6";
        else if (status === "QUARANTINE") fillColor = "FEF3C7";
        
        ws[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: fillColor } },
          alignment: { horizontal: 'center' }
        };
      }
    });

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Tanggal & Waktu
      { wch: 20 }, // Nomor Referensi
      { wch: 25 }, // Vendor
      { wch: 30 }, // Nama Bahan
      { wch: 12 }, // Kode Bahan
      { wch: 15 }, // Nomor Batch
      { wch: 10 }, // Jumlah
      { wch: 10 }, // Satuan
      { wch: 12 }, // Status
      { wch: 25 }, // Catatan Mismatch
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Audit Trail");

    // Generate filename and download
    const filename = `AuditTrail_VeriMat_${dateStr}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] overflow-x-hidden">
      <AppNavbar />
      
      {/* Export Confirmation Dialog */}
      {showExportConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-[18px] font-bold text-[#0F1A16] mb-3">Konfirmasi Export</h3>
            <p className="text-[14px] text-[#6B7280] mb-6">
              Mengekspor {records.length} baris data dengan filter yang aktif. Lanjutkan?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExportConfirm(false)}
                className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-[13px] font-medium text-[#4A5568] hover:bg-[#F9FAFB] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={performExport}
                className="px-4 py-2 bg-[#0D4B3B] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a3d30] transition-colors"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-[1000px] mx-auto w-full" style={{ padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)', boxSizing: 'border-box' }}>
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-[#0F1A16]">Audit Trail</h1>
          <p className="text-[14px] text-[#4A5568] mt-1">
            Riwayat semua verifikasi dokumen
          </p>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] mt-6 animate-fade-in-up" style={{ padding: 'clamp(12px, 3vw, 24px)' }}>
          <div className="flex flex-col gap-3">
            {/* Row 1: Pencarian teks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Nomor Referensi */}
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">
                  Nomor Referensi
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nomor referensi..."
                    value={filters.po_number}
                    onChange={(e) => setFilters({ ...filters, po_number: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                  />
                </div>
              </div>
              {/* Nama Bahan Baku */}
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">
                  Nama Bahan Baku
                </label>
                <input
                  type="text"
                  placeholder="Nama bahan baku..."
                  value={filters.material_name}
                  onChange={(e) => setFilters({ ...filters, material_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                />
              </div>
              {/* Kode Bahan (e.g. P1) */}
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">
                  Kode Bahan
                </label>
                <input
                  type="text"
                  placeholder="Kode bahan (P1, A1...)"
                  value={filters.material_code}
                  onChange={(e) => setFilters({ ...filters, material_code: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                />
              </div>
            </div>

            {/* Row 2: Filter lanjutan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">Nama Vendor / Supplier</label>
                <input type="text" placeholder="Nama vendor/supplier..." value={filters.vendor_name} onChange={(e) => setFilters({ ...filters, vendor_name: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">Nomor Batch</label>
                <input type="text" placeholder="Nomor batch..." value={filters.batch_number} onChange={(e) => setFilters({ ...filters, batch_number: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">Jenis Dokumen</label>
                <select value={filters.doc_type} onChange={(e) => setFilters({ ...filters, doc_type: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all bg-white">
                  <option value="">Semua Jenis Dokumen</option>
                  <option value="surat_jalan">Surat Jalan / Delivery Note</option>
                  <option value="coa">Certificate of Analysis (CoA)</option>
                  <option value="faktur">Faktur Pajak / Invoice</option>
                  <option value="dokumen_lain">Dokumen Lain (Halal/MSDS/dll)</option>
                </select>
              </div>
            </div>

            {/* Row 3: Status + Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">Status Verifikasi</label>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all bg-white">
                  <option value="">Semua Status</option>
                  <option value="PASS">PASS</option>
                  <option value="MISMATCH">MISMATCH</option>
                  <option value="INCOMPLETE">INCOMPLETE</option>
                  <option value="QUARANTINE">KARANTINA</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">Tanggal Dari</label>
                <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#374151] mb-1 uppercase tracking-wide">Tanggal Sampai</label>
                <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="w-full px-4 py-2.5 border border-[#E5E7EB] rounded-lg text-[14px] focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all" />
              </div>
            </div>

            {/* Row 4: Action Buttons */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button onClick={handleExportToExcel} disabled={records.length === 0} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-[#0D4B3B] rounded-lg bg-white text-[13px] text-[#0D4B3B] font-medium hover:bg-[#F0FAF7] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                <DocumentArrowDownIcon className="h-4 w-4" />
                Export ke Excel
              </button>
              <button onClick={fetchAuditData} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white text-[13px] text-[#4A5568] font-medium hover:bg-[#F9FAFB] transition-colors whitespace-nowrap">
                <ArrowPathIcon className="h-4 w-4" />
                Refresh
              </button>
              {Object.values(filters).some(v => v) && (
                <button onClick={() => setFilters({ po_number: '', material_name: '', material_code: '', batch_number: '', vendor_name: '', doc_type: '', status: '', date_from: '', date_to: '' })} className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg bg-white text-[13px] text-[#6B7280] font-medium hover:bg-[#F9FAFB] transition-colors whitespace-nowrap">
                  Reset
                </button>
              )}
              <button onClick={handleClearHistory} className="flex items-center gap-2 px-4 py-2.5 border border-[#FEE2E2] rounded-lg bg-white text-[13px] text-[#DC2626] font-medium hover:bg-[#FFF5F5] transition-colors whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>

            {/* Active filter summary - tampil jika ada filter aktif */}
            {Object.values(filters).some(v => v) && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-[#F3F4F6]">
                <span className="text-[12px] text-[#6B7280]">Filter aktif:</span>
                {filters.po_number && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Ref: {filters.po_number}</span>}
                {filters.material_name && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Bahan: {filters.material_name}</span>}
                {filters.material_code && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Kode: {filters.material_code}</span>}
                {filters.batch_number && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Batch: {filters.batch_number}</span>}
                {filters.vendor_name && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Vendor: {filters.vendor_name}</span>}
                {filters.status && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Status: {filters.status}</span>}
                {filters.doc_type && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Jenis: {filters.doc_type}</span>}
                {filters.date_from && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Dari: {filters.date_from}</span>}
                {filters.date_to && <span className="text-[12px] bg-[#F0FAF7] text-[#0D4B3B] px-2 py-0.5 rounded-full border border-[#BBF7D0]">Sampai: {filters.date_to}</span>}
              </div>
            )}
          </div>
        </div>

        <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
          💡 Filter berdasarkan slot dokumen yang diupload, bukan isi file.
        </p>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] mt-4 overflow-x-auto animate-fade-in-up delay-100">
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
            <table className="w-full" style={{ minWidth: '600px' }}>
              {/* Table Header */}
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Session ID</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Nomor Referensi</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Kode</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Bahan Baku</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Batch</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Vendor</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Jenis Dokumen</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Expired Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider">Waktu Verifikasi</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody>
                {records.map((record) => (
                  <tr
                    key={record.session_id}
                    className="border-b border-[#F3F4F6] cursor-pointer"
                    style={{ transition: 'background 0.15s' }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'white')}
                    onClick={() => navigate(`/verification/${record.session_id}`)}
                  >
                    <td className="px-4 py-3.5 text-[13px] text-[#6B7280] font-mono">
                      {record.session_id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3.5 text-[14px] font-medium text-[#0F1A16]">
                      {record.po_number || '-'}
                    </td>
                    <td className="px-4 py-3.5 text-[13px]">
                      {record.material_code ? (
                        <span className="bg-[#E8F5F0] text-[#0D4B3B] px-2 py-0.5 rounded-md text-[12px] font-semibold">
                          {record.material_code}
                        </span>
                      ) : <span className="text-[#9CA3AF]">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[14px] text-[#0F1A16]">
                      {record.material_name || <span className="text-[#9CA3AF] italic">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#4A5568] font-mono">
                      {record.batch_number || <span className="text-[#9CA3AF]">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#4A5568]">
                      {record.vendor_name
                        ? (record.vendor_name.length > 20
                            ? record.vendor_name.substring(0, 20) + '...'
                            : record.vendor_name)
                        : <span className="text-[#9CA3AF]">-</span>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-[13px]">
                      <span
                        className="inline-block px-2 py-1 rounded text-[11px] font-medium"
                        style={{ background: '#F0FAF7', color: '#0D4B3B' }}
                        title={record.doc_type}
                      >
                        {formatDocType(record.doc_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${getStatusBadge(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#4A5568]">
                      {record.expiry_date || <span className="text-[#9CA3AF]">-</span>}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-[#6B7280]">
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
