"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { Order, OrderDetailView } from "@/components/OrderDetailView";
import { PaymentDetail } from "@/components/PaymentDetail";
import { 
  Search, 
  Receipt, 
  Clock, 
  User, 
  CheckCircle2, 
  CreditCard, 
  Info,
  Calendar,
  Layers,
  MoreVertical,
  Loader2,
  Filter,
  ArrowUpRight,
  TrendingUp,
  X
} from "lucide-react";
import { Pagination } from "@/components/Pagination";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Paid">("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;
  
  // Modals
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

      const res = await apiClient(`/orders?${params.toString()}`);
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
    if (!window.confirm(`Xác nhận hoàn thành đơn hàng #${order.orderCode}?`)) return;
    setUpdating(true);
    try {
      const res = await apiClient(`/orders/${order.id}/status`, {
        method: "PUT",
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

  if (loading && orders.length === 0) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Nhật ký đơn hàng</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ giao dịch...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-[1.5rem] bg-zinc-900 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-zinc-950/20 italic rotate-3">P</div>
                <div>
                     <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic leading-none mb-1">Quản lý Đơn hàng</h1>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Lịch sử giao dịch và trạng thái phục vụ thời gian thực</p>
                </div>
           </div>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-x-auto no-scrollbar">
            {(["All", "Pending", "Paid"] as const).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeTab === tab 
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xl" 
                        : "text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                >
                    {tab === "All" ? "Tất cả" : tab === "Pending" ? "Chờ xử lý" : "Hoàn thành"}
                </button>
            ))}
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm theo mã đơn (ORDER...)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-black italic transition-all placeholder:text-zinc-300"
          />
        </div>
        <button className="flex items-center justify-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-8 py-4 text-zinc-400 hover:bg-zinc-50 transition-all active:scale-95 shadow-sm">
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Lọc theo ngày</span>
        </button>
      </div>

      {/* MAIN CONTENT: TABLE ON LAPTOP, CARDS ON MOBILE/IPAD */}
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          
          {/* MOBILE CARDS VIEW */}
          <div className="grid md:hidden grid-cols-1 gap-4 p-4">
               {orders.length === 0 ? (
                    <div className="py-20 text-center opacity-30">
                        <Layers className="w-16 h-16 mx-auto mb-4" />
                        <p className="font-black uppercase text-xs tracking-widest">Không có đơn hàng</p>
                    </div>
               ) : orders.map(o => (
                    <div key={o.id} className="bg-white dark:bg-zinc-800 rounded-[2rem] border border-zinc-100 dark:border-zinc-700/50 p-6 flex flex-col gap-5 shadow-sm active:scale-[0.98] transition-transform relative overflow-hidden group">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${o.status === 'Paid' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600 animate-pulse-slow'}`}>
                                    <Receipt className="w-5 h-5" />
                                 </div>
                                 <div>
                                      <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tighter text-sm leading-none mb-1">#{o.orderCode}</h3>
                                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {new Date(o.createdAt).toLocaleTimeString('vi-VN')}</p>
                                 </div>
                             </div>
                             <div className="text-right">
                                  <p className="text-emerald-600 font-black text-lg italic tracking-tighter leading-none">{o.totalAmount.toLocaleString()}đ</p>
                             </div>
                        </div>

                        <div className="flex items-center gap-2">
                             <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${o.status === 'Paid' ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-500 text-white'}`}>{o.status === 'Paid' ? 'HOÀN TẤT' : 'CHỜ XỬ LÝ'}</span>
                             <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${(o as any).paymentStatus === 'Paid' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-500'}`}>{(o as any).paymentStatus === 'Paid' ? 'ĐÃ TRẢ TIỀN' : 'CHƯA TRẢ'}</span>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-zinc-50 dark:border-zinc-800">
                             <button onClick={() => setSelectedOrder(o)} className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-zinc-100 dark:border-zinc-700"><Info className="w-3.5 h-3.5" /> Chi tiết</button>
                             {o.status !== "Paid" && (
                                 <button onClick={() => handleUpdateStatus(o, "Paid")} className="flex-1 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20"><CheckCircle2 className="w-3.5 h-3.5" /> Xong</button>
                             )}
                        </div>
                    </div>
               ))}
          </div>

          {/* LAPTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30">
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Mã đơn & Thời gian</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Trạng thái phục vụ</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Thanh toán</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Tổng thanh toán</th>
                  <th className="py-6 px-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-32 text-center">
                        <div className="flex flex-col items-center opacity-20">
                            <Layers className="w-20 h-20 mb-6 stroke-[1.5]" />
                            <p className="text-sm font-black uppercase tracking-[0.3em]">Hệ thống chưa có dữ liệu đơn</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all group">
                      <td className="py-6 px-10">
                           <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800 group-hover:scale-110 transition-transform ${o.status === 'Paid' ? 'bg-zinc-50 text-zinc-300' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'}`}>
                                     <Receipt className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                     <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">#{o.orderCode}</h3>
                                     <div className="flex items-center gap-2 text-[9px] font-black text-zinc-400 uppercase tracking-widest italic opacity-60">
                                          <Clock className="w-3 h-3" /> {new Date(o.createdAt).toLocaleTimeString('vi-VN')}
                                          <span className="mx-1">•</span>
                                          <User className="w-3 h-3" /> Bàn {o.tableId}
                                     </div>
                                </div>
                           </div>
                      </td>
                      <td className="py-6 px-10 text-center">
                           <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                               o.status === 'Paid' ? 'bg-zinc-100 text-zinc-400' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                           }`}>
                                {o.status === 'Paid' ? 'Đã hoàn thành' : 'Đang xử lý'}
                           </span>
                      </td>
                      <td className="py-6 px-10 text-center">
                           <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                               (o as any).paymentStatus === 'Paid' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-rose-50 text-rose-500 border border-rose-100'
                           }`}>
                                {(o as any).paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ trả tiền'}
                           </span>
                      </td>
                      <td className="py-6 px-10 text-right">
                           <span className="text-lg font-black text-emerald-600 dark:text-emerald-500 italic tracking-tighter tabular-nums">{o.totalAmount.toLocaleString()}đ</span>
                      </td>
                      <td className="py-6 px-10 text-right">
                        <div className="flex items-center justify-end gap-3 transition-all transform translate-x-0">
                          <button
                            className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-zinc-900 transition-all flex items-center justify-center active:scale-80"
                            onClick={() => setSelectedOrder(o)}
                          >
                            <Info className="w-5 h-5" />
                          </button>
                          {o.status !== "Paid" && (
                              <button
                                className="w-10 h-10 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-80"
                                onClick={() => handleUpdateStatus(o, "Paid")}
                                disabled={updating}
                              >
                                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                              </button>
                          )}
                          {(o as any).paymentStatus !== "Paid" && (
                              <button
                                className="w-10 h-10 bg-zinc-900 text-white rounded-2xl hover:bg-black transition-all flex items-center justify-center shadow-lg shadow-zinc-500/20 active:scale-80"
                                onClick={() => setPayOrderId(o.id)}
                              >
                                <CreditCard className="w-5 h-5" />
                              </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-auto p-8 border-t border-zinc-50 dark:border-zinc-800 bg-zinc-50/20">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
          </div>
      </div>

      {/* MODALS */}
      {selectedOrder && (
        <OrderDetailView order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
      {payOrderId && (
        <PaymentDetail orderId={payOrderId} onClose={() => setPayOrderId(null)} />
      )}
    </div>
  );
}
