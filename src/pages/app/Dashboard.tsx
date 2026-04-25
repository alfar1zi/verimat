import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon, ShieldCheckIcon, DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowRightCircleIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";

interface Stats {
  total: number;
  pass: number;
  failed: number;
}

interface POSuggestion {
  po_number: string;
  material_name: string;
  display: string;
}

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1 fields
  const [referenceNumber, setReferenceNumber] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [materialName, setMaterialName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [packagingCondition, setPackagingCondition] = useState("");
  const [storageCondition, setStorageCondition] = useState("Normal (15-30°C)");
  const [temperature, setTemperature] = useState("");
  const [notes, setNotes] = useState("");
  
  // Search suggestions
  const [poSuggestions, setPoSuggestions] = useState<POSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Step 2 files
  const [suratJalan, setSuratJalan] = useState<File | null>(null);
  const [coa, setCoa] = useState<File | null>(null);
  const [faktur, setFaktur] = useState<File | null>(null);
  const [dokumenLain, setDokumenLain] = useState<File[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats>({ total: 0, pass: 0, failed: 0 });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleSearchPO = async (query: string) => {
    if (query.length < 2) {
      setPoSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/po/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setPoSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (err) {
      console.error("Failed to search PO:", err);
    }
  };

  const handleReferenceChange = (value: string) => {
    setReferenceNumber(value);
    handleSearchPO(value);
  };

  const selectSuggestion = (suggestion: POSuggestion) => {
    setReferenceNumber(suggestion.po_number);
    setMaterialName(suggestion.material_name);
    setShowSuggestions(false);
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!referenceNumber.trim()) errors.referenceNumber = "Nomor referensi wajib diisi";
    if (!vendorName.trim()) errors.vendorName = "Nama vendor wajib diisi";
    if (!materialName.trim()) errors.materialName = "Nama bahan baku wajib diisi";
    if (!batchNumber.trim()) errors.batchNumber = "Nomor batch wajib diisi";
    if (!quantity.trim()) errors.quantity = "Jumlah wajib diisi";
    if (!documentDate) errors.documentDate = "Tanggal dokumen wajib diisi";
    if (!packagingCondition) errors.packagingCondition = "Kondisi kemasan wajib dipilih";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      setError("");
    }
  };

  const handleFileSelect = (file: File, type: 'surat_jalan' | 'coa' | 'faktur') => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }
    if (type === 'surat_jalan') setSuratJalan(file);
    else if (type === 'coa') setCoa(file);
    else if (type === 'faktur') setFaktur(file);
    setError("");
  };

  const handleDokumenLainSelect = (files: FileList) => {
    const newFiles = Array.from(files).slice(0, 3 - dokumenLain.length);
    setDokumenLain([...dokumenLain, ...newFiles]);
  };

  const removeFile = (type: 'surat_jalan' | 'coa' | 'faktur', index?: number) => {
    if (type === 'surat_jalan') setSuratJalan(null);
    else if (type === 'coa') setCoa(null);
    else if (type === 'faktur') setFaktur(null);
  };

  const removeDokumenLain = (index: number) => {
    setDokumenLain(dokumenLain.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suratJalan) {
      setError("Surat Jalan wajib diupload");
      return;
    }

    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("surat_jalan", suratJalan);
    if (coa) formData.append("coa", coa);
    if (faktur) formData.append("faktur", faktur);
    dokumenLain.forEach((file) => formData.append("dokumen_lain", file));
    
    formData.append("reference_number", referenceNumber);
    formData.append("vendor_name", vendorName);
    formData.append("material_name", materialName);
    formData.append("batch_number", batchNumber);
    formData.append("quantity", quantity);
    formData.append("unit", unit);
    formData.append("document_date", documentDate);
    formData.append("packaging_condition", packagingCondition);
    formData.append("storage_condition", storageCondition);
    if (temperature) formData.append("temperature", temperature);
    if (notes) formData.append("notes", notes);

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
            Upload dokumen penerimaan untuk verifikasi otomatis sesuai standar CPOB
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#0D4B3B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[28px] font-bold text-[#0F1A16]">{stats.total}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Total Verifikasi</p>
              </div>
              <DocumentTextIcon className="h-6 w-6 text-[#0D4B3B]" />
            </div>
          </div>
          <div className="flex-1 bg-white rounded-xl p-5 shadow-sm border-l-4 border-[#16A34A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[28px] font-bold text-[#0F1A16]">{stats.pass}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">Dokumen Lolos</p>
              </div>
              <CheckCircleIcon className="h-6 w-6 text-[#16A34A]" />
            </div>
          </div>
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

        {/* Step Indicator */}
        <div className="flex items-center justify-center mt-8 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'bg-[#0D4B3B] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'}`}>
                1
              </div>
              <span className="text-[12px] mt-1 font-medium text-[#6B7280]">Informasi</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-[#0D4B3B]' : 'bg-[#E5E7EB]'}`} />
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'bg-[#0D4B3B] text-white' : 'bg-[#E5E7EB] text-[#9CA3AF]'}`}>
                2
              </div>
              <span className="text-[12px] mt-1 font-medium text-[#6B7280]">Dokumen</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
          {currentStep === 1 ? (
            <>
              <h2 className="text-[18px] font-bold text-[#0F1A16] mb-6">Informasi Pengiriman</h2>
              
              {/* Row 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative" ref={searchRef}>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Nomor Referensi Dokumen <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[12px] text-[#6B7280] mb-1.5">Nomor PO, Kontrak, Berita Acara, atau Invoice dari supplier</p>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => handleReferenceChange(e.target.value)}
                    placeholder="Contoh: PO-2024-001 atau INV-KF-20240419"
                    className={`w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-[15px] bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all ${fieldErrors.referenceNumber ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#0D4B3B]'}`}
                  />
                  {fieldErrors.referenceNumber && <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.referenceNumber}</p>}
                  {showSuggestions && poSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {poSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => selectSuggestion(suggestion)}
                          className="px-3.5 py-2.5 hover:bg-[#F3F4F6] cursor-pointer text-[14px]"
                        >
                          {suggestion.display}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Nama Vendor / Supplier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="PT Kimia Farma, PT Brataco, dll"
                    className={`w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-[15px] bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all ${fieldErrors.vendorName ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#0D4B3B]'}`}
                  />
                  {fieldErrors.vendorName && <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.vendorName}</p>}
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Nama Bahan Baku <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={materialName}
                    onChange={(e) => setMaterialName(e.target.value)}
                    placeholder="Paracetamol, Ascorbic Acid, dll"
                    className={`w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-[15px] bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all ${fieldErrors.materialName ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#0D4B3B]'}`}
                  />
                  {fieldErrors.materialName && <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.materialName}</p>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Nomor Batch Supplier <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[12px] text-[#6B7280] mb-1.5">Sesuai yang tertera di Surat Jalan dan CoA</p>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Contoh: BTX-2024-091"
                    className={`w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-[15px] bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all ${fieldErrors.batchNumber ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#0D4B3B]'}`}
                  />
                  {fieldErrors.batchNumber && <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.batchNumber}</p>}
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Jumlah Diterima <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className={`w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-[15px] bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all ${fieldErrors.quantity ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#0D4B3B]'}`}
                  />
                  {fieldErrors.quantity && <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Satuan
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E5E7EB] rounded-lg text-[15px] bg-white focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                  >
                    <option value="kg">kg</option>
                    <option value="gram">gram</option>
                    <option value="liter">liter</option>
                    <option value="mL">mL</option>
                    <option value="pcs">pcs</option>
                    <option value="karton">karton</option>
                    <option value="drum">drum</option>
                    <option value="sak">sak</option>
                    <option value="lainnya">lainnya</option>
                  </select>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Tanggal Dokumen / Pengiriman <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={documentDate}
                    onChange={(e) => setDocumentDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-[15px] bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all ${fieldErrors.documentDate ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#0D4B3B]'}`}
                  />
                  {fieldErrors.documentDate && <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.documentDate}</p>}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                    Kondisi Kemasan Fisik <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={packagingCondition}
                    onChange={(e) => setPackagingCondition(e.target.value)}
                    className={`w-full px-3.5 py-2.5 border-[1.5px] rounded-lg text-[15px] bg-white focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all ${fieldErrors.packagingCondition ? 'border-[#DC2626]' : 'border-[#E5E7EB] focus:border-[#0D4B3B]'}`}
                  >
                    <option value="">Pilih kondisi</option>
                    <option value="Baik">Baik — Kemasan utuh dan tidak ada kerusakan</option>
                    <option value="Minor">Minor — Ada kerusakan kecil, bahan masih aman</option>
                    <option value="Rusak">Rusak — Kemasan bocor atau rusak signifikan</option>
                    <option value="Perlu Dicek">Perlu Dicek — Kondisi meragukan</option>
                  </select>
                  {fieldErrors.packagingCondition && <p className="text-[12px] text-[#DC2626] mt-1">{fieldErrors.packagingCondition}</p>}
                </div>
              </div>

              {/* Row 5 */}
              <div className="mt-5">
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  Kondisi Penyimpanan / Suhu
                </label>
                <p className="text-[12px] text-[#6B7280] mb-1.5">Isi jika bahan memerlukan cold chain</p>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="Suhu saat datang (°C)"
                    className="flex-1 px-3.5 py-2.5 border-[1.5px] border-[#E5E7EB] rounded-lg text-[15px] bg-white focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                  />
                  <select
                    value={storageCondition}
                    onChange={(e) => setStorageCondition(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border-[1.5px] border-[#E5E7EB] rounded-lg text-[15px] bg-white focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all"
                  >
                    <option value="Normal (15-30°C)">Normal (15-30°C)</option>
                    <option value="Dingin (2-8°C)">Dingin (2-8°C)</option>
                    <option value="Beku (<-18°C)">Beku (&lt;-18°C)</option>
                    <option value="Tidak Diperlukan">Tidak Diperlukan</option>
                  </select>
                </div>
              </div>

              {/* Row 6 */}
              <div className="mt-5">
                <label className="block text-[13px] font-medium text-[#374151] mb-1.5">
                  Catatan Tambahan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan khusus tentang pengiriman ini (opsional)"
                  rows={3}
                  className="w-full px-3.5 py-2.5 border-[1.5px] border-[#E5E7EB] rounded-lg text-[15px] bg-white focus:border-[#0D4B3B] focus:outline-none focus:shadow-[0_0_0_3px_rgba(13,75,59,0.1)] transition-all resize-none"
                />
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full h-[48px] bg-[#0D4B3B] text-white rounded-lg font-semibold text-[16px] mt-6 hover:bg-[#0a3d30] hover:-translate-y-0.5 transition-all"
              >
                Lanjut ke Upload Dokumen →
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-[14px] text-[#6B7280] hover:text-[#0D4B3B] flex items-center gap-1 mb-4"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Kembali ke Informasi
              </button>
              
              <h2 className="text-[18px] font-bold text-[#0F1A16] mb-1">Upload Dokumen Pengiriman</h2>
              <p className="text-[14px] text-[#6B7280] mb-6">
                Upload minimal Surat Jalan. Tambahkan dokumen lain untuk verifikasi lebih lengkap.
              </p>

              {/* Document Slots */}
              <div className="space-y-4">
                {/* Slot 1 - Surat Jalan */}
                <DocumentSlot
                  badge="WAJIB"
                  badgeColor="bg-[#FEE2E2] text-[#991B1B]"
                  title="Surat Jalan / Delivery Note"
                  description="Dokumen pengiriman dari supplier"
                  file={suratJalan}
                  onFileSelect={(file) => handleFileSelect(file, 'surat_jalan')}
                  onRemove={() => removeFile('surat_jalan')}
                  accept=".pdf,.jpg,.jpeg,.png"
                />

                {/* Slot 2 - CoA */}
                <DocumentSlot
                  badge="DIREKOMENDASIKAN"
                  badgeColor="bg-[#FEF9C3] text-[#854D0E]"
                  title="Certificate of Analysis (CoA)"
                  description="Sertifikat analisis kualitas bahan baku dari supplier"
                  file={coa}
                  onFileSelect={(file) => handleFileSelect(file, 'coa')}
                  onRemove={() => removeFile('coa')}
                  accept=".pdf,.jpg,.jpeg,.png"
                />

                {/* Slot 3 - Faktur */}
                <DocumentSlot
                  badge="OPSIONAL"
                  badgeColor="bg-[#F3F4F6] text-[#6B7280]"
                  title="Faktur Pajak / Invoice"
                  description="Faktur penjualan atau faktur pajak"
                  file={faktur}
                  onFileSelect={(file) => handleFileSelect(file, 'faktur')}
                  onRemove={() => removeFile('faktur')}
                  accept=".pdf,.jpg,.jpeg,.png"
                />

                {/* Slot 4 - Dokumen Lain */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]">OPSIONAL</span>
                    <h3 className="text-[15px] font-semibold text-[#0F1A16]">Sertifikat Halal / MSDS / Dokumen Lain</h3>
                  </div>
                  <p className="text-[13px] text-[#6B7280] mb-3">Sertifikat halal, MSDS untuk B3, atau dokumen pendukung lainnya (max 3 file)</p>
                  
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files) handleDokumenLainSelect(e.target.files);
                    }}
                    className="hidden"
                    id="dokumen-lain-input"
                  />
                  <label
                    htmlFor="dokumen-lain-input"
                    className="flex items-center justify-center gap-2 border-2 border-dashed border-[#0D4B3B30] rounded-lg p-4 cursor-pointer hover:border-[#0D4B3B] hover:bg-[#F0FAF7] transition-all"
                  >
                    <ArrowUpTrayIcon className="h-5 w-5 text-[#0D4B3B]" />
                    <span className="text-[14px] text-[#6B7280]">Pilih file atau drag & drop</span>
                  </label>
                  
                  {dokumenLain.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {dokumenLain.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-[#DCFCE7] border border-[#16A34A] rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <DocumentIcon className="h-4 w-4 text-[#16A34A]" />
                            <span className="text-[13px] text-[#0F1A16]">{file.name}</span>
                            <span className="text-[11px] text-[#6B7280]">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDokumenLain(index)}
                            className="text-[#DC2626] hover:text-[#991B1B]"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-[#F9FAFB] rounded-lg p-4 mt-6">
                <h3 className="text-[15px] font-semibold text-[#0F1A16] mb-3">Ringkasan Verifikasi</h3>
                <div className="space-y-2 text-[13px]">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Nomor Referensi:</span>
                    <span className="text-[#0F1A16] font-medium">{referenceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Vendor:</span>
                    <span className="text-[#0F1A16] font-medium">{vendorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Bahan Baku:</span>
                    <span className="text-[#0F1A16] font-medium">{materialName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Nomor Batch:</span>
                    <span className="text-[#0F1A16] font-medium">{batchNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Jumlah:</span>
                    <span className="text-[#0F1A16] font-medium">{quantity} {unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Kondisi Kemasan:</span>
                    <span className="text-[#0F1A16] font-medium">{packagingCondition}</span>
                  </div>
                  <div className="border-t border-[#E5E7EB] pt-2 mt-2">
                    <span className="text-[#6B7280]">Dokumen:</span>
                    <div className="text-[#0F1A16] font-medium mt-1">
                      {suratJalan?.name}
                      {coa && `, ${coa.name}`}
                      {faktur && `, ${faktur.name}`}
                      {dokumenLain.length > 0 && `, +${dokumenLain.length} lainnya`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!suratJalan || isLoading}
                className="w-full h-[52px] bg-[#0D4B3B] text-white rounded-lg font-bold text-[16px] mt-6 hover:bg-[#0a3d30] hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses dokumen...
                  </>
                ) : (
                  <>
                    Mulai Verifikasi Otomatis
                    <ArrowRightCircleIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-[#FEE2E2] rounded-lg p-3 mt-4 text-[#DC2626] text-sm">
              {error}
            </div>
          )}

          {/* Info Note */}
          <div className="flex items-center gap-2 mt-4">
            <ShieldCheckIcon className="h-4 w-4 text-[#0D4B3B]" />
            <p className="text-[13px] text-[#6B7280]">
              Semua verifikasi tersimpan otomatis sebagai audit trail untuk kepatuhan regulasi CPOB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DocumentSlotProps {
  badge: string;
  badgeColor: string;
  title: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  accept: string;
}

function DocumentSlot({ badge, badgeColor, title, description, file, onFileSelect, onRemove, accept }: DocumentSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit");
      return;
    }
    onFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${badgeColor}`}>{badge}</span>
        <h3 className="text-[15px] font-semibold text-[#0F1A16]">{title}</h3>
      </div>
      <p className="text-[13px] text-[#6B7280] mb-3">{description}</p>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) handleFileSelect(selectedFile);
        }}
        className="hidden"
      />
      
      {file ? (
        <div className="bg-[#DCFCE7] border border-[#16A34A] rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DocumentIcon className="h-5 w-5 text-[#16A34A]" />
            <span className="text-[14px] text-[#0F1A16] font-medium">{file.name}</span>
            <span className="text-[12px] text-[#6B7280]">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-[#DC2626] hover:text-[#991B1B]"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all ${
            isDragging
              ? "border-[#0D4B3B] bg-[#E8F5F0]"
              : "border-[#0D4B3B30] bg-[#F8FFFE] hover:border-[#0D4B3B] hover:bg-[#F0FAF7]"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <ArrowUpTrayIcon className="h-5 w-5 text-[#0D4B3B]" />
            <span className="text-[14px] text-[#6B7280]">Pilih file atau drag & drop</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
