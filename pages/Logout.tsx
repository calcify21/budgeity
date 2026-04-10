import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const Logout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error("Logout failed during auto-logout:", error);
      } finally {
        navigate("/login", { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-black text-brand-600">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={40} className="animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Signing you out securely...
        </p>
      </div>
    </div>
  );
};

export default Logout;
