import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon, ShieldCheckIcon, DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowRightCircleIcon, ChevronLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";

interface Stats {
  total: number;
  pass: number;
  failed: number;
}

interface TrendData {
  total: { value: number; trend: 'up' | 'down' | 'same' };
  pass: { value: number; trend: 'up' | 'down' | 'same' };
  failed: { value: number; trend: 'up' | 'down' | 'same' };
}

interface POSuggestion {
  po_number: string;
  material_name: string;
  display: string;
}

const STORAGE_KEY = 'verimat_form_draft';

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  
  // Step management with persistence
  const [currentStep, setCurrentStep] = useState(() => {
    return parseInt(sessionStorage.getItem(STORAGE_KEY + '_step') || '1');
  });
  
  // Step 1 fields with persistence
  const [formState, setFormState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        referenceNumber: '',
        vendorName: '',
        materialName: '',
        batchNumber: '',
        quantity: '',
        unit: 'kg',
        documentDate: new Date().toISOString().split('T')[0],
        packagingCondition: '',
        storageCondition: 'Tidak Diperlukan',
        temperature: '',
        notes: '',
      };
    } catch {
      return {
        referenceNumber: '',
        vendorName: '',
        materialName: '',
        batchNumber: '',
        quantity: '',
        unit: 'kg',
        documentDate: new Date().toISOString().split('T')[0],
        packagingCondition: '',
        storageCondition: 'Tidak Diperlukan',
        temperature: '',
        notes: '',
      };
    }
  });
  
  // File names persistence (can't store File objects in sessionStorage)
  const [fileNames, setFileNames] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY + '_files');
      return saved ? JSON.parse(saved) : {
        suratJalan: null,
        coa: null,
        faktur: null,
        dokumenLain: []
      };
    } catch {
      return { suratJalan: null, coa: null, faktur: null, dokumenLain: [] };
    }
  });
  
  // Step 2 files
  const [suratJalan, setSuratJalan] = useState<File | null>(null);
  const [coa, setCoa] = useState<File | null>(null);
  const [faktur, setFaktur] = useState<File | null>(null);
  const [dokumenLain, setDokumenLain] = useState<File[]>([]);
  
  // Search suggestions
  const [poSuggestions, setPoSuggestions] = useState<POSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Camera capture
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'surat_jalan' | 'coa' | 'faktur' | 'dokumen_lain' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Stats>({ total: 0, pass: 0, failed: 0 });
  const [trends, setTrends] = useState<TrendData>({
    total: { value: 0, trend: 'same' },
    pass: { value: 0, trend: 'same' },
    failed: { value: 0, trend: 'same' }
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Persist form state
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
  }, [formState]);
  
  // Persist file names
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY + '_files', JSON.stringify(fileNames));
  }, [fileNames]);
  
  // Persist step
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY + '_step', currentStep.toString());
  }, [currentStep]);

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
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayRecords = data.filter((r: any) => {
          const recordDate = new Date(r.verification_time);
          return recordDate.toDateString() === today.toDateString();
        });

        const yesterdayRecords = data.filter((r: any) => {
          const recordDate = new Date(r.verification_time);
          return recordDate.toDateString() === yesterday.toDateString();
        });

        const total = data.length;
        const pass = data.filter((r: any) => r.status === "PASS").length;
        const failed = data.filter((r: any) => r.status === "MISMATCH" || r.status === "INCOMPLETE").length;

        const todayTotal = todayRecords.length;
        const todayPass = todayRecords.filter((r: any) => r.status === "PASS").length;
        const todayFailed = todayRecords.filter((r: any) => r.status === "MISMATCH" || r.status === "INCOMPLETE").length;

        const yesterdayTotal = yesterdayRecords.length;
        const yesterdayPass = yesterdayRecords.filter((r: any) => r.status === "PASS").length;
        const yesterdayFailed = yesterdayRecords.filter((r: any) => r.status === "MISMATCH" || r.status === "INCOMPLETE").length;

        const getTrend = (today: number, yesterday: number): 'up' | 'down' | 'same' => {
          if (today > yesterday) return 'up';
          if (today < yesterday) return 'down';
          return 'same';
        };

        setStats({ total, pass, failed });
        setTrends({
          total: { value: Math.abs(todayTotal - yesterdayTotal), trend: getTrend(todayTotal, yesterdayTotal) },
          pass: { value: Math.abs(todayPass - yesterdayPass), trend: getTrend(todayPass, yesterdayPass) },
          failed: { value: Math.abs(todayFailed - yesterdayFailed), trend: getTrend(todayFailed, yesterdayFailed) }
        });
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
    setFormState({ ...formState, referenceNumber: value });
    handleSearchPO(value);
  };

  const selectSuggestion = (suggestion: POSuggestion) => {
    setFormState({ ...formState, referenceNumber: suggestion.po_number, materialName: suggestion.material_name });
    setShowSuggestions(false);
  };

  const openCamera = async (target: 'surat_jalan' | 'coa' | 'faktur' | 'dokumen_lain') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setCameraTarget(target);
      setShowCamera(true);
      // Set video srcObject setelah modal render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      setError('Izin kamera ditolak atau tidak tersedia. Gunakan upload file sebagai alternatif.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraTarget) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const timestamp = new Date().getTime();
      const file = new File([blob], `foto_dokumen_${timestamp}.jpg`, { type: 'image/jpeg' });
      if (cameraTarget === 'surat_jalan') {
        setSuratJalan(file);
        setFileNames({ ...fileNames, suratJalan: file.name });
      } else if (cameraTarget === 'coa') {
        setCoa(file);
        setFileNames({ ...fileNames, coa: file.name });
      } else if (cameraTarget === 'faktur') {
        setFaktur(file);
        setFileNames({ ...fileNames, faktur: file.name });
      } else if (cameraTarget === 'dokumen_lain') {
        setDokumenLain(prev => [...prev, file]);
        setFileNames(prev => ({ ...prev, dokumenLain: [...prev.dokumenLain, file.name] }));
      }
      closeCamera();
    }, 'image/jpeg', 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraTarget(null);
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!formState.referenceNumber.trim()) errors.referenceNumber = "Nomor referensi wajib diisi";
    if (!formState.vendorName.trim()) errors.vendorName = "Nama vendor wajib diisi";
    if (!formState.materialName.trim()) errors.materialName = "Nama bahan baku wajib diisi";
    if (!formState.batchNumber.trim()) errors.batchNumber = "Nomor batch wajib diisi";
    if (!formState.quantity || parseFloat(formState.quantity) <= 0) errors.quantity = "Jumlah wajib diisi";
    if (!formState.documentDate) errors.documentDate = "Tanggal wajib diisi";
    if (!formState.packagingCondition) errors.packagingCondition = "Kondisi kemasan wajib dipilih";
    
    return errors;
  };

  const handleNextStep = () => {
    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = document.querySelector('[data-error]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearDraft = () => {
    if (window.confirm('Hapus semua isian?')) {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY + '_files');
      sessionStorage.removeItem(STORAGE_KEY + '_step');
      setFormState({
        referenceNumber: '',
        vendorName: '',
        materialName: '',
        batchNumber: '',
        quantity: '',
        unit: 'kg',
        documentDate: new Date().toISOString().split('T')[0],
        packagingCondition: '',
        storageCondition: 'Tidak Diperlukan',
        temperature: '',
        notes: '',
      });
      setFileNames({ suratJalan: null, coa: null, faktur: null, dokumenLain: [] });
      setSuratJalan(null);
      setCoa(null);
      setFaktur(null);
      setDokumenLain([]);
      setCurrentStep(1);
    }
  };

  const handleFileSelect = (file: File, type: 'surat_jalan' | 'coa' | 'faktur') => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit");
      return;
    }
    if (type === 'surat_jalan') {
      setSuratJalan(file);
      setFileNames({ ...fileNames, suratJalan: file.name });
    }
    else if (type === 'coa') {
      setCoa(file);
      setFileNames({ ...fileNames, coa: file.name });
    }
    else if (type === 'faktur') {
      setFaktur(file);
      setFileNames({ ...fileNames, faktur: file.name });
    }
    setError("");
  };

  const handleDokumenLainSelect = (files: FileList) => {
    const newFiles = Array.from(files).slice(0, 3 - dokumenLain.length);
    setDokumenLain([...dokumenLain, ...newFiles]);
    setFileNames({ ...fileNames, dokumenLain: [...fileNames.dokumenLain, ...newFiles.map(f => f.name)] });
  };

  const removeFile = (type: 'surat_jalan' | 'coa' | 'faktur', index?: number) => {
    if (type === 'surat_jalan') {
      setSuratJalan(null);
      setFileNames({ ...fileNames, suratJalan: null });
    }
    else if (type === 'coa') {
      setCoa(null);
      setFileNames({ ...fileNames, coa: null });
    }
    else if (type === 'faktur') {
      setFaktur(null);
      setFileNames({ ...fileNames, faktur: null });
    }
  };

  const removeDokumenLain = (index: number) => {
    setDokumenLain(dokumenLain.filter((_, i) => i !== index));
    setFileNames({ ...fileNames, dokumenLain: fileNames.dokumenLain.filter((_, i) => i !== index) });
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
    
    formData.append("reference_number", formState.referenceNumber);
    formData.append("vendor_name", formState.vendorName);
    formData.append("material_name", formState.materialName);
    formData.append("batch_number", formState.batchNumber);
    formData.append("quantity", formState.quantity);
    formData.append("unit", formState.unit);
    formData.append("document_date", formState.documentDate);
    formData.append("packaging_condition", formState.packagingCondition);
    formData.append("storage_condition", formState.storageCondition);
    if (formState.temperature) formData.append("temperature", formState.temperature);
    if (formState.notes) formData.append("notes", formState.notes);

    try {
      const response = await fetch(`${API_URL}/api/upload/verify`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      const data = await response.json();
      
      // Clear session on success
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY + '_files');
      sessionStorage.removeItem(STORAGE_KEY + '_step');
      
      navigate(`/verification/${data.session_id}`);
    } catch (error: any) {
      if (error.message.includes('fetch')) {
        setError('Tidak dapat terhubung ke server. Pastikan backend berjalan di ' + API_URL);
      } else {
        setError(error.message || 'Terjadi kesalahan saat memproses dokumen.');
      }
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
          {/* Total Card */}
          <div style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #0D4B3B',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{
                fontSize: '32px', fontWeight: '700',
                color: '#0F1A16', lineHeight: 1
              }}>
                {stats.total}
              </p>
              <p style={{
                fontSize: '13px', color: '#6B7280', marginTop: '6px'
              }}>
                Total Verifikasi
              </p>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: 'rgba(13,75,59,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DocumentTextIcon style={{ width: '22px', height: '22px', color: '#0D4B3B' }} />
            </div>
          </div>

          {/* Pass Card */}
          <div style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #16A34A',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{
                fontSize: '32px', fontWeight: '700',
                color: '#0F1A16', lineHeight: 1
              }}>
                {stats.pass}
              </p>
              <p style={{
                fontSize: '13px', color: '#6B7280', marginTop: '6px'
              }}>
                Dokumen Lolos
              </p>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: 'rgba(22,163,74,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircleIcon style={{ width: '22px', height: '22px', color: '#16A34A' }} />
            </div>
          </div>

          {/* Failed Card */}
          <div style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #DC2626',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{
                fontSize: '32px', fontWeight: '700',
                color: '#0F1A16', lineHeight: 1
              }}>
                {stats.failed}
              </p>
              <p style={{
                fontSize: '13px', color: '#6B7280', marginTop: '6px'
              }}>
                Perlu Perhatian
              </p>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: 'rgba(220,38,38,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ExclamationCircleIcon style={{ width: '22px', height: '22px', color: '#DC2626' }} />
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '32px', marginBottom: '32px', gap: '0' }}>
          <div className="flex items-center gap-0">
            <div className="flex flex-col items-center">
              <div 
                onClick={() => currentStep === 2 && setCurrentStep(1)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: currentStep >= 1 ? '#0D4B3B' : '#E5E7EB',
                  color: currentStep >= 1 ? 'white' : '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '700',
                  boxShadow: currentStep >= 1 ? '0 0 0 4px rgba(13,75,59,0.15)' : 'none',
                  position: 'relative', zIndex: 1,
                  cursor: currentStep === 2 ? 'pointer' : 'default'
                }}
              >
                {currentStep > 1 ? <CheckIcon className="h-4 w-4" /> : '1'}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: currentStep === 1 ? '600' : '400',
                color: currentStep === 1 ? '#0D4B3B' : '#9CA3AF',
                marginTop: '6px', textAlign: 'center'
              }}>Informasi</span>
            </div>
            <div style={{
              height: '2px', width: '80px',
              background: currentStep > 1 ? '#16A34A' : '#E5E7EB',
              transition: 'background 0.3s ease'
            }} />
            <div className="flex flex-col items-center">
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: currentStep >= 2 ? '#0D4B3B' : '#E5E7EB',
                color: currentStep >= 2 ? 'white' : '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '700',
                boxShadow: currentStep >= 2 ? '0 0 0 4px rgba(13,75,59,0.15)' : 'none',
                position: 'relative', zIndex: 1
              }}>
                2
              </div>
              <span style={{
                fontSize: '11px', fontWeight: currentStep === 2 ? '600' : '400',
                color: currentStep === 2 ? '#0D4B3B' : '#9CA3AF',
                marginTop: '6px', textAlign: 'center'
              }}>Dokumen</span>
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
                <div className="relative" ref={searchRef} data-error={fieldErrors.referenceNumber ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Nomor Referensi Dokumen <span style={{color: '#DC2626'}}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', minHeight: '16px' }}>Nomor PO, Kontrak, Berita Acara, atau Invoice dari supplier</p>
                  <input
                    type="text"
                    value={formState.referenceNumber}
                    onChange={(e) => handleReferenceChange(e.target.value)}
                    placeholder="Contoh: PO-2024-001 atau INV-KF-20240419"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: fieldErrors.referenceNumber ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '14px', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = fieldErrors.referenceNumber ? '#DC2626' : '#E5E7EB'}
                  />
                  {fieldErrors.referenceNumber && <p style={{fontSize: '12px', color: '#DC2626', marginTop: '2px'}}>{fieldErrors.referenceNumber}</p>}
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
                <div data-error={fieldErrors.vendorName ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Nama Vendor / Supplier <span style={{color: '#DC2626'}}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', minHeight: '16px' }}>Nama perusahaan supplier pengirim</p>
                  <input
                    type="text"
                    value={formState.vendorName}
                    onChange={(e) => setFormState({ ...formState, vendorName: e.target.value })}
                    placeholder="PT Kimia Farma, PT Brataco, dll"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: fieldErrors.vendorName ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '14px', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = fieldErrors.vendorName ? '#DC2626' : '#E5E7EB'}
                  />
                  {fieldErrors.vendorName && <p style={{fontSize: '12px', color: '#DC2626', marginTop: '2px'}}>{fieldErrors.vendorName}</p>}
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div data-error={fieldErrors.materialName ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Nama Bahan Baku <span style={{color: '#DC2626'}}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', minHeight: '16px' }}>Nama bahan baku yang diterima</p>
                  <input
                    type="text"
                    value={formState.materialName}
                    onChange={(e) => setFormState({ ...formState, materialName: e.target.value })}
                    placeholder="Paracetamol, Ascorbic Acid, dll"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: fieldErrors.materialName ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '14px', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = fieldErrors.materialName ? '#DC2626' : '#E5E7EB'}
                  />
                  {fieldErrors.materialName && <p style={{fontSize: '12px', color: '#DC2626', marginTop: '2px'}}>{fieldErrors.materialName}</p>}
                </div>
                <div data-error={fieldErrors.batchNumber ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Nomor Batch Supplier <span style={{color: '#DC2626'}}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', minHeight: '16px' }}>Sesuai yang tertera di Surat Jalan dan CoA</p>
                  <input
                    type="text"
                    value={formState.batchNumber}
                    onChange={(e) => setFormState({ ...formState, batchNumber: e.target.value })}
                    placeholder="Contoh: BTX-2024-091"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: fieldErrors.batchNumber ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '14px', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = fieldErrors.batchNumber ? '#DC2626' : '#E5E7EB'}
                  />
                  {fieldErrors.batchNumber && <p style={{fontSize: '12px', color: '#DC2626', marginTop: '2px'}}>{fieldErrors.batchNumber}</p>}
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-2 gap-4 mt-5">
                <div data-error={fieldErrors.quantity ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Jumlah Diterima <span style={{color: '#DC2626'}}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', minHeight: '16px' }}>Jumlah bahan baku yang diterima</p>
                  <input
                    type="number"
                    min="0"
                    value={formState.quantity}
                    onChange={(e) => setFormState({ ...formState, quantity: e.target.value })}
                    placeholder="0"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: fieldErrors.quantity ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '14px', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = fieldErrors.quantity ? '#DC2626' : '#E5E7EB'}
                  />
                  {fieldErrors.quantity && <p style={{fontSize: '12px', color: '#DC2626', marginTop: '2px'}}>{fieldErrors.quantity}</p>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Satuan
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', minHeight: '16px' }}>Satuan pengukuran jumlah</p>
                  <select
                    value={formState.unit}
                    onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1.5px solid #E5E7EB', borderRadius: '8px',
                      fontSize: '14px', color: '#0F1A16', backgroundColor: 'white',
                      outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
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
                <div data-error={fieldErrors.documentDate ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Tanggal Dokumen / Pengiriman <span style={{color: '#DC2626'}}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', minHeight: '16px' }}>Tanggal pada dokumen atau tanggal pengiriman</p>
                  <input
                    type="date"
                    value={formState.documentDate}
                    onChange={(e) => setFormState({ ...formState, documentDate: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: fieldErrors.documentDate ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '14px', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = fieldErrors.documentDate ? '#DC2626' : '#E5E7EB'}
                  />
                  {fieldErrors.documentDate && <p style={{fontSize: '12px', color: '#DC2626', marginTop: '2px'}}>{fieldErrors.documentDate}</p>}
                </div>
                <div data-error={fieldErrors.packagingCondition ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Kondisi Kemasan Fisik <span style={{color: '#DC2626'}}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px', minHeight: '16px' }}>Kondisi fisik kemasan saat penerimaan</p>
                  <select
                    value={formState.packagingCondition}
                    onChange={(e) => setFormState({ ...formState, packagingCondition: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: fieldErrors.packagingCondition ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '14px', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = fieldErrors.packagingCondition ? '#DC2626' : '#E5E7EB'}
                  >
                    <option value="">Pilih kondisi</option>
                    <option value="Baik">Baik — Kemasan utuh dan tidak ada kerusakan</option>
                    <option value="Minor">Minor — Ada kerusakan kecil, bahan masih aman</option>
                    <option value="Rusak">Rusak — Kemasan bocor atau rusak signifikan</option>
                    <option value="Perlu Dicek">Perlu Dicek — Kondisi meragukan</option>
                  </select>
                  {fieldErrors.packagingCondition && <p style={{fontSize: '12px', color: '#DC2626', marginTop: '2px'}}>{fieldErrors.packagingCondition}</p>}
                </div>
              </div>

              {/* Row 5 */}
              <div className="mt-5">
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Kondisi Penyimpanan / Suhu
                </label>
                <p style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>Isi jika bahan memerlukan cold chain</p>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={formState.temperature}
                    onChange={(e) => setFormState({ ...formState, temperature: e.target.value })}
                    placeholder="Suhu saat datang (°C)"
                    style={{
                      flex: 1, padding: '10px 14px',
                      border: '1.5px solid #E5E7EB', borderRadius: '8px',
                      fontSize: '14px', color: '#0F1A16', backgroundColor: 'white',
                      outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <select
                    value={formState.storageCondition}
                    onChange={(e) => setFormState({ ...formState, storageCondition: e.target.value })}
                    style={{
                      flex: 1, padding: '10px 14px',
                      border: '1.5px solid #E5E7EB', borderRadius: '8px',
                      fontSize: '14px', color: '#0F1A16', backgroundColor: 'white',
                      outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
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
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Catatan Tambahan
                </label>
                <textarea
                  value={formState.notes}
                  onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                  placeholder="Catatan khusus tentang pengiriman ini (opsional)"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px',
                    border: '1.5px solid #E5E7EB', borderRadius: '8px',
                    fontSize: '14px', color: '#0F1A16', backgroundColor: 'white',
                    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                    boxSizing: 'border-box', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNextStep}
                style={{
                  width: '100%', height: '48px',
                  background: '#0D4B3B', color: 'white',
                  borderRadius: '8px', fontWeight: '600', fontSize: '16px',
                  marginTop: '24px', cursor: 'pointer', border: 'none',
                  transition: 'background 0.2s, transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#0a3d30'}
                onMouseOut={(e) => e.currentTarget.style.background = '#0D4B3B'}
              >
                Lanjut ke Upload Dokumen →
              </button>

              {/* Clear Draft Button */}
              <button
                type="button"
                onClick={clearDraft}
                style={{
                  width: '100', height: 'auto',
                  background: 'none', color: '#9CA3AF',
                  fontSize: '13px', marginTop: '12px', cursor: 'pointer',
                  border: 'none', padding: 0
                }}
              >
                Hapus draft dan mulai ulang
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setError(""); setCurrentStep(1); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none',
                  color: '#0D4B3B', fontSize: '14px', fontWeight: '500',
                  cursor: 'pointer', padding: '0', marginBottom: '20px'
                }}
              >
                ← Kembali ke Informasi Pengiriman
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
                {!suratJalan && typeof navigator !== 'undefined' && navigator.mediaDevices && (
                  <button
                    type="button"
                    onClick={() => openCamera('surat_jalan')}
                    style={{
                      marginTop: '8px', width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      background: 'transparent', border: '1.5px solid #0D4B3B',
                      color: '#0D4B3B', borderRadius: '8px', padding: '8px 16px',
                      fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    Ambil Foto dengan Kamera
                  </button>
                )}

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
                {!coa && typeof navigator !== 'undefined' && navigator.mediaDevices && (
                  <button
                    type="button"
                    onClick={() => openCamera('coa')}
                    style={{
                      marginTop: '8px', width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      background: 'transparent', border: '1.5px solid #0D4B3B',
                      color: '#0D4B3B', borderRadius: '8px', padding: '8px 16px',
                      fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    Ambil Foto dengan Kamera
                  </button>
                )}

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
                {!faktur && typeof navigator !== 'undefined' && navigator.mediaDevices && (
                  <button
                    type="button"
                    onClick={() => openCamera('faktur')}
                    style={{
                      marginTop: '8px', width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      background: 'transparent', border: '1.5px solid #0D4B3B',
                      color: '#0D4B3B', borderRadius: '8px', padding: '8px 16px',
                      fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                    </svg>
                    Ambil Foto dengan Kamera
                  </button>
                )}

                {/* Slot 4 - Dokumen Lain */}
                <div style={{
                  background: 'white', border: '1.5px solid #E5E7EB',
                  borderRadius: '12px', padding: '20px',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0D4B3B'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px',
                      fontSize: '11px', fontWeight: '600',
                      background: '#F3F4F6', color: '#6B7280'
                    }}>OPSIONAL</span>
                    <h3 style={{fontSize: '15px', fontWeight: '600', color: '#0F1A16'}}>Sertifikat Halal / MSDS / Dokumen Lain</h3>
                  </div>
                  <p style={{fontSize: '13px', color: '#6B7280', marginBottom: '12px'}}>Sertifikat halal, MSDS untuk B3, atau dokumen pendukung lainnya (max 3 file)</p>
                  
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      if (e.target.files) handleDokumenLainSelect(e.target.files);
                    }}
                    style={{display: 'none'}}
                    id="dokumen-lain-input"
                  />
                  <label
                    htmlFor="dokumen-lain-input"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      border: '2px dashed rgba(13,75,59,0.2)', borderRadius: '8px',
                      padding: '16px', cursor: 'pointer',
                      transition: 'border-color 0.2s, background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#0D4B3B';
                      e.currentTarget.style.background = '#F0FAF7';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(13,75,59,0.2)';
                      e.currentTarget.style.background = 'white';
                    }}
                  >
                    <ArrowUpTrayIcon style={{height: '20px', width: '20px', color: '#0D4B3B'}} />
                    <span style={{fontSize: '14px', color: '#6B7280'}}>Pilih file atau drag & drop</span>
                  </label>
                  
                  {dokumenLain.length < 3 && typeof navigator !== 'undefined' && navigator.mediaDevices && (
                    <button
                      type="button"
                      onClick={() => openCamera('dokumen_lain')}
                      style={{
                        marginTop: '8px', width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: 'transparent', border: '1.5px solid #0D4B3B',
                        color: '#0D4B3B', borderRadius: '8px', padding: '8px 16px',
                        fontSize: '13px', fontWeight: '500', cursor: 'pointer'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                      </svg>
                      Ambil Foto dengan Kamera
                    </button>
                  )}
                  
                  {dokumenLain.length > 0 && (
                    <div style={{marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      {dokumenLain.map((file, index) => (
                        <div key={index} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: '#DCFCE7', border: '1px solid #16A34A', borderRadius: '8px',
                          padding: '8px 12px'
                        }}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <DocumentIcon style={{height: '16px', width: '16px', color: '#16A34A'}} />
                            <span style={{fontSize: '13px', color: '#0F1A16'}}>{file.name}</span>
                            <span style={{fontSize: '11px', color: '#6B7280'}}>({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDokumenLain(index)}
                            style={{background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: 0}}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#991B1B'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#DC2626'}
                          >
                            <XMarkIcon style={{height: '16px', width: '16px'}} />
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
                    <span className="text-[#0F1A16] font-medium">{formState.referenceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Vendor:</span>
                    <span className="text-[#0F1A16] font-medium">{formState.vendorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Bahan Baku:</span>
                    <span className="text-[#0F1A16] font-medium">{formState.materialName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Nomor Batch:</span>
                    <span className="text-[#0F1A16] font-medium">{formState.batchNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Jumlah:</span>
                    <span className="text-[#0F1A16] font-medium">{formState.quantity} {formState.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Kondisi Kemasan:</span>
                    <span className="text-[#0F1A16] font-medium">{formState.packagingCondition}</span>
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
                style={{
                  width: '100%', height: '52px',
                  background: '#0D4B3B', color: 'white',
                  borderRadius: '8px', fontWeight: '700', fontSize: '16px',
                  marginTop: '24px', cursor: (!suratJalan || isLoading) ? 'not-allowed' : 'pointer',
                  border: 'none', opacity: (!suratJalan || isLoading) ? 0.6 : 1,
                  transition: 'background 0.2s, transform 0.2s, opacity 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (suratJalan && !isLoading) e.currentTarget.style.background = '#0a3d30';
                }}
                onMouseOut={(e) => e.currentTarget.style.background = '#0D4B3B'}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: '20px', height: '20px',
                      border: '2px solid white', borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    Sedang Memproses...
                  </>
                ) : (
                  <>
                    Submit untuk Verifikasi
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
      
      {showCamera && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.92)', zIndex: 1000,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '20px'
        }}>
          <p style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>
            Ambil foto dokumen
          </p>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              maxWidth: '500px', width: '100%', borderRadius: '12px',
              border: '2px solid #2DD4BF'
            }}
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={capturePhoto}
              style={{
                background: '#0D4B3B', color: 'white', border: 'none',
                borderRadius: '8px', padding: '12px 28px',
                fontSize: '15px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              Ambil Gambar
            </button>
            <button
              onClick={closeCamera}
              style={{
                background: 'transparent', color: 'white',
                border: '1.5px solid rgba(255,255,255,0.4)',
                borderRadius: '8px', padding: '12px 28px',
                fontSize: '15px', cursor: 'pointer'
              }}
            >
              Batal
            </button>
          </div>
        </div>
      )}
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
