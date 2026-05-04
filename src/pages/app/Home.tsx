import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, DocumentIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import AppNavbar from "../../components/app/AppNavbar";
import { apiFetch } from "../../lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Stats {
  total: number;
  pass: number;
  failed: number;
}

interface AuditLog {
  id: string;
  session_id: string;
  reference_number: string;
  vendor_name: string;
  material_name: string;
  status: "PASS" | "MISMATCH" | "INCOMPLETE";
  created_at: string;
}

const COLORS = {
  PASS: "#10B981",
  MISMATCH: "#EF4444",
  INCOMPLETE: "#6B7280",
};

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [stats, setStats] = useState<Stats>({ total: 0, pass: 0, failed: 0 });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [chartData, setChartData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Format date in Indonesian
  const formatDateIndo = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("id-ID", options);
  };

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return "Kemarin";
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID");
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get username from localStorage or use default
        const storedUser = localStorage.getItem("username");
        if (storedUser) setUsername(storedUser);

        // Fetch stats
        const statsResponse = await apiFetch("/api/audit/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }

        // Fetch recent logs
        const logsResponse = await apiFetch("/api/audit/logs?limit=5");
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setRecentLogs(logsData.logs || []);
        }

        // Fetch chart data (last 30 days)
        const chartResponse = await apiFetch("/api/audit/logs?days=30");
        if (chartResponse.ok) {
          const chartDataRaw = await chartResponse.json();
          const logs = chartDataRaw.logs || [];
          
          const passCount = logs.filter((log: AuditLog) => log.status === "PASS").length;
          const mismatchCount = logs.filter((log: AuditLog) => log.status === "MISMATCH").length;
          const incompleteCount = logs.filter((log: AuditLog) => log.status === "INCOMPLETE").length;

          setChartData([
            { name: "PASS", value: passCount, color: COLORS.PASS },
            { name: "MISMATCH", value: mismatchCount, color: COLORS.MISMATCH },
            { name: "INCOMPLETE", value: incompleteCount, color: COLORS.INCOMPLETE },
          ]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const passRate = stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0;
  const passRateColor = passRate >= 80 ? "#10B981" : passRate >= 60 ? "#F59E0B" : "#EF4444";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASS":
        return { bg: "#DCFCE7", text: "#16A34A", icon: <CheckCircleIcon className="h-4 w-4" /> };
      case "MISMATCH":
        return { bg: "#FEE2E2", text: "#DC2626", icon: <ExclamationCircleIcon className="h-4 w-4" /> };
      case "INCOMPLETE":
        return { bg: "#F3F4F6", text: "#6B7280", icon: <ClockIcon className="h-4 w-4" /> };
      default:
        return { bg: "#F3F4F6", text: "#6B7280", icon: null };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8F6]">
        <AppNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #E5E7EB",
              borderTop: "3px solid #0D4B3B",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6]">
      <AppNavbar />
      
      <div className="max-w-[1200px] mx-auto" style={{ padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)" }}>
        {/* BAGIAN 1 — Greeting & Summary */}
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-[#0F1A16] mb-2">
            Selamat datang, {username}. Hari ini {formatDateIndo()}.
          </h1>
          <p className="text-[15px] text-[#6B7280]">
            Berikut ringkasan aktivitas verifikasi dokumen Anda.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Verifikasi Hari Ini */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E7EB]"
            style={{ borderLeft: "4px solid #0D4B3B" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-medium text-[#6B7280]">Verifikasi Hari Ini</p>
              <DocumentIcon className="h-5 w-5 text-[#0D4B3B]" />
            </div>
            <p className="text-[32px] font-bold text-[#0F1A16] mb-1">{stats.total}</p>
            <p className="text-[12px] text-[#6B7280]">Total verifikasi hari ini</p>
          </div>

          {/* Total Minggu Ini */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E7EB]"
            style={{ borderLeft: "4px solid #3B82F6" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-medium text-[#6B7280]">Total Minggu Ini</p>
              <ClockIcon className="h-5 w-5 text-[#3B82F6]" />
            </div>
            <p className="text-[32px] font-bold text-[#0F1A16] mb-1">{stats.total * 7}</p>
            <p className="text-[12px] text-[#6B7280]">Estimasi total mingguan</p>
          </div>

          {/* Tingkat Kelulusan */}
          <div
            className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E7EB]"
            style={{ borderLeft: `4px solid ${passRateColor}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-medium text-[#6B7280]">Tingkat Kelulusan</p>
              <CheckCircleIcon className="h-5 w-5" style={{ color: passRateColor }} />
            </div>
            <p className="text-[32px] font-bold text-[#0F1A16] mb-1" style={{ color: passRateColor }}>
              {passRate}%
            </p>
            <p className="text-[12px] text-[#6B7280]">Persentase PASS dari total</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* BAGIAN 2 — Status Verifikasi Terakhir */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-[#0F1A16]">Verifikasi Terakhir</h2>
              <button
                onClick={() => navigate("/audit")}
                className="text-[13px] font-medium text-[#0D4B3B] hover:underline"
              >
                Lihat Semua
              </button>
            </div>
            
            {recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-[#E5E7EB] mx-auto mb-3" />
                <p className="text-[14px] text-[#6B7280]">Belum ada verifikasi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log) => {
                  const badge = getStatusBadge(log.status);
                  return (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-[#F8FFFE] rounded-lg border border-[#E5E7EB] hover:border-[#0D4B3B] transition-colors cursor-pointer"
                      onClick={() => navigate(`/verification/${log.session_id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {badge.icon}
                          {log.status}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-[#0F1A16]">{log.material_name}</p>
                          <p className="text-[11px] text-[#6B7280]">{log.reference_number}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF]">{getRelativeTime(log.created_at)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BAGIAN 4 — Grafik Donut */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E7EB]">
            <h2 className="text-[18px] font-bold text-[#0F1A16] mb-4">Statistik 30 Hari Terakhir</h2>
            <div style={{ height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, ""]}
                    contentStyle={{
                      background: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value: string) => (
                      <span style={{ fontSize: "13px", color: "#374151" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {chartData.length > 0 && chartData.every((d) => d.value === 0) && (
              <p className="text-center text-[13px] text-[#6B7280] mt-4">Belum ada data 30 hari terakhir</p>
            )}
          </div>
        </div>

        {/* BAGIAN 3 — Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E7EB]">
          <h2 className="text-[18px] font-bold text-[#0F1A16] mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/verify")}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-[#0D4B3B] text-white rounded-lg font-semibold text-[15px] hover:bg-[#0a3d30] transition-colors"
            >
              Mulai Verifikasi Baru
              <ArrowRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate("/audit")}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-[#0D4B3B] border-2 border-[#0D4B3B] rounded-lg font-semibold text-[15px] hover:bg-[#F0FAF7] transition-colors"
            >
              Lihat Audit Trail
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
