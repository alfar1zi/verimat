import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 jam
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 menit

const ProtectedRoute = () => {
  const isAuth = localStorage.getItem("verimat_auth");
  const navigate = useNavigate();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isAuth) return;

    // Cek session duration (8 jam)
    const loginTime = localStorage.getItem("verimat_login_time");
    if (loginTime && Date.now() - parseInt(loginTime) > SESSION_DURATION) {
      localStorage.removeItem("verimat_auth");
      localStorage.removeItem("verimat_login_time");
      navigate("/login", { replace: true });
      return;
    }

    // Auto-logout setelah 30 menit idle
    const resetIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        localStorage.removeItem("verimat_auth");
        localStorage.removeItem("verimat_login_time");
        alert("Sesi Anda telah berakhir karena tidak aktif selama 30 menit. Silakan login kembali.");
        navigate("/login", { replace: true });
      }, IDLE_TIMEOUT);
    };

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach(e => document.addEventListener(e, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [isAuth, navigate]);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
