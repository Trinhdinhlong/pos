"use client";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/app/api/apiConfig";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  
  const handleLogout = async () => {
    document.cookie = "token=; path=/; max-age=0";
    document.cookie = "user=; path=/; max-age=0";
    await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST" }).catch(() => {});
    router.push("/login");
  };
  
  return (
    <button 
      onClick={handleLogout} 
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign out</span>
    </button>
  );
}
