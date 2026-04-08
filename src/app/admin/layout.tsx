

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import LogoutButtonClient from "../../components/LogoutButtonClient";
import { 
  LayoutDashboard, 
  Package, 
  Clock, 
  ReceiptText, 
  BadgeDollarSign, 
  Users,
  Menu,
  X,
  Bell,
  Search,
  ShoppingCart,
  Grid2X2,
  Soup,
  BarChart3,
  Layers,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string | null;
}

function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(^| )token=([^;]+)/);
  return match ? match[2] : null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) {
      router.replace("/login");
      return;
    }
    
    if (typeof document !== "undefined") {
      const userMatch = document.cookie.match(/(^| )user=([^;]+)/);
      if (userMatch) {
        try {
          const userObj = JSON.parse(decodeURIComponent(userMatch[2]));
          setUser(userObj);
        } catch {
          setUser(null);
          router.replace("/login");
        }
      } else {
        setUser(null);
        router.replace("/login");
      }
    }
  }, [router]);

  if (!user) return null;

  const menuGroups = [
    {
      title: "Hoạt động",
      items: [
        { href: "/admin/pos", icon: ShoppingCart, label: "Bán hàng (POS)" },
        { href: "/admin/tables", icon: Grid2X2, label: "Sơ đồ bàn" },
        { href: "/admin/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
      ]
    },
    {
      title: "Kinh doanh",
      items: [
        { href: "/admin/orders", icon: ReceiptText, label: "Đơn hàng" },
        { href: "/admin/shifts", icon: Clock, label: "Ca làm việc" },
        { href: "/admin/revenue", icon: BadgeDollarSign, label: "Doanh thu" },
      ]
    },
    {
      title: "Quản lý dữ liệu",
      items: [
        { href: "/admin/products", icon: Package, label: "Sản phẩm" },
      ]
    },
    {
      title: "Hệ thống",
      items: [
        { href: "/admin/users", icon: ShieldCheck, label: "Tài khoản" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex font-sans">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:static"}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-950 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-zinc-950/20 transition-transform group-hover:rotate-3">P</div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white leading-none uppercase">POS SYSTEM</span>
              <span className="text-[10px] font-black tracking-[0.3em] text-zinc-400 uppercase">Management</span>
            </div>
          </div>
          <button className="md:hidden p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 custom-scrollbar">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              <div className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20" />
                {group.title}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300 group relative ${
                        isActive 
                          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/10" 
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-950 dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <item.icon className={`w-4.5 h-4.5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                        <span className={`text-[13px] font-bold tracking-tight ${isActive ? "opacity-100" : "opacity-90 group-hover:opacity-100"}`}>{item.label}</span>
                      </div>
                      {isActive && (
                        <div className="absolute inset-0 bg-emerald-600 rounded-xl opacity-0 hover:opacity-10 transition-opacity" />
                      )}
                      <ChevronRight className={`w-3.5 h-3.5 transition-all duration-300 ${isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0"}`} />
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-900/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-700/50 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 group cursor-default">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-black text-white shadow-md group-hover:scale-105 transition-transform">
              {user.fullName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-zinc-900 dark:text-white truncate uppercase tracking-tight">{user.fullName}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <LogoutButtonClient />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-zinc-500 hover:text-zinc-900" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="hidden sm:flex items-center relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3" />
              <input 
                type="text" 
                placeholder="Tìm kiếm nhanh..." 
                className="pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-transparent rounded-full text-sm focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 transition-all w-64 outline-none text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 border-zinc-200 dark:border-zinc-800">
            <button className="relative p-2 text-zinc-500 hover:text-zinc-900 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

