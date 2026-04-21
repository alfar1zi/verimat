import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

const AppNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("verimat_auth");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-white border-b border-[#E5E7EB] h-16 px-8 flex items-center justify-between">
      {/* Left - Logo */}
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="h-6 w-6 text-[#0D4B3B]" />
        <span className="font-bold text-[20px] text-[#0D4B3B]">VeriMat</span>
      </div>

      {/* Center - Nav Tabs */}
      <div className="flex items-center gap-2">
        <Link
          to="/dashboard"
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isActive("/dashboard")
              ? "bg-[#0D4B3B] text-white"
              : "text-[#4A5568] hover:text-[#0D4B3B]"
          }`}
        >
          Verifikasi Baru
        </Link>
        <Link
          to="/audit"
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            isActive("/audit")
              ? "bg-[#0D4B3B] text-white"
              : "text-[#4A5568] hover:text-[#0D4B3B]"
          }`}
        >
          Audit Trail
        </Link>
      </div>

      {/* Right - User & Logout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#374151]">Admin</span>
        <button
          onClick={handleLogout}
          className="text-sm text-[#DC2626] hover:underline"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default AppNavbar;
