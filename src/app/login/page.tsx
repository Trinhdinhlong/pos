"use client";
import LoginForm from "../../components/LoginForm";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Monitor, Rocket, Terminal } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  const handleLogin = async (username: string, password: string) => {
    setError(undefined);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
      });
      const data = await res.json();
      if ((data.status === 200 || data.status === true || data.status === "success") && (data.data?.token || data.data?.user)) {
        if (data.data.user) {
          document.cookie = `user=${encodeURIComponent(JSON.stringify(data.data.user))}; path=/; max-age=86400`;
        }
        if (data.data.token) {
          document.cookie = `token=${data.data.token}; path=/; max-age=86400`;
        }
        router.push("/admin/dashboard");
      } else {
        setError(data.message || "Đăng nhập thất bại");
      }
    } catch {
      setError("Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-orange-500/20 selection:text-orange-500 p-4">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden p-8 sm:p-12 relative z-10"
      >
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 text-white flex items-center justify-center text-3xl font-black italic shadow-xl shadow-zinc-900/20 mb-6">P</div>
          <span className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400">POS SYSTEM</span>
        </div>

        <LoginForm onLogin={handleLogin} error={error} />
        
        <p className="mt-12 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Hệ thống quản lý nội bộ dành cho nhân viên
        </p>
      </motion.div>
    </div>
  );
}
