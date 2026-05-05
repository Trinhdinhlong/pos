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
  const pageSize = 6;
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [payOrderId, setPayOrderId] = useState<number | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);

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
      setConfirmOrder(null);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-2xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">Đơn Hàng</p>
            <p className="text-zinc-400 text-xs font-medium mt-1">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Đơn Hàng</h1>
          <p className="text-sm text-muted-foreground">Theo dõi và xử lý các giao dịch khách hàng</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border border-border group cursor-pointer w-full sm:w-64 shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm mã đơn..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground p-1 w-full cursor-pointer placeholder:text-muted-foreground"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-card p-1 rounded-lg border border-border w-full sm:w-auto shadow-sm">
            {(["All", "Pending", "Paid"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer flex-1 sm:flex-none ${
                  activeTab === tab 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab === "All" ? "Tất cả" : tab === "Pending" ? "Chờ xử lý" : "Hoàn tất"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table/Cards */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
            <Package className="w-12 h-12 mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground font-medium">Không có đơn hàng</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-3 flex-1 overflow-y-auto">
              {orders.map(o => (
                <div key={o.id} className="bg-card border border-border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        o.status === 'Paid' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">#{o.orderCode}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-accent">{o.totalAmount.toLocaleString()}đ</p>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      o.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {o.status === 'Paid' ? 'Hoàn tất' : 'Chờ xử lý'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {(o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' ? 'Đã thu' : 'Chưa thu'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedOrder(o)} 
                      className="flex-1 py-2 text-xs font-semibold bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" /> Chi tiết
                    </button>
                    {o.status !== "Paid" && (
                      <button 
                        onClick={() => setConfirmOrder(o)} 
                        className="flex-1 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Xong
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-secondary border-b border-border">
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground">Đơn hàng</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-center">Thanh toán</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Tổng</th>
                    <th className="py-3 px-4 text-xs font-semibold text-muted-foreground text-right">Tương tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="group hover:bg-secondary/50 transition-colors cursor-pointer">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            o.status === 'Paid' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                          }`}>
                            <Receipt className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">#{o.orderCode}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-medium text-muted-foreground">Bàn {o.tableId}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {new Date(o.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          o.status === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>
                          {o.status === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{o.status === 'Paid' ? 'Hoàn tất' : 'Chờ xử lý'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          (o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {(o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' ? 'Đã thu' : 'Chưa thu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-foreground tabular-nums">{o.totalAmount.toLocaleString()}đ</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="w-8 h-8 bg-muted text-muted-foreground rounded hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {o.status !== "Paid" && (
                            <button
                              onClick={() => setConfirmOrder(o)}
                              disabled={updating}
                              className="w-8 h-8 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center cursor-pointer"
                              title="Hoàn tất đơn"
                            >
                              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}
                          {(o as Order & { paymentStatus?: string }).paymentStatus !== "Paid" && (
                            <button
                              onClick={() => setPayOrderId(o.id)}
                              className="w-8 h-8 bg-accent text-white rounded hover:bg-accent/90 transition-colors flex items-center justify-center cursor-pointer"
                              title="Thanh toán"
                            >
                              <CreditCard className="w-4 h-4" />
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
            <div className="p-4 border-t border-border bg-secondary mt-auto">
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
      {confirmOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setConfirmOrder(null)}>
          <div className="bg-card w-full max-w-xs border border-border" style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-zinc-50 dark:bg-zinc-900/80">
              <div className="font-bold text-base text-foreground">Xác nhận hoàn tất</div>
              <button onClick={() => setConfirmOrder(null)} className="text-foreground text-xl leading-none px-2 py-1 cursor-pointer">×</button>
            </div>
            <div className="px-5 py-4 bg-card">
              <div className="text-xs text-foreground mb-4">Bạn có chắc muốn đánh dấu đơn <span className="font-bold">#{confirmOrder.orderCode}</span> là <span className="font-bold text-accent">Hoàn tất</span>?</div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setConfirmOrder(null)}
                  className="flex-1 py-2 text-xs text-foreground border border-border bg-card cursor-pointer"
                  style={{ borderRadius: 0 }}
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleUpdateStatus(confirmOrder, "Paid")}
                  disabled={updating}
                  className="flex-1 py-2 text-xs text-primary-foreground bg-primary cursor-pointer"
                  style={{ borderRadius: 0 }}
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
