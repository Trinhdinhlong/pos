"use client";
import { useState } from "react";
import { User, Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { motion } from "framer-motion";

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
}

export default function LoginForm({ onLogin, error }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(username, password);
    setIsLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-8"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">
          Đăng nhập
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest leading-none">
          Hệ thống Quản lý POS
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center text-[10px] font-black uppercase tracking-widest">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Tên đăng nhập</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <Input
              type="text"
              placeholder="admin..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
              required
              className="pl-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mật khẩu</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Lock className="h-4 w-4 text-zinc-400" />
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="pl-12"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase tracking-widest text-xs"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Vào hệ thống"}
        </Button>
      </form>
    </motion.div>
  );
}
