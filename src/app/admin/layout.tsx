"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { SIGNALR_URL } from "@/app/api/apiConfig";
import { OrderDetailView, Order } from "@/components/OrderDetailView";
import { useRouter, usePathname } from "next/navigation";
import LogoutButtonClient from "../../components/LogoutButtonClient";
import {
  LayoutDashboard,
  Package,
  Clock,
  ReceiptText,
  BadgeDollarSign,
  Menu,
  X,
  ShoppingCart,
  Grid2X2,
  ShieldCheck,
  ChevronRight,
  Loader2
} from "lucide-react";

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
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
  const [loading, setLoading] = useState(true);
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // SignalR: Listen for new orders
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    const startConnection = async () => {
      try {
        await connection.start();
        connection.on("NewOrderCreated", async (data) => {
          try {
            const res = await fetch(`/api/order?id=${data.orderId}`);
            const result = await res.json();
            if (result.status && result.data) {
              setNewOrder(result.data);
            }
          } catch (err) {
            console.error("Error fetching order detail:", err);
          }
        });
      } catch (err) {
        console.error("SignalR Connection Error:", err);
      }
    };

    startConnection();

    return () => {
      connection.stop();
    };
  }, []);

  // Auth check
  useEffect(() => {
    const token = getTokenFromCookie();
    if (!token) {
      router.replace("/login");
      return;
    }

    const userMatch = document.cookie.match(/(^| )user=([^;]+)/);
    if (userMatch) {
      try {
        const userObj = JSON.parse(decodeURIComponent(userMatch[2]));
        setUser(userObj);
      } catch {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
    setLoading(false);
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-black uppercase tracking-widest">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Bảng điều khiển" },
    { href: "/admin/pos", icon: ShoppingCart, label: "Điểm bán hàng" },
    { href: "/admin/tables", icon: Grid2X2, label: "Quản lý Bàn" },
    { href: "/admin/orders", icon: ReceiptText, label: "Đơn hàng" },
    { href: "/admin/products", icon: Package, label: "Sản phẩm" },
    { href: "/admin/shifts", icon: Clock, label: "Ca làm việc" },
    { href: "/admin/revenue", icon: BadgeDollarSign, label: "Doanh thu" },
    { href: "/admin/users", icon: ShieldCheck, label: "Tài khoản" },
  ];

  return (
    <>
      {/* New Order Modal */}
      {newOrder && (
        <OrderDetailView order={newOrder} onClose={() => setNewOrder(null)} />
      )}

      <div className="min-h-screen bg-background flex">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
            transform transition-transform duration-200 ease-out flex flex-col
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:static"}
          `}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <Link href="/admin/dashboard" className="flex items-center gap-3 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                P
              </div>
              <span className="font-semibold text-foreground">POS System</span>
            </Link>
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                      ${isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-medium text-sm">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.fullName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
            <LogoutButtonClient />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-16 bg-card border-b border-border flex items-center px-4 lg:px-6 sticky top-0 z-30">
            <button
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors mr-4 cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full relative overflow-hidden group">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Trực tuyến</span>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}