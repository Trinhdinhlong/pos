"use client";
import { useState } from "react";

interface RegisterFormProps {
  onRegister: (username: string, password: string, fullName: string) => void;
  error?: string;
}

export default function RegisterForm({ onRegister, error }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onRegister(username, password, fullName);
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-700 mb-2">POS System</h1>
          <p className="text-gray-500">Đăng ký tài khoản mới</p>
        </div>
        {error && (
          <div className="mb-6 border border-red-400 bg-red-50 text-red-800 rounded px-4 py-2 text-center animate-pulse">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isLoading}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
            <input
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              disabled={isLoading}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
            />
          </div>
          <button
            type="submit"
            className="w-full mt-6 bg-green-600 text-white py-3 rounded-md font-semibold text-lg shadow hover:bg-green-700 transition"
            disabled={isLoading}
            style={{ cursor: 'pointer' }}
          >
            {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">Đã có tài khoản? Đăng nhập</p>
      </div>
    </div>
  );
}
