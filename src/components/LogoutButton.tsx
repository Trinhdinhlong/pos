"use client";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/app/api/apiConfig";

export default function LogoutButton() {
  const router = useRouter();
  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST" });
    router.push("/login");
  };
  return (
    <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Đăng xuất</button>
  );
}
