"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
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
    if (!window.confirm(`Mark order #${order.orderCode} as complete?`)) return;
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

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track orders</p>
        </div>

        <div className="flex items-center gap-2 bg-card p-1 rounded-lg border border-border">
          {(["All", "Pending", "Paid"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "All" ? "All" : tab === "Pending" ? "Processing" : "Completed"}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search by order code..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Orders Table/Cards */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No orders found</p>
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
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Order</th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Payment</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">Total</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            o.status === 'Paid' ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'
                          }`}>
                            <Receipt className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">#{o.orderCode}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(o.createdAt).toLocaleTimeString('vi-VN')} | Table {o.tableId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          o.status === 'Paid' ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning'
                        }`}>
                          {o.status === 'Paid' ? 'Completed' : 'Processing'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          (o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {(o as Order & { paymentStatus?: string }).paymentStatus === 'Paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-semibold text-accent">{o.totalAmount.toLocaleString()}d</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {o.status !== "Paid" && (
                            <button
                              onClick={() => handleUpdateStatus(o, "Paid")}
                              disabled={updating}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                            >
                              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          )}
                          {(o as Order & { paymentStatus?: string }).paymentStatus !== "Paid" && (
                            <button
                              onClick={() => setPayOrderId(o.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
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
