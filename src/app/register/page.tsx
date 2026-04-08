"use client";
import RegisterForm from "../../components/RegisterForm";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [error, setError] = useState<string | undefined>(undefined);
  const router = useRouter();

  const handleRegister = async (username: string, password: string, fullName: string) => {
    setError(undefined);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, fullName }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/login");
      } else {
        setError(data.message || "Đăng ký thất bại");
      }
    } catch (e) {
      setError("Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md">
        <RegisterForm onRegister={handleRegister} error={error} />
        <p className="mt-2 text-center text-xs">
          Đã có tài khoản?{' '}
          <a href="/login" className="text-blue-600 hover:underline" style={{ cursor: 'pointer' }}>Đăng nhập</a>
        </p>
      </div>
    </div>
  );
}
