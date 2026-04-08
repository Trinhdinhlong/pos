"use client";
import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/app/api/apiConfig";
import { Order, OrderDetailView } from "@/components/OrderDetailView";
import { PaymentDetail } from "@/components/PaymentDetail";
import { 
  Search, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  Eye,
  Loader2,
  Package
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Paid">("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payOrderId, setPayOrderId] = useState<number | null>(null);

  const fetchOrders = useCallback(async (page: number, search: string, tab: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        pageNumber: page.toString(),
        pageSize: pageSize.toString()
      });

      if (search) params.append("orderCode", search);
      if (tab !== "All") params.append("status", tab);

      const res = await fetch(`/api/order?${params.toString()}`);
      const data = await res.json();
      if (data.status) {
        setOrders(data.data.items);
        setTotalPages(data.data.totalPages);
        setTotalCount(data.data.totalCount);
        setCurrentPage(data.data.pageNumber);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(currentPage, searchQuery, activeTab);
  }, [currentPage, searchQuery, activeTab, fetchOrders]);

  const handleUpdateStatus = async (order: Order, status: string) => {
    if (!window.confirm(`Mark order #${order.orderCode} as complete?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/order?id=${order.id}&action=status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.status) {
        fetchOrders(currentPage, searchQuery, activeTab);
      }
    } catch (err) {
      console.error("Update status error:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Hệ thống đơn hàng</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 mb-10">
        <div>
           <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-600/30 italic rotate-6">📄</div>
                <div>
                     <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none mb-2">Quản lý <span className="text-indigo-600">Đơn hàng</span></h1>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold tracking-tight">Theo dõi và xử lý các giao dịch khách hàng</p>
                </div>
           </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-xl">
          {(["All", "Pending", "Paid"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === tab 
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-lg italic rotate-1" 
                  : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab === "All" ? "Tất cả" : tab === "Pending" ? "Đang xử lý" : "Hoàn tất"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-2.5 rounded-[1.8rem] border border-zinc-100 dark:border-zinc-800 shadow-xl group cursor-pointer lg:w-96 mb-8 mt-4">
        <Search className="w-5 h-5 text-zinc-400 ml-3 group-hover:text-indigo-500 transition-colors" />
        <input 
          type="text" 
          placeholder="Tìm mã đơn hàng..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none outline-none font-black text-xs uppercase text-zinc-900 dark:text-white p-2 w-full cursor-pointer placeholder:text-zinc-300"
        />
      </div>

      {/* Orders Table/Cards */}
      <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-20">
            <Package className="w-20 h-20 mb-6 stroke-[1.5]" />
            <p className="text-sm font-black uppercase tracking-widest">Không tìm thấy đơn hàng</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3">
              {orders.map(o => (
                <div key={o.id} className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        o.status === 'Paid' ? 'bg-muted text-muted-foreground' : 'bg-accent/10 text-accent'
                      }`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">#{o.orderCode}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(o.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-accent">{o.totalAmount.toLocaleString()}d</p>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      o.status === 'Paid' ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning'
                    }`}>
                      {o.status === 'Paid' ? 'Done' : 'Processing'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {(o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedOrder(o)} 
                      className="flex-1 py-2 text-sm font-medium bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> View
                    </button>
                    {o.status !== "Paid" && (
                      <button 
                        onClick={() => handleUpdateStatus(o, "Paid")} 
                        className="flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                    <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-left">Đơn hàng</th>
                    <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Trạng thái</th>
                    <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Thanh toán</th>
                    <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Tổng cộng</th>
                    <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right w-32">Tương tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer">
                      <td className="py-6 px-10">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
                            o.status === 'Paid' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' : 'bg-indigo-600 text-white'
                          }`}>
                            <Receipt className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter">#{o.orderCode}</p>
                            <p className="text-[10px] font-black text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest mt-1">
                              <Clock className="w-3 h-3" /> {new Date(o.createdAt).toLocaleTimeString('vi-VN')} | Bàn {o.tableId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-10 text-center">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic ${
                          o.status === 'Paid' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-100 dark:border-amber-800/10'
                        }`}>
                          {o.status === 'Paid' ? 'Hoàn tất' : 'Chờ xử lý'}
                        </span>
                      </td>
                      <td className="py-6 px-10 text-center">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic ${
                          (o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-800/10' 
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-100 dark:border-rose-900/10'
                        }`}>
                          {(o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' ? 'Đã thu tiền' : 'Chưa đóng tiền'}
                        </span>
                      </td>
                      <td className="py-6 px-10 text-right">
                        <span className="text-lg font-black text-zinc-900 dark:text-white italic tracking-tighter tabular-nums">{o.totalAmount.toLocaleString()}đ</span>
                      </td>
                      <td className="py-6 px-10 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {o.status !== "Paid" && (
                            <button
                              onClick={() => handleUpdateStatus(o, "Paid")}
                              disabled={updating}
                              className="w-10 h-10 bg-indigo-600 text-white rounded-2xl hover:bg-black transition-all flex items-center justify-center active:scale-90 cursor-pointer shadow-lg shadow-indigo-600/20"
                              title="Hoàn tất đơn"
                            >
                              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            </button>
                          )}
                          {(o as Order & { paymentStatus?: string }).paymentStatus !== "Paid" && (
                            <button
                              onClick={() => setPayOrderId(o.id)}
                              className="w-10 h-10 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center active:scale-90 cursor-pointer shadow-lg shadow-emerald-600/20"
                              title="Thanh toán"
                            >
                              <CreditCard className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-border">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailView order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
      {payOrderId && (
        <PaymentDetail orderId={payOrderId} onClose={() => setPayOrderId(null)} />
      )}
    </div>
  );
}
