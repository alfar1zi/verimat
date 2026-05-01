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
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      {/* Main row */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 grid grid-cols-3 items-center">
        {/* Left: Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div style={{
            width: '32px', height: '32px',
            background: 'rgba(13,75,59,0.1)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s'
          }}>
            <MedicineLogo size={18} color="#0D4B3B" />
          </div>
          <span className="font-bold text-[17px] sm:text-[20px] text-[#0D4B3B]">VeriMat</span>
        </div>

        {/* Center: Nav tabs (desktop only) */}
        <div className="hidden sm:flex items-center justify-center gap-1">
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/dashboard")
                ? "bg-[#0D4B3B] text-white shadow-sm"
                : "text-[#4A5568] hover:text-[#0D4B3B] hover:bg-[#F0FAF7]"
            }`}
          >
            Verifikasi Baru
          </Link>
          <Link
            to="/audit"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive("/audit")
                ? "bg-[#0D4B3B] text-white shadow-sm"
                : "text-[#4A5568] hover:text-[#0D4B3B] hover:bg-[#F0FAF7]"
            }`}
          >
            Audit Trail
          </Link>
        </div>

        {/* Right: Admin + Logout */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {/* Admin pill - desktop only */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F4F6]">
            {/* User icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#374151">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span className="text-[13px] font-medium text-[#374151]">Admin</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#FCA5A5] text-[#DC2626] text-[12px] sm:text-[13px] font-medium hover:bg-[#FEF2F2] transition-all duration-200"
          >
            {/* Logout icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="sm:hidden flex border-t border-[#E5E7EB]">
        <Link
          to="/dashboard"
          className={`flex-1 py-2.5 text-center text-[11px] font-medium transition-all duration-200 ${
            isActive("/dashboard")
              ? "text-[#0D4B3B] border-b-2 border-[#0D4B3B] bg-[#F0FAF7]"
              : "text-[#6B7280] hover:text-[#0D4B3B]"
          }`}
        >
          Verifikasi Baru
        </Link>
        <Link
          to="/audit"
          className={`flex-1 py-2.5 text-center text-[11px] font-medium transition-all duration-200 ${
            isActive("/audit")
              ? "text-[#0D4B3B] border-b-2 border-[#0D4B3B] bg-[#F0FAF7]"
              : "text-[#6B7280] hover:text-[#0D4B3B]"
          }`}
        >
          Audit Trail
        </Link>
      </div>
    </nav>
  );
};

export default AppNavbar;
