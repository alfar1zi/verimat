import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpTrayIcon, DocumentIcon, XMarkIcon, ShieldCheckIcon, DocumentTextIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowRightCircleIcon, ChevronLeftIcon, CheckIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";
import { FieldTooltip } from "../../components/app/FieldTooltip";
import { ProgressOverlay } from "../../components/app/ProgressOverlay";
import { apiFetch } from "../../lib/api";

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

interface MaterialItem {
  id: string;
  materialCode: string;
  materialName: string;
  batchNumber: string;
  quantity: string;
  unit: string;
  expiryDate: string;
}

const STORAGE_KEY = 'verimat_form_draft';
const STORAGE_VERSION = 'v2'; // Increment when form structure changes

function getExpiryStatus(expiryDate: string): {
  isExpired: boolean;
  isNearExpiry: boolean;
  label: string;
  color: string;
} {
  if (!expiryDate) return { isExpired: false, isNearExpiry: false, label: '', color: '' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);

  const diffMs = exp.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    let ago = '';
    if (absDays >= 30) {
      const months = Math.floor(absDays / 30);
      ago = `${months} bulan yang lalu`;
    } else if (absDays >= 7) {
      const weeks = Math.floor(absDays / 7);
      ago = `${weeks} minggu yang lalu`;
    } else {
      ago = `${absDays} hari yang lalu`;
    }
    return {
      isExpired: true,
      isNearExpiry: false,
      label: `Sudah expired ${ago}. Bahan baku tidak dapat diterima.`,
      color: '#DC2626'
    };
  }

  if (diffDays === 0) {
    return {
      isExpired: false,
      isNearExpiry: true,
      label: 'Expired hari ini. Pastikan dapat habis terpakai sebelum akhir hari.',
      color: '#D97706'
    };
  }

  if (diffDays <= 180) {
    let remaining = '';
    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      remaining = days > 0 ? `${months} bulan ${days} hari` : `${months} bulan`;
    } else if (diffDays >= 7) {
      const weeks = Math.floor(diffDays / 7);
      const days = diffDays % 7;
      remaining = days > 0 ? `${weeks} minggu ${days} hari` : `${weeks} minggu`;
    } else {
      remaining = `${diffDays} hari`;
    }
    return {
      isExpired: false,
      isNearExpiry: true,
      label: `Perhatian: Akan expired dalam ${remaining}. Pastikan dapat habis terpakai sebelum tanggal tersebut.`,
      color: '#D97706'
    };
  }

  return { isExpired: false, isNearExpiry: false, label: '', color: '' };
}

function useVendorSuggestions() {
  const [vendorSuggestions, setVendorSuggestions] = useState<string[]>([]);
  const fetchedRef = useRef(false);
  
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    apiFetch('/api/vendors/list')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setVendorSuggestions(data.map((v: any) => 
            typeof v === 'string' ? v : (v.name || v.vendor_name || '')
          ).filter(Boolean));
        } else {
          // Fallback seed data jika endpoint return kosong
          setVendorSuggestions([
            'PT Kimia Farma', 'PT Kalbe Farma', 'PT Dexa Medica',
            'PT Sanbe Farma', 'PT Phapros', 'PT Bernofarm',
            'PT Meprofarm', 'PT Ferron Par Pharmaceuticals',
            'PT Novell Pharmaceutical Labs', 'PT Zenith Pharmaceutical'
          ]);
        }
      })
      .catch(() => {
        // Fallback seed data jika endpoint tidak ada
        setVendorSuggestions([
          'PT Kimia Farma', 'PT Kalbe Farma', 'PT Dexa Medica',
          'PT Sanbe Farma', 'PT Phapros', 'PT Bernofarm',
          'PT Meprofarm', 'PT Ferron Par Pharmaceuticals',
          'PT Novell Pharmaceutical Labs', 'PT Zenith Pharmaceutical'
        ]);
      });
  }, []);
  
  return vendorSuggestions;
}

function useMaterialCodes() {
  const [materials, setMaterials] = useState<Array<{code: string, name: string}>>([]);
  const fetchedRef = useRef(false);
  
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    
    // Coba endpoint materials
    apiFetch('/api/materials/list')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMaterials(data.map((m: any) => ({
            code: m.material_code || m.code || '',
            name: m.material_name || m.name || '',
          })).filter(m => m.code));
        }
      })
      .catch(() => {
        // Fallback: hardcode material codes yang ada di seed data
        setMaterials([
          { code: 'P1', name: 'Paracetamol' },
          { code: 'P2', name: 'Paracetamol 500mg Tablet' },
          { code: 'C1', name: 'Caffeine' },
          { code: 'C2', name: 'Chloramphenicol' },
          { code: 'A1', name: 'Amoxicillin' },
          { code: 'A2', name: 'Aspirin' },
          { code: 'I1', name: 'Ibuprofen' },
          { code: 'M1', name: 'Metformin' },
          { code: 'D1', name: 'Diclofenac Sodium' },
          { code: 'E1', name: 'Erythromycin' },
        ]);
      });
  }, []);
  
  return materials;
}

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Check storage version and clear if outdated
  useEffect(() => {
    const savedVersion = sessionStorage.getItem(STORAGE_KEY + '_version');
    if (savedVersion !== STORAGE_VERSION) {
      // Clear all old storage to prevent conflicts
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY + '_files');
      sessionStorage.removeItem(STORAGE_KEY + '_items');
      sessionStorage.removeItem(STORAGE_KEY + '_step');
      sessionStorage.setItem(STORAGE_KEY + '_version', STORAGE_VERSION);
    }
  }, []);

  // Step management with persistence
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const savedVersion = sessionStorage.getItem(STORAGE_KEY + '_version');
      if (savedVersion !== STORAGE_VERSION) return 1;
      return parseInt(sessionStorage.getItem(STORAGE_KEY + '_step') || '1');
    } catch {
      return 1;
    }
  });
  
  // Step 1 fields with persistence (removed item-specific fields, now in items array)
  const [formState, setFormState] = useState(() => {
    try {
      const savedVersion = sessionStorage.getItem(STORAGE_KEY + '_version');
      if (savedVersion !== STORAGE_VERSION) {
        return {
          referenceNumber: '',
          vendorName: '',
          documentDate: new Date().toISOString().split('T')[0],
          packagingCondition: '',
          storageCondition: 'Tidak Diperlukan',
          temperature: '',
          notes: '',
        };
      }
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return {
          referenceNumber: '',
          vendorName: '',
          documentDate: new Date().toISOString().split('T')[0],
          packagingCondition: '',
          storageCondition: 'Tidak Diperlukan',
          temperature: '',
          notes: '',
        };
      }
      const parsed = JSON.parse(saved);
      // Validate that parsed data has expected structure
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid saved data');
      }
      return {
        referenceNumber: parsed.referenceNumber || '',
        vendorName: parsed.vendorName || '',
        documentDate: parsed.documentDate || new Date().toISOString().split('T')[0],
        packagingCondition: parsed.packagingCondition || '',
        storageCondition: parsed.storageCondition || 'Tidak Diperlukan',
        temperature: parsed.temperature || '',
        notes: parsed.notes || '',
      };
    } catch {
      return {
        referenceNumber: '',
        vendorName: '',
        documentDate: new Date().toISOString().split('T')[0],
        packagingCondition: '',
        storageCondition: 'Tidak Diperlukan',
        temperature: '',
        notes: '',
      };
    }
  });

  // Multi-item material list
  const [items, setItems] = useState<MaterialItem[]>(() => {
    try {
      const savedVersion = sessionStorage.getItem(STORAGE_KEY + '_version');
      if (savedVersion !== STORAGE_VERSION) return [];
      const saved = sessionStorage.getItem(STORAGE_KEY + '_items');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      // Validate each item has required structure
      return parsed.filter(item => item && typeof item === 'object' && item.id);
    } catch {
      return [];
    }
  });
  
  // File names persistence (can't store File objects in sessionStorage)
  const [fileNames, setFileNames] = useState(() => {
    try {
      const savedVersion = sessionStorage.getItem(STORAGE_KEY + '_version');
      if (savedVersion !== STORAGE_VERSION) {
        return { suratJalan: null, coa: null, faktur: null, dokumenLain: [] };
      }
      const saved = sessionStorage.getItem(STORAGE_KEY + '_files');
      if (!saved) {
        return { suratJalan: null, coa: null, faktur: null, dokumenLain: [] };
      }
      const parsed = JSON.parse(saved);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { suratJalan: null, coa: null, faktur: null, dokumenLain: [] };
      }
      return {
        suratJalan: parsed.suratJalan || null,
        coa: parsed.coa || null,
        faktur: parsed.faktur || null,
        dokumenLain: Array.isArray(parsed.dokumenLain) ? parsed.dokumenLain : []
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
  const [dokumenLainSubtype, setDokumenLainSubtype] = useState('halal');
  
  // Search suggestions
  const [poSuggestions, setPoSuggestions] = useState<POSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Vendor autocomplete - use hook as data source
  const allVendorSuggestions = useVendorSuggestions();
  const [showVendorSuggestions, setShowVendorSuggestions] = useState(false);
  const [vendorSuggestions, setVendorSuggestions] = useState<string[]>([]);
  const vendorSearchRef = useRef<HTMLDivElement>(null);
  
  // Material autocomplete - use custom hook
  const materialCodes = useMaterialCodes();
  
  // Camera capture
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'surat_jalan' | 'coa' | 'faktur' | 'dokumen_lain' | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Preview for dokumen_lain files
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  
  // Material dropdown state - track which item's dropdown is open
  const [openMaterialDropdown, setOpenMaterialDropdown] = useState<string | null>(null);
  
  const openPreview = (file: File) => {
    setPreviewFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowPreview(true);
  };
  
  const closePreview = () => {
    setShowPreview(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewFile(null);
  };
  
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
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  
  // Progress state
  const [progressStep, setProgressStep] = useState(0);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Item management functions
  const addItem = () => {
    const newItem: MaterialItem = {
      id: Date.now().toString(),
      materialCode: '',
      materialName: '',
      batchNumber: '',
      quantity: '',
      unit: 'kg',
      expiryDate: '',
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    const newErrors = { ...itemErrors };
    delete newErrors[id];
    setItemErrors(newErrors);
  };

  const updateItem = (id: string, field: keyof MaterialItem, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
    // Clear error for this item if field is updated
    if (itemErrors[id]) {
      const newErrors = { ...itemErrors };
      delete newErrors[id];
      setItemErrors(newErrors);
    }
  };

  // Persist form state
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formState));
    sessionStorage.setItem(STORAGE_KEY + '_version', STORAGE_VERSION);
  }, [formState]);
  
  // Persist file names
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY + '_files', JSON.stringify(fileNames));
    sessionStorage.setItem(STORAGE_KEY + '_version', STORAGE_VERSION);
  }, [fileNames]);

  // Persist items
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY + '_items', JSON.stringify(items));
    sessionStorage.setItem(STORAGE_KEY + '_version', STORAGE_VERSION);
  }, [items]);
  
  // Persist step
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY + '_step', currentStep.toString());
    sessionStorage.setItem(STORAGE_KEY + '_version', STORAGE_VERSION);
  }, [currentStep]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (vendorSearchRef.current && !vendorSearchRef.current.contains(event.target as Node)) {
        setShowVendorSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiFetch('/api/audit/list');
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
      const response = await apiFetch(`/api/po/search?q=${encodeURIComponent(query)}`);
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
    setFormState({ ...formState, referenceNumber: suggestion.po_number });
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
    const itemErrs: Record<string, string> = {};
    
    if (!formState.referenceNumber.trim()) errors.referenceNumber = "Nomor referensi wajib diisi";
    if (!formState.vendorName.trim()) errors.vendorName = "Nama vendor wajib diisi";
    if (!formState.documentDate) errors.documentDate = "Tanggal wajib diisi";
    if (!formState.packagingCondition) errors.packagingCondition = "Kondisi kemasan wajib dipilih";
    
    // Validate items - at least one item required
    if (items.length === 0) {
      errors.items = "Minimal 1 item material wajib ditambahkan";
    } else {
      // Validate each item
      items.forEach((item, index) => {
        const itemError: string[] = [];
        if (!item.materialName.trim()) itemError.push("Nama bahan wajib diisi");
        if (!item.batchNumber.trim()) itemError.push("Batch wajib diisi");
        if (!item.quantity || parseFloat(item.quantity) <= 0) itemError.push("Jumlah wajib diisi");
        if (!item.expiryDate) {
          itemError.push("Expired Date wajib diisi");
        } else {
          const status = getExpiryStatus(item.expiryDate);
          if (status.isExpired) {
            itemError.push(`Item #${index + 1}: ${status.label}`);
          }
        }
        if (itemError.length > 0) {
          itemErrs[item.id] = `Item ${index + 1}: ${itemError.join(', ')}`;
        }
      });
    }
    
    if (Object.keys(itemErrs).length > 0) {
      setItemErrors(itemErrs);
    }
    
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
      sessionStorage.removeItem(STORAGE_KEY + '_items');
      sessionStorage.removeItem(STORAGE_KEY + '_step');
      sessionStorage.removeItem(STORAGE_KEY + '_version');
      setFormState({
        referenceNumber: '',
        vendorName: '',
        documentDate: new Date().toISOString().split('T')[0],
        packagingCondition: '',
        storageCondition: 'Tidak Diperlukan',
        temperature: '',
        notes: '',
      });
      setItems([]);
      setItemErrors({});
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!suratJalan) {
      setError("Surat Jalan wajib diupload");
      return;
    }

    setIsLoading(true);
    setError("");
    setProgressError(null);
    setProgressStep(1);

    // Simulate progress steps
    const simulateProgress = async () => {
      const stepDurations = [2500, 3000, 2500, 3000, 2000, 1500]; // ms per step
      
      for (let i = 0; i < stepDurations.length; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDurations[i]));
        if (progressError) return; // Stop if error occurred
        setProgressStep(i + 2);
      }
    };

    // Start progress simulation
    const progressPromise = simulateProgress();

    const formData = new FormData();
    formData.append("surat_jalan", suratJalan);
    if (coa) formData.append("coa", coa);
    if (faktur) formData.append("faktur", faktur);
    dokumenLain.forEach((file) => formData.append("dokumen_lain", file));
    formData.append("dokumen_lain_subtype", dokumenLainSubtype);
    
    formData.append("reference_number", formState.referenceNumber);
    formData.append("vendor_name", formState.vendorName);
    formData.append("document_date", formState.documentDate);
    formData.append("packaging_condition", formState.packagingCondition);
    formData.append("storage_condition", formState.storageCondition);
    if (formState.temperature) formData.append("temperature", formState.temperature);
    if (formState.notes) formData.append("notes", formState.notes);
    
    // Send items_json for multi-item support
    formData.append("items_json", JSON.stringify(items));
    
    // Backward compatibility: use first item's values for legacy fields
    if (items.length > 0) {
      const firstItem = items[0];
      formData.append("material_name", firstItem.materialName);
      formData.append("batch_number", firstItem.batchNumber);
      formData.append("quantity", firstItem.quantity);
      formData.append("unit", firstItem.unit);
      formData.append("expiry_date", firstItem.expiryDate);
      formData.append("material_code", firstItem.materialCode);
    }

    try {
      // Wait for progress simulation to complete (or at least reach step 4)
      await new Promise(resolve => setTimeout(resolve, 10000));

      const response = await apiFetch('/api/upload/verify', {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      const data = await response.json();
      
      // Wait for progress to complete
      await progressPromise;
      
      // Clear session on success
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY + '_files');
      sessionStorage.removeItem(STORAGE_KEY + '_items');
      sessionStorage.removeItem(STORAGE_KEY + '_step');
      
      navigate(`/verification/${data.session_id}`);
    } catch (error: any) {
      setProgressError(
        error.message.includes('fetch') 
          ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
          : error.message || 'Terjadi kesalahan saat memproses dokumen.'
      );
    } finally {
      setIsLoading(false);
      if (!progressError) {
        setProgressStep(0);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F6] overflow-x-hidden">
      <AppNavbar />
      
      {/* Progress Overlay */}
      {progressStep > 0 && (
        <ProgressOverlay
          currentStep={progressStep}
          error={progressError}
          onRetry={() => {
            setProgressError(null);
            setProgressStep(0);
            handleSubmit(undefined);
          }}
        />
      )}
      
      <div className="max-w-[900px] mx-auto w-full" style={{ padding: 'clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)', boxSizing: 'border-box' }}>
        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold text-[#0F1A16]">Verifikasi Dokumen Baru</h1>
          <p className="text-[14px] text-[#4A5568] mt-1">
            Upload dokumen penerimaan untuk verifikasi otomatis sesuai standar CPOB
          </p>
        </div>

        {/* Stats Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full">
          {/* Total Card */}
          <div className="animate-fade-in-up card-hover delay-100" style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: 'clamp(12px, 4vw, 20px) clamp(12px, 4vw, 24px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #0D4B3B',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', width: '100%', boxSizing: 'border-box', minWidth: 0
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
          <div className="animate-fade-in-up card-hover delay-200" style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: 'clamp(12px, 4vw, 20px) clamp(12px, 4vw, 24px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #16A34A',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', width: '100%', boxSizing: 'border-box', minWidth: 0
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
          <div className="animate-fade-in-up card-hover delay-300" style={{
            flex: 1, background: 'white', borderRadius: '12px',
            padding: 'clamp(12px, 4vw, 20px) clamp(12px, 4vw, 24px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            borderLeft: '4px solid #DC2626',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', width: '100%', boxSizing: 'border-box', minWidth: 0
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '32px', marginBottom: '32px', gap: '0', overflowX: 'auto', width: '100%', maxWidth: '100%' }}>
          <div className="flex items-center gap-0">
            <div className="flex flex-col items-center">
              <div 
                onClick={() => currentStep > 1 && setCurrentStep(1)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: currentStep >= 1 ? '#0D4B3B' : '#E5E7EB',
                  color: currentStep >= 1 ? 'white' : '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '700',
                  boxShadow: currentStep >= 1 ? '0 0 0 4px rgba(13,75,59,0.15)' : 'none',
                  position: 'relative', zIndex: 1,
                  cursor: currentStep > 1 ? 'pointer' : 'default'
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
              height: '2px', width: '60px', marginBottom: '22px',
              background: currentStep > 1 ? '#16A34A' : '#E5E7EB',
              transition: 'background 0.3s ease'
            }} />
            <div className="flex flex-col items-center">
              <div 
                onClick={() => currentStep > 2 && setCurrentStep(2)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: currentStep >= 2 ? '#0D4B3B' : '#E5E7EB',
                  color: currentStep >= 2 ? 'white' : '#9CA3AF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: '700',
                  boxShadow: currentStep >= 2 ? '0 0 0 4px rgba(13,75,59,0.15)' : 'none',
                  position: 'relative', zIndex: 1,
                  cursor: currentStep > 2 ? 'pointer' : 'default'
                }}>
                {currentStep > 2 ? <CheckIcon className="h-4 w-4" /> : '2'}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: currentStep === 2 ? '600' : '400',
                color: currentStep === 2 ? '#0D4B3B' : '#9CA3AF',
                marginTop: '6px', textAlign: 'center'
              }}>Dokumen</span>
            </div>
            <div style={{
              height: '2px', width: '60px', marginBottom: '22px',
              background: currentStep > 2 ? '#16A34A' : '#E5E7EB',
              transition: 'background 0.3s ease'
            }} />
            <div className="flex flex-col items-center">
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: currentStep >= 3 ? '#0D4B3B' : '#E5E7EB',
                color: currentStep >= 3 ? 'white' : '#9CA3AF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: '700',
                boxShadow: currentStep >= 3 ? '0 0 0 4px rgba(13,75,59,0.15)' : 'none',
                position: 'relative', zIndex: 1
              }}>
                3
              </div>
              <span style={{
                fontSize: '11px', fontWeight: currentStep === 3 ? '600' : '400',
                color: currentStep === 3 ? '#0D4B3B' : '#9CA3AF',
                marginTop: '6px', textAlign: 'center'
              }}>Konfirmasi</span>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm animate-fade-in-up" style={{ padding: 'clamp(16px, 4vw, 32px)' }}>
          {currentStep === 1 ? (
            <>
              <h2 className="text-[18px] font-bold text-[#0F1A16] mb-6">Informasi Pengiriman</h2>
              
              {/* Row 1 */}
              <div className="form-grid-2">
                <div className="relative" ref={searchRef} data-error={fieldErrors.referenceNumber ? 'true' : undefined} style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Nomor Referensi Dokumen <span style={{color: '#DC2626'}}>*</span>
                    <FieldTooltip text="Nomor unik dari Surat Jalan yang diberikan supplier. Biasanya tercetak di bagian atas dokumen pengiriman." />
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
                {/* Vendor Name Input */}
                <div ref={vendorSearchRef} style={{ position: 'relative' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                    Nama Vendor / Supplier <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px' }}>
                    Nama perusahaan supplier pengirim
                  </p>
                  <input
                    type="text"
                    placeholder="Nama perusahaan supplier"
                    value={formState.vendorName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormState({ ...formState, vendorName: val });
                      if (fieldErrors.vendorName) setFieldErrors({ ...fieldErrors, vendorName: '' });
                      
                      // Filter dari cached data (tidak perlu fetch setiap ketik)
                      if (val.trim().length >= 1) {
                        const filtered = allVendorSuggestions.filter(v =>
                          v.toLowerCase().includes(val.toLowerCase())
                        ).slice(0, 8);
                        setVendorSuggestions(filtered);
                        setShowVendorSuggestions(filtered.length > 0);
                      } else {
                        setShowVendorSuggestions(false);
                        setVendorSuggestions([]);
                      }
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0D4B3B';
                      e.target.style.boxShadow = '0 0 0 3px rgba(13,75,59,0.1)';
                      // Tampilkan suggestions saat focus jika sudah ada input
                      if (formState.vendorName.trim().length >= 1) {
                        const filtered = allVendorSuggestions.filter(v =>
                          v.toLowerCase().includes(formState.vendorName.toLowerCase())
                        ).slice(0, 8);
                        setVendorSuggestions(filtered);
                        setShowVendorSuggestions(filtered.length > 0);
                      }
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.vendorName ? '#DC2626' : '#E5E7EB';
                      e.target.style.boxShadow = 'none';
                      // Delay hide agar click pada suggestion sempat diproses
                      setTimeout(() => setShowVendorSuggestions(false), 200);
                    }}
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: fieldErrors.vendorName ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: '14px', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none', boxSizing: 'border-box' as const
                    }}
                    autoComplete="off"
                  />

                  {/* Vendor Dropdown */}
                  {showVendorSuggestions && vendorSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', marginTop: '4px'
                    }}>
                      {vendorSuggestions.map((vendor, index) => (
                        <div
                          key={index}
                          onMouseDown={(e) => {
                            // mouseDown bukan onClick agar tidak kalah dengan onBlur
                            e.preventDefault();
                            setFormState({ ...formState, vendorName: vendor });
                            setShowVendorSuggestions(false);
                            setVendorSuggestions([]);
                          }}
                          style={{
                            padding: '10px 14px', fontSize: '14px', color: '#0F1A16',
                            cursor: 'pointer',
                            borderBottom: index < vendorSuggestions.length - 1 ? '1px solid #F3F4F6' : 'none'
                          }}
                          onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#F0FAF7'; }}
                          onMouseOut={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'white'; }}
                        >
                          {vendor}
                        </div>
                      ))}
                      <div style={{
                        padding: '6px 14px', fontSize: '11px', color: '#9CA3AF',
                        borderTop: '1px solid #F3F4F6', background: '#FAFAFA'
                      }}>
                        Tidak ada? Ketik nama vendor baru secara manual
                      </div>
                    </div>
                  )}

                  {fieldErrors.vendorName && (
                    <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px' }}>
                      {fieldErrors.vendorName}
                    </p>
                  )}
                </div>
              </div>

              {/* Multi-Item Material List */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#374151] flex items-center gap-1">
                      Daftar Material/Bahan Baku <span className="text-[#DC2626]">*</span>
                    </label>
                    <p className="text-[11px] text-[#9CA3AF] mt-1">Tambahkan semua item dalam pengiriman ini</p>
                  </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 bg-[#0D4B3B] text-white rounded-lg text-[13px] font-medium hover:bg-[#0a3d30] transition-colors"
                  >
                    + Tambah Item
                  </button>
                </div>

                {fieldErrors.items && (
                  <p className="text-[12px] text-[#DC2626] mb-3">{fieldErrors.items}</p>
                )}

                {items.length === 0 ? (
                  <div className="text-center py-8 bg-[#F9FAFB] border border-dashed border-[#E5E7EB] rounded-lg">
                    <p className="text-[13px] text-[#6B7280]">Belum ada item. Klik "Tambah Item" untuk menambahkan bahan baku.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="bg-[#F8FFFE] border border-[#E5E7EB] rounded-xl p-4" style={{ animation: 'fadeInUp 0.3s ease forwards', overflow: 'hidden', boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] font-semibold text-[#0D4B3B]">Item #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-[#DC2626] text-[12px] hover:underline"
                          >
                            Hapus
                          </button>
                        </div>

                        {itemErrors[item.id] && (
                          <div className="mb-3 p-2 bg-[#FEF2F2] border border-[#FECACA] rounded text-[11px] text-[#DC2626]">
                            {itemErrors[item.id]}
                          </div>
                        )}

                        {/* Baris 1: Kode Bahan + Nama Bahan */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 2fr',
                          gap: '10px',
                          marginBottom: '12px',
                        }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                              Kode Bahan <FieldTooltip text="Kode internal bahan baku. Ketik kode (contoh: P1, C2) dan nama bahan akan otomatis terisi." />
                            </label>
                            <div style={{ position: 'relative' }}>
                              <input
                                type="text"
                                value={item.materialCode || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateItem(item.id, 'materialCode', val);
                                  setOpenMaterialDropdown(val.trim().length > 0 ? item.id : null);
                                  
                                  // Auto-fill nama jika exact match
                                  const exact = materialCodes.find(
                                    m => m.code.toLowerCase() === val.toLowerCase()
                                  );
                                  if (exact) {
                                    updateItem(item.id, 'materialName', exact.name);
                                  }
                                }}
                                onFocus={() => {
                                  if ((item.materialCode || '').trim().length > 0) {
                                    setOpenMaterialDropdown(item.id);
                                  }
                                }}
                                onBlur={() => {
                                  // Delay agar click suggestion sempat diproses
                                  setTimeout(() => setOpenMaterialDropdown(null), 200);
                                }}
                                placeholder="Contoh: P1"
                                style={{
                                  width: '100%', padding: '10px 12px',
                                  border: '1px solid #E5E7EB',
                                  borderRadius: '8px', fontSize: '14px',
                                  boxSizing: 'border-box' as const
                                }}
                                autoComplete="off"
                              />

                              {/* Dropdown — hanya tampil jika item ini yang aktif */}
                              {openMaterialDropdown === item.id && (() => {
                                // FIX: filter HANYA berdasarkan code, bukan name
                                const filteredCodes = materialCodes.filter(m =>
                                  m.code.toLowerCase().startsWith((item.materialCode || '').toLowerCase())
                                ).slice(0, 8);

                                // Fallback ke includes jika startsWith tidak menghasilkan hasil
                                const displayCodes = filteredCodes.length > 0 ? filteredCodes :
                                  materialCodes.filter(m =>
                                    m.code.toLowerCase().includes((item.materialCode || '').toLowerCase())
                                  ).slice(0, 8);

                                return displayCodes.length > 0 ? (
                                  <div style={{
                                    position: 'absolute', top: '100%', left: 0, right: 0,
                                    background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 100,
                                    maxHeight: '200px', overflowY: 'auto', marginTop: '2px',
                                  }}>
                                    {displayCodes.map(m => (
                                      <button
                                        key={m.code}
                                        type="button"
                                        onMouseDown={(e) => {
                                          // mouseDown bukan onClick agar tidak kalah dengan onBlur
                                          e.preventDefault();
                                          updateItem(item.id, 'materialCode', m.code);
                                          updateItem(item.id, 'materialName', m.name);
                                          setOpenMaterialDropdown(null); // tutup dropdown
                                        }}
                                        style={{
                                          width: '100%', textAlign: 'left',
                                          padding: '8px 12px', border: 'none',
                                          background: 'none', cursor: 'pointer',
                                          fontSize: '13px', display: 'flex',
                                          gap: '8px', alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F0FAF7')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                      >
                                        <span style={{
                                          fontWeight: '600', color: '#0D4B3B',
                                          fontFamily: 'monospace', fontSize: '12px',
                                          background: '#F0FAF7', padding: '1px 6px', borderRadius: '4px'
                                        }}>
                                          {m.code}
                                        </span>
                                        <span style={{ color: '#374151' }}>{m.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                              Nama Bahan <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                              type="text"
                              value={item.materialName}
                              onChange={(e) => updateItem(item.id, 'materialName', e.target.value)}
                              placeholder="Paracetamol"
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', 
                                       borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>

                        {/* Baris 2: Batch + Jumlah (full width masing-masing, di mobile stack) */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: '10px',
                          marginBottom: '12px',
                        }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                              Nomor Batch <span style={{ color: 'red' }}>*</span>
                              <FieldTooltip text="Kode produksi unik dari supplier untuk membedakan setiap kelompok produksi bahan baku ini." />
                            </label>
                            <input
                              type="text"
                              value={item.batchNumber}
                              onChange={(e) => updateItem(item.id, 'batchNumber', e.target.value)}
                              placeholder="BTX-2024-..."
                              style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', 
                                       borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                              Jumlah <span style={{ color: 'red' }}>*</span>
                              <FieldTooltip text="Jumlah bahan baku yang diterima sesuai Surat Jalan. Akan dicocokkan dengan jumlah di PO." />
                            </label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                placeholder="0"
                                style={{ flex: 1, padding: '10px 12px', border: '1px solid #E5E7EB', 
                                         borderRadius: '8px', fontSize: '14px', minWidth: 0, boxSizing: 'border-box' }}
                              />
                              <select
                                value={item.unit}
                                onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                                style={{ width: '72px', padding: '10px 4px', border: '1px solid #E5E7EB',
                                         borderRadius: '8px', fontSize: '13px', flexShrink: 0 }}
                              >
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="L">L</option>
                                <option value="ml">ml</option>
                                <option value="pcs">pcs</option>
                                <option value="box">box</option>
                                <option value="drum">drum</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Baris 3: Expired Date — full width */}
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                            Expired Date <span style={{ color: 'red' }}>*</span>
                            <FieldTooltip text="Tanggal kedaluwarsa bahan baku. Sistem akan otomatis memperingatkan jika kurang dari 6 bulan." />
                          </label>
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => updateItem(item.id, 'expiryDate', e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB',
                                     borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                          />
                          {item.expiryDate && (() => {
                            const status = getExpiryStatus(item.expiryDate);
                            if (!status.label) return null;
                            return (
                              <div style={{
                                marginTop: '6px',
                                padding: '8px 12px',
                                background: status.isExpired ? '#FEF2F2' : '#FFFBEB',
                                border: `1px solid ${status.isExpired ? '#FECACA' : '#FDE68A'}`,
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: status.color,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '6px'
                              }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"
                                     viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                                     style={{ flexShrink: 0, marginTop: '1px' }}>
                                  <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                  </svg>
                                  {status.label}
                                </div>
                              );
                            })()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document Date */}
              <div className="mt-5">
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
              </div>

              {/* Row: Kondisi Kemasan + Kondisi Penyimpanan */}
              <div className="form-grid-2 mt-5">
                {/* Kolom kiri: Kondisi Kemasan Fisik */}
                <div
                  data-error={fieldErrors.packagingCondition ? 'true' : undefined}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    Kondisi Kemasan Fisik <span style={{ color: '#DC2626' }}>*</span>
                    <FieldTooltip text="Catat kondisi fisik kemasan saat diterima — rusak, basah, sobek, atau baik." />
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px', minHeight: '16px' }}>
                    Kondisi fisik kemasan saat penerimaan
                  </p>
                  <select
                    value={formState.packagingCondition}
                    onChange={(e) => setFormState({ ...formState, packagingCondition: e.target.value })}
                    style={{
                      width: '100%', padding: 'clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 14px)',
                      border: fieldErrors.packagingCondition ? '1.5px solid #DC2626' : '1.5px solid #E5E7EB',
                      borderRadius: '8px', fontSize: 'clamp(13px, 3vw, 14px)', color: '#0F1A16',
                      backgroundColor: 'white', outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      boxSizing: 'border-box' as const, minWidth: 0
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                    onBlur={(e) => e.target.style.borderColor = fieldErrors.packagingCondition ? '#DC2626' : '#E5E7EB'}
                  >
                    <option value="">Pilih kondisi</option>
                    <option value="Baik">Baik: Kemasan utuh dan tidak ada kerusakan</option>
                    <option value="Minor">Minor: Ada kerusakan kecil, bahan masih aman</option>
                    <option value="Rusak">Rusak: Kemasan bocor atau rusak signifikan</option>
                    <option value="Perlu Dicek">Perlu Dicek: Kondisi meragukan</option>
                  </select>
                  {fieldErrors.packagingCondition && (
                    <p style={{ fontSize: '12px', color: '#DC2626', marginTop: '2px' }}>
                      {fieldErrors.packagingCondition}
                    </p>
                  )}
                </div>

                {/* Kolom kanan: Kondisi Penyimpanan / Suhu */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Kondisi Penyimpanan / Suhu
                    <FieldTooltip text="Pilih sesuai instruksi pada label kemasan. Jika tidak ada instruksi khusus, pilih 'Tidak Diperlukan'." />
                  </label>
                  <p style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '6px', minHeight: '16px' }}>
                    Isi jika bahan memerlukan cold chain
                  </p>
                  <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 8px)' }}>
                    <input
                      type="number"
                      value={formState.temperature}
                      onChange={(e) => setFormState({ ...formState, temperature: e.target.value })}
                      placeholder="Suhu (°C)"
                      style={{
                        flex: '0 0 clamp(70px, 20vw, 90px)', padding: 'clamp(8px, 2.5vw, 10px)',
                        border: '1.5px solid #E5E7EB', borderRadius: '8px',
                        fontSize: 'clamp(13px, 3vw, 14px)', color: '#0F1A16', backgroundColor: 'white',
                        outline: 'none', transition: 'border-color 0.15s',
                        boxSizing: 'border-box' as const, minWidth: 0
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0D4B3B'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                    <select
                      value={formState.storageCondition}
                      onChange={(e) => setFormState({ ...formState, storageCondition: e.target.value })}
                      style={{
                        flex: 1, padding: 'clamp(8px, 2.5vw, 10px)',
                        border: '1.5px solid #E5E7EB', borderRadius: '8px',
                        fontSize: 'clamp(13px, 3vw, 14px)', color: '#0F1A16', backgroundColor: 'white',
                        outline: 'none', transition: 'border-color 0.15s',
                        boxSizing: 'border-box' as const, minWidth: 0
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
          ) : currentStep === 2 ? (
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

              {/* Info Banner */}
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#1E40AF" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p style={{ fontSize: '12px', color: '#1E40AF', lineHeight: '1.5', margin: 0 }}>
                  <strong>Azure AI Document Intelligence</strong> membaca isi dokumen yang Anda upload secara otomatis dan mengekstrak data seperti nama vendor, batch number, dan jumlah. Jika field tertentu tidak berhasil diekstrak, data dari formulir digunakan sebagai cadangan.
                </p>
              </div>

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
                  tooltip="Dokumen wajib dari supplier yang berisi daftar barang yang dikirim. Bisa berupa PDF atau foto."
                />
                {!suratJalan && typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) && typeof navigator !== 'undefined' && navigator.mediaDevices && (
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
                  tooltip="Certificate of Analysis — laporan hasil uji kualitas dari supplier. Sangat disarankan untuk bahan aktif."
                />
                {!coa && typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) && typeof navigator !== 'undefined' && navigator.mediaDevices && (
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
                  tooltip="Dokumen tagihan dari supplier. Opsional, namun diperlukan untuk rekonsiliasi keuangan."
                />
                {!faktur && typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) && typeof navigator !== 'undefined' && navigator.mediaDevices && (
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
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Jenis Dokumen Ini
                    </label>
                    <select
                      value={dokumenLainSubtype}
                      onChange={(e) => setDokumenLainSubtype(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#374151',
                        background: 'white',
                      }}
                    >
                      <option value="halal">Sertifikat Halal</option>
                      <option value="msds">MSDS / Lembar Data Keselamatan</option>
                      <option value="kwitansi">Kwitansi</option>
                      <option value="tanda_terima">Tanda Terima / Delivery Order</option>
                      <option value="lainnya">Dokumen Lainnya</option>
                    </select>
                  </div>
                  
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
                  
                  {dokumenLain.length < 3 && typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Touch/i.test(navigator.userAgent) && typeof navigator !== 'undefined' && navigator.mediaDevices && (
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
                      {dokumenLain.map((file, fileIdx) => (
                        <div key={fileIdx} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: '#F0FDF4',
                          border: '1px solid #A7F3D0',
                          borderRadius: '8px',
                          marginTop: '8px',
                        }}>
                          {/* Icon + nama file */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                            <span style={{ fontSize: '16px', flexShrink: 0 }}>📄</span>
                            <div style={{ minWidth: 0 }}>
                              <button
                                type="button"
                                onClick={() => openPreview(file)}
                                style={{
                                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <p style={{
                                  fontSize: '13px', fontWeight: '500', color: '#0D4B3B',
                                  margin: 0,
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  maxWidth: '180px',
                                }} title={file.name}>
                                  {file.name.length > 22 
                                    ? file.name.substring(0, 10) + '...' + file.name.slice(-8) 
                                    : file.name}
                                </p>
                                <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>
                                  ({(file.size / 1024).toFixed(1)} KB) · tap untuk preview
                                </p>
                              </button>
                            </div>
                          </div>
                          
                          {/* Hapus tombol */}
                          <button
                            type="button"
                            onClick={() => removeDokumenLain(fileIdx)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#DC2626' }}
                            aria-label="Hapus file ini"
                          >
                            ✕
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
                  {/* Items List */}
                  <div className="border-t border-[#E5E7EB] pt-2">
                    <span className="text-[#6B7280] text-[13px]">Item Material:</span>
                    {items.map((item, idx) => (
                      <div key={item.id} className="mt-2 p-2 bg-[#F8FFFE] rounded-lg">
                        <div className="flex justify-between">
                          <span className="text-[#6B7280] text-[12px]">Item #{idx + 1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#0F1A16] font-medium">{item.materialName}</span>
                          {item.materialCode && <span className="text-[#0D4B3B] text-[12px]">({item.materialCode})</span>}
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-[#6B7280]">Batch: {item.batchNumber}</span>
                          <span className="text-[#0F1A16]">{item.quantity} {item.unit}</span>
                        </div>
                        <div className="text-[12px] text-[#6B7280]">
                          ED: {item.expiryDate || '-'}
                        </div>
                      </div>
                    ))}
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

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={!suratJalan}
                style={{
                  width: '100%', height: '52px',
                  background: '#0D4B3B', color: 'white',
                  borderRadius: '8px', fontWeight: '700', fontSize: '16px',
                  marginTop: '24px', cursor: !suratJalan ? 'not-allowed' : 'pointer',
                  border: 'none', opacity: !suratJalan ? 0.6 : 1,
                  transition: 'background 0.2s, transform 0.2s, opacity 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (suratJalan) e.currentTarget.style.background = '#0a3d30';
                }}
                onMouseOut={(e) => e.currentTarget.style.background = '#0D4B3B'}
              >
                Lanjut ke Konfirmasi
                <ArrowRightCircleIcon className="h-5 w-5" />
              </button>
              <p style={{
                fontSize: '12px',
                color: '#9CA3AF',
                textAlign: 'center',
                marginTop: '12px',
                lineHeight: '1.5'
              }}>
                Dokumen yang diunggah diproses sesuai{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0D4B3B', textDecoration: 'underline' }}
                >
                  Kebijakan Privasi
                </a>{' '}
                kami dan tidak disimpan permanen setelah verifikasi selesai.
              </p>
            </>
          ) : currentStep === 3 ? (
            <>
              <h2 className="text-[18px] font-bold text-[#0F1A16] mb-6">Konfirmasi Data</h2>

              {/* Warning Banner for Expired Dates */}
              {items.some(item => {
                const status = getExpiryStatus(item.expiryDate);
                return status.isExpired || status.isNearExpiry;
              }) && (
                <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <ExclamationCircleIcon className="h-5 w-5 text-[#F59E0B] mt-0.5" />
                    <div>
                      <p className="text-[14px] font-semibold text-[#92400E] mb-1">Perhatian: Tanggal Kedaluwarsa</p>
                      <p className="text-[13px] text-[#92400E]">
                        Beberapa item memiliki tanggal kedaluwarsa yang perlu perhatian. Pastikan untuk memeriksa kembali sebelum melanjutkan verifikasi.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informasi Pengiriman Section */}
              <div className="bg-[#F8FFFE] border border-[#E5E7EB] rounded-xl p-5 mb-5">
                <h3 className="text-[15px] font-semibold text-[#0D4B3B] mb-4">Informasi Pengiriman</h3>
                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <p className="text-[#6B7280] mb-1">Nomor Referensi</p>
                    <p className="text-[#0F1A16] font-medium">{formState.referenceNumber}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280] mb-1">Nama Vendor</p>
                    <p className="text-[#0F1A16] font-medium">{formState.vendorName}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280] mb-1">Tanggal Dokumen</p>
                    <p className="text-[#0F1A16] font-medium">{formState.documentDate}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280] mb-1">Kondisi Kemasan</p>
                    <p className="text-[#0F1A16] font-medium">{formState.packagingCondition}</p>
                  </div>
                  {formState.storageCondition !== 'Tidak Diperlukan' && (
                    <div className="col-span-2">
                      <p className="text-[#6B7280] mb-1">Kondisi Penyimpanan</p>
                      <p className="text-[#0F1A16] font-medium">
                        {formState.storageCondition}
                        {formState.temperature && ` (${formState.temperature}°C)`}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Daftar Bahan Section */}
              <div className="bg-[#F8FFFE] border border-[#E5E7EB] rounded-xl p-5 mb-5">
                <h3 className="text-[15px] font-semibold text-[#0D4B3B] mb-4">Daftar Bahan ({items.length} item)</h3>
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const expiryStatus = getExpiryStatus(item.expiryDate);
                    const getExpiryBadge = () => {
                      if (expiryStatus.isExpired) {
                        return { bg: '#FEE2E2', text: '#DC2626', label: 'Expired' };
                      }
                      if (expiryStatus.isNearExpiry) {
                        return { bg: '#FEF3C7', text: '#D97706', label: '< 6 bulan' };
                      }
                      return { bg: '#DCFCE7', text: '#16A34A', label: 'Aman' };
                    };
                    const badge = getExpiryBadge();
                    
                    return (
                      <div key={item.id} className="bg-white border border-[#E5E7EB] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] font-semibold text-[#0D4B3B]">Item #{index + 1}</span>
                          <span 
                            className="px-2 py-0.5 rounded text-[11px] font-semibold"
                            style={{ background: badge.bg, color: badge.text }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-[12px]">
                          <div>
                            <p className="text-[#6B7280] mb-1">Kode Bahan</p>
                            <p className="text-[#0F1A16] font-medium">{item.materialCode || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[#6B7280] mb-1">Nama Bahan</p>
                            <p className="text-[#0F1A16] font-medium">{item.materialName}</p>
                          </div>
                          <div>
                            <p className="text-[#6B7280] mb-1">Batch</p>
                            <p className="text-[#0F1A16] font-medium">{item.batchNumber}</p>
                          </div>
                          <div>
                            <p className="text-[#6B7280] mb-1">Jumlah</p>
                            <p className="text-[#0F1A16] font-medium">{item.quantity} {item.unit}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-[#6B7280] mb-1">Expired Date</p>
                            <p className="text-[#0F1A16] font-medium">{item.expiryDate}</p>
                            {expiryStatus.label && (
                              <p className="text-[11px] mt-1" style={{ color: expiryStatus.color }}>
                                {expiryStatus.label}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dokumen Section */}
              <div className="bg-[#F8FFFE] border border-[#E5E7EB] rounded-xl p-5 mb-5">
                <h3 className="text-[15px] font-semibold text-[#0D4B3B] mb-4">Dokumen yang Diupload</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <DocumentIcon className="h-5 w-5 text-[#0D4B3B]" />
                      <div>
                        <p className="text-[13px] font-medium text-[#0F1A16]">Surat Jalan</p>
                        <p className="text-[11px] text-[#6B7280]">{suratJalan?.name || 'Belum diupload'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEE2E2] text-[#991B1B]">Wajib</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <DocumentIcon className="h-5 w-5 text-[#0D4B3B]" />
                      <div>
                        <p className="text-[13px] font-medium text-[#0F1A16]">Certificate of Analysis (CoA)</p>
                        <p className="text-[11px] text-[#6B7280]">{coa?.name || 'Belum diupload'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF9C3] text-[#854D0E]">Direkomendasikan</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <DocumentIcon className="h-5 w-5 text-[#0D4B3B]" />
                      <div>
                        <p className="text-[13px] font-medium text-[#0F1A16]">Faktur Pajak / Invoice</p>
                        <p className="text-[11px] text-[#6B7280]">{faktur?.name || 'Belum diupload'}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]">Opsional</span>
                  </div>
                  {dokumenLain.length > 0 && (
                    <div className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <DocumentIcon className="h-5 w-5 text-[#0D4B3B]" />
                        <div>
                          <p className="text-[13px] font-medium text-[#0F1A16]">Dokumen Lain</p>
                          <p className="text-[11px] text-[#6B7280]">{dokumenLain.length} file</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F3F4F6] text-[#6B7280]">Opsional</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  style={{
                    flex: 1, height: '48px',
                    background: 'white', color: '#0D4B3B',
                    borderRadius: '8px', fontWeight: '600', fontSize: '14px',
                    cursor: 'pointer', border: '1.5px solid #0D4B3B',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#F0FAF7'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                >
                  ← Kembali Edit
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  style={{
                    flex: 2, height: '48px',
                    background: '#0D4B3B', color: 'white',
                    borderRadius: '8px', fontWeight: '600', fontSize: '14px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    border: 'none', opacity: isLoading ? 0.6 : 1,
                    transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                  onMouseOver={(e) => {
                    if (!isLoading) e.currentTarget.style.background = '#0a3d30';
                  }}
                  onMouseOut={(e) => e.currentTarget.style.background = '#0D4B3B'}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '16px', height: '16px',
                        border: '2px solid white', borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Sedang Memproses...
                    </>
                  ) : (
                    <>
                      Konfirmasi & Mulai Verifikasi
                      <ArrowRightCircleIcon className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : null}

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
      
      {showPreview && previewUrl && previewFile && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }}
          onClick={closePreview}
        >
          <div 
            style={{
              background: 'white', borderRadius: '12px', padding: '16px',
              maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: '12px',
              overflow: 'hidden', width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#0F1A16' }}>Preview Dokumen</p>
                <p style={{ fontSize: '12px', color: '#6B7280', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {previewFile.name}
                </p>
              </div>
              <button 
                onClick={closePreview}
                style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: '4px' }}
              >
                <XMarkIcon style={{ height: '20px', width: '20px' }} />
              </button>
            </div>
            
            {/* Preview content */}
            <div style={{ overflow: 'auto', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewFile.type === 'application/pdf' ? (
                <iframe 
                  src={previewUrl} 
                  style={{ width: '100%', height: '70vh', minWidth: '60vw' }}
                  title="PDF Preview"
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              )}
            </div>
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
  tooltip?: string;
}

function DocumentSlot({ badge, badgeColor, title, description, file, onFileSelect, onRemove, accept, tooltip }: DocumentSlotProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
        {tooltip && <FieldTooltip text={tooltip} />}
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
            <span 
              className="text-[14px] text-[#0F1A16] font-medium truncate max-w-[160px] sm:max-w-[250px] cursor-pointer hover:text-[#0D4B3B]"
              title={file.name}
              onClick={(e) => { e.stopPropagation(); setShowPreview(true); }}
            >
              {file.name.length > 25 
                ? file.name.substring(0, 12) + '...' + file.name.slice(-8) 
                : file.name}
            </span>
            <span className="text-[12px] text-[#6B7280]">({(file.size / 1024).toFixed(1)} KB)</span>
            <span className="text-[10px] text-[#0D4B3B] ml-1">(tap untuk preview)</span>
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
      
      {showPreview && previewUrl && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="bg-white rounded-xl p-4 max-w-[90vw] max-h-[85vh] flex flex-col gap-3 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#0F1A16]">Preview Dokumen</p>
                <p className="text-[11px] text-[#6B7280] truncate max-w-[250px]">{file.name}</p>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-[#6B7280] hover:text-[#0F1A16] p-1"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Preview content */}
            <div className="overflow-auto flex-1 flex items-center justify-center">
              {file.type === 'application/pdf' ? (
                <iframe 
                  src={previewUrl} 
                  className="w-full"
                  style={{ height: '70vh', minWidth: '60vw' }}
                  title="PDF Preview"
                />
              ) : (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
            
            {/* Size info */}
            <p className="text-[11px] text-[#9CA3AF] text-center">
              {(file.size / 1024).toFixed(1)} KB — Klik di luar untuk menutup
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
