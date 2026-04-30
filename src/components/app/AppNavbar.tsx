import { Link, useLocation, useNavigate } from "react-router-dom";
import MedicineLogo from "./MedicineLogo";

const AppNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem("verimat_auth");
    localStorage.removeItem("verimat_login_time");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
      {/* Main row */}
      <div className="h-14 sm:h-16 px-3 sm:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div style={{
            width: '30px', height: '30px',
            background: 'rgba(13,75,59,0.1)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MedicineLogo size={16} color="#0D4B3B" />
          </div>
          <span className="font-bold text-[16px] sm:text-[20px] text-[#0D4B3B]">VeriMat</span>
        </div>

        {/* Right side: desktop shows tabs + user + logout inline */}
        {/* Mobile shows only logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Nav tabs - hidden on mobile, shown on sm+ */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/dashboard"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive("/dashboard") ? "bg-[#0D4B3B] text-white" : "text-[#4A5568] hover:text-[#0D4B3B]"
              }`}
            >
              Verifikasi Baru
            </Link>
            <Link
              to="/audit"
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive("/audit") ? "bg-[#0D4B3B] text-white" : "text-[#4A5568] hover:text-[#0D4B3B]"
              }`}
            >
              Audit Trail
            </Link>
          </div>

          <span className="hidden sm:inline text-sm text-[#374151]">Admin</span>

          <button
            onClick={handleLogout}
            className="text-xs sm:text-sm text-[#DC2626] hover:underline font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile bottom tab bar - only visible on mobile */}
      <div className="sm:hidden flex border-t border-[#E5E7EB]">
        <Link
          to="/dashboard"
          className={`flex-1 py-2.5 text-center text-xs font-medium transition-all ${
            isActive("/dashboard")
              ? "text-[#0D4B3B] border-b-2 border-[#0D4B3B] bg-[#F0FAF7]"
              : "text-[#6B7280]"
          }`}
        >
          Verifikasi Baru
        </Link>
        <Link
          to="/audit"
          className={`flex-1 py-2.5 text-center text-xs font-medium transition-all ${
            isActive("/audit")
              ? "text-[#0D4B3B] border-b-2 border-[#0D4B3B] bg-[#F0FAF7]"
              : "text-[#6B7280]"
          }`}
        >
          Audit Trail
        </Link>
      </div>
    </nav>
  );
};

export default AppNavbar;
