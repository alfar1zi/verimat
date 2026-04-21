import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon, ShieldCheckIcon, DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";

interface PO {
  po_number: string;
  item_name: string;
}

interface Stats {
  total: number;
  pass: number;
  failed: number;
}

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [poList, setPoList] = useState<PO[]>([]);
  const [selectedPO, setSelectedPO] = useState("");
  const [docType, setDocType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [stats, setStats] = useState<Stats>({ total: 0, pass: 0, failed: 0 });

  useEffect(() => {
    fetchPOList();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/audit/list`);
      if (response.ok) {
        const data = await response.json();
        const total = data.length;
        const pass = data.filter((r: any) => r.status === "PASS").length;
        const failed = data.filter((r: any) => r.status === "MISMATCH" || r.status === "INCOMPLETE").length;
        setStats({ total, pass, failed });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchPOList = async () => {
    try {
      const response = await fetch(`${API_URL}/api/po/list`);
      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      setPoList(data);
    } catch (err) {
      console.error("Failed to fetch PO list:", err);
      setError("Gagal memuat daftar PO. Pastikan server berjalan.");
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }
    setFile(selectedFile);
    setError("");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO || !file || !docType) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("po_number", selectedPO);
    formData.append("doc_type", docType);

    try {
      const response = await fetch(`${API_URL}/api/upload/verify`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Server error");
      const data = await response.json();
      navigate(`/verification/${data.session_id}`);
    } catch (err) {
      setError("Gagal mengupload dokumen. Pastikan server berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      <AppNavbar />
      
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-[#0F1A16]">Verifikasi Dokumen Baru</h1>
          <p className="text-[14px] text-[#4A5568] mt-1">
            Upload dokumen penerimaan untuk verifikasi otomatis
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4 mt-6">
          {/* Card 1 - Total Verifikasi */}
          <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#0D4B3B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[28px] font-bold text-[#0F1A16]">{stats.total}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Total Verifikasi</p>
              </div>
              <DocumentTextIcon className="h-6 w-6 text-[#0D4B3B]" />
            </div>
          </div>

          {/* Card 2 - Dokumen Lolos */}
          <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#16A34A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[28px] font-bold text-[#0F1A16]">{stats.pass}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Dokumen Lolos</p>
              </div>
              <CheckCircleIcon className="h-6 w-6 text-[#16A34A]" />
            </div>
          </div>

          {/* Card 3 - Perlu Perhatian */}
          <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#DC2626]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[28px] font-bold text-[#0F1A16]">{stats.failed}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Perlu Perhatian</p>
              </div>
              <ExclamationCircleIcon className="h-6 w-6 text-[#DC2626]" />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E7EB] p-8 mt-6 shadow-sm">
          {/* Row 1: PO Number & Document Type */}
          <div className="grid grid-cols-2 gap-4">
            {/* PO Number */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Nomor Purchase Order
              </label>
              <select
                value={selectedPO}
                onChange={(e) => setSelectedPO(e.target.value)}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E5E7EB] rounded-lg text-[15px] bg-white focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
              >
                <option value="">Pilih Nomor PO</option>
                {poList.map((po: any) => (
                  <option key={po.po_number || po.id} value={po.po_number || po.id}>
                    {po.display || `${po.po_number} - ${po.material_name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                Jenis Dokumen
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E5E7EB] rounded-lg text-[15px] bg-white focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
              >
                <option value="">Pilih Jenis Dokumen</option>
                <option value="surat_jalan">Surat Jalan</option>
                <option value="coa">Certificate of Analysis (CoA)</option>
                <option value="halal">Dokumen Halal</option>
              </select>
            </div>
          </div>

          {/* Row 2: Upload Area */}
          <div className="mt-5">
            <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
              File Dokumen
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[#0D4B3B] bg-[#E8F5F0]"
                  : "border-[#0D4B3B26] bg-[#F0FAF7] hover:border-[#0D4B3B] hover:bg-[#E8F5F0]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                className="hidden"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <DocumentIcon className="h-5 w-5 text-[#0D4B3B]" />
                  <span className="text-[15px] font-medium text-[#374151]">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-2 text-[#DC2626] hover:text-[#991B1B]"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <>
                  <ArrowUpTrayIcon className="h-10 w-10 text-[#0D4B3B] opacity-60 mx-auto" />
                  <p className="text-[15px] font-medium text-[#374151] mt-3">
                    Pilih File atau Drag & Drop
                  </p>
                  <p className="text-[13px] text-[#9CA3AF] mt-1">
                    PDF, JPG, PNG maksimum 10MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Row 3: Submit Button */}
          <button
            type="submit"
            disabled={!selectedPO || !file || !docType || isLoading}
            className="w-full h-[52px] bg-[#0D4B3B] text-white rounded-lg font-semibold text-[16px] mt-6 hover:bg-[#0a3d30] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Memproses...
              </span>
            ) : (
              "Upload & Verifikasi"
            )}
          </button>

          {/* Row 4: Info Note */}
          <div className="flex items-center gap-2 mt-4">
            <ShieldCheckIcon className="h-4 w-4 text-[#0D4B3B]" />
            <p className="text-[13px] text-[#6B7280]">
              Semua verifikasi tersimpan otomatis sebagai audit trail untuk kepatuhan regulasi CPOB
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#FEE2E2] rounded-lg p-3 mt-4 text-[#DC2626] text-sm">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Dashboard;
