import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";

interface VerificationData {
  po_number: string;
  doc_type: string;
  verification_time: string;
  session_id: string;
  status: "PASS" | "MISMATCH" | "INCOMPLETE";
  explanation: string;
  mismatched_fields?: string[];
}

const VerificationResult = () => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
      const response = await fetch(`${API_URL}/api/verification/${id}`);
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
      badgeBg: "#DCFCE7",
      badgeColor: "#166534",
      text: "Semua dokumen sesuai",
    },
    MISMATCH: {
      icon: XCircleIcon,
      iconColor: "#DC2626",
      badgeBg: "#FEE2E2",
      badgeColor: "#991B1B",
      text: "Ditemukan ketidaksesuaian dokumen",
    },
    INCOMPLETE: {
      icon: ExclamationTriangleIcon,
      iconColor: "#D97706",
      badgeBg: "#FEF9C3",
      badgeColor: "#854D0E",
      text: "Dokumen tidak lengkap atau tidak terbaca",
    },
  };

  const config = statusConfig[data.status];
  const StatusIcon = config.icon;

  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      <AppNavbar />
      
      <div className="max-w-[800px] mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/dashboard")}
          className="text-[#0D4B3B] text-[14px] mb-6 hover:underline"
        >
          ← Verifikasi Lain
        </button>

        {/* Result Card */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8">
          {/* Status Badge Section */}
          <div className="text-center pb-6 border-b border-[#F3F4F6]">
            <StatusIcon className="h-16 w-16 mx-auto" style={{ color: config.iconColor }} />
            <div
              className="inline-block mt-3 px-7 py-2 rounded-full text-[24px] font-bold"
              style={{ backgroundColor: config.badgeBg, color: config.badgeColor }}
            >
              {data.status}
            </div>
            <p className="text-[15px] text-[#4A5568] mt-2">{config.text}</p>
          </div>

          {/* Info Section */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[13px] text-[#6B7280] mb-1">Nomor PO</p>
              <p className="text-[15px] font-medium text-[#0F1A16]">{data.po_number}</p>
            </div>
            <div>
              <p className="text-[13px] text-[#6B7280] mb-1">Jenis Dokumen</p>
              <p className="text-[15px] font-medium text-[#0F1A16]">{getDocTypeLabel(data.doc_type)}</p>
            </div>
            <div>
              <p className="text-[13px] text-[#6B7280] mb-1">Waktu Verifikasi</p>
              <p className="text-[15px] font-medium text-[#0F1A16]">{formatDate(data.verification_time)}</p>
            </div>
            <div>
              <p className="text-[13px] text-[#6B7280] mb-1">Session ID</p>
              <p className="text-[15px] font-medium text-[#0F1A16] font-mono">
                {data.session_id.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Penjelasan Section */}
          <div className="mt-6 bg-[#F9FAFB] rounded-xl p-5">
            <h3 className="font-semibold text-[#0F1A16] mb-3">Detail Verifikasi</h3>
            {data.status === "MISMATCH" && data.mismatched_fields && data.mismatched_fields.length > 0 ? (
              <ul className="space-y-2">
                {data.mismatched_fields.map((field, index) => (
                  <li key={index} className="flex items-center gap-2 text-[15px] text-[#374151]">
                    <XMarkIcon className="h-5 w-5 text-[#DC2626]" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
            ) : data.status === "PASS" ? (
              <div className="flex items-center gap-2 text-[15px] text-[#374151]">
                <CheckIcon className="h-5 w-5 text-[#16A34A]" />
                <span>Semua field dokumen telah diverifikasi dan sesuai</span>
              </div>
            ) : (
              <p className="text-[15px] text-[#374151]">{data.explanation}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-7 flex gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-[#0D4B3B] text-white rounded-lg px-6 py-3 font-semibold text-[15px] hover:bg-[#0a3d30] transition"
            >
              Verifikasi Dokumen Lain
            </button>
            <button
              onClick={() => navigate("/audit")}
              className="flex-1 border-[1.5px] border-[#0D4B3B] text-[#0D4B3B] rounded-lg px-6 py-3 font-semibold text-[15px] hover:bg-[#F7F8F6] transition"
            >
              Lihat Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationResult;
