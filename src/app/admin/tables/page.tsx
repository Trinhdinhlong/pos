"use client";
import React, { useEffect, useState, useCallback } from "react";
import { API_BASE_URL } from "@/app/api/apiConfig";
import { 
  Grid2X2, 
  CheckCircle2, 
  Plus, 
  Settings,
  X,
  Loader2,
  Trash2,
  Save,
  QrCode,
  Download,
  Package
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface Table {
  id: number;
  name: string;
  tableToken: string;
  status: string;
}

interface OrderItem {
  id: number;
  product: { name: string; price: number };
  quantity: number;
}

interface ActiveOrder {
  id: number;
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  orderItems: OrderItem[];
}

export default function TablesManagementPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNameInput, setTableNameInput] = useState("");
  const [submittingCRUD, setSubmittingCRUD] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/table`);
      const data = await res.json();
      if (data.status) setTables(data.data);
    } catch (err) {
      console.error("Failed to load tables:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleTableClick = async (table: Table) => {
    if (isEditMode) {
      setEditingTable(table);
      setTableNameInput(table.name);
      setIsEditModalOpen(true);
      return;
    }

    if (table.status === "Occupied") {
      setSelectedTable(table);
      setIsModalOpen(true);
      setLoadingOrder(true);
      try {
        const res = await fetch(`/api/order?action=active-by-table&id=${table.id}`);
        const data = await res.json();
        if (data.status) {
          setActiveOrder(data.data);
        } else {
          setActiveOrder(null);
        }
      } catch (err) {
        console.error("Failed to load order:", err);
        setActiveOrder(null);
      } finally {
        setLoadingOrder(false);
      }
    }
  };

  const handleCompleteOrder = async () => {
    if (!selectedTable) return;
    setSubmittingStatus(true);
    try {
      if (activeOrder) {
        await fetch(`/api/payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            orderId: activeOrder.id,
            paymentMethod: activeOrder.paymentStatus === 'Paid' ? 'Bank' : 'Cash'
          })
        });
      }

      const res = await fetch(`/api/table?id=${selectedTable.id}&action=status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify("Available")
      });
      
      const data = await res.json();
      if (data.status) {
        setIsModalOpen(false);
        fetchTables();
      } else {
        alert(data.message || "Failed to update table status");
      }
    } catch {
      alert("Connection error");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNameInput.trim()) return;
    setSubmittingCRUD(true);
    try {
      const res = await fetch(`/api/table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tableNameInput })
      });
      const data = await res.json();
      if (data.status) {
        setTableNameInput("");
        setIsAddModalOpen(false);
        fetchTables();
      }
    } catch {
      alert("Failed to add table");
    } finally {
      setSubmittingCRUD(false);
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !tableNameInput.trim()) return;
    setSubmittingCRUD(true);
    try {
      const res = await fetch(`/api/table?id=${editingTable.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tableNameInput, status: editingTable.status })
      });
      const data = await res.json();
      if (data.status) {
        setIsEditModalOpen(false);
        setEditingTable(null);
        fetchTables();
      }
    } catch {
      alert("Failed to update table");
    } finally {
      setSubmittingCRUD(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!editingTable) return;
    if (!confirm(`Delete ${editingTable.name}?`)) return;
    setSubmittingCRUD(true);
    try {
      const res = await fetch(`/api/table?id=${editingTable.id}`, { 
        method: "DELETE"
      });
      const data = await res.json();
      if (data.status) {
        setIsEditModalOpen(false);
        setEditingTable(null);
        fetchTables();
      }
    } catch {
      alert("Failed to delete table");
    } finally {
      setSubmittingCRUD(false);
    }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `QR_${editingTable?.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Hệ thống bàn ăn</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ sơ đồ...</p>
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
                <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-2xl shadow-indigo-600/30 italic rotate-6">🪑</div>
                <div>
                     <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none mb-2">Sơ đồ <span className="text-indigo-600">Bàn ăn</span></h1>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold tracking-tight">Quản lý trạng thái và mã QR gọi món tại bàn</p>
                </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 text-xs uppercase tracking-widest cursor-pointer ${
              isEditMode 
                ? 'bg-indigo-600 text-white shadow-indigo-600/20' 
                : 'bg-zinc-900 text-white hover:bg-black dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 shadow-zinc-950/10'
            }`}
          >
            <Settings className="w-5 h-5" /> {isEditMode ? "HOÀN TẤT THIẾT LẬP" : "CHẾ ĐỘ CHỈNH SỬA"}
          </button>
          
          <div className="hidden lg:flex items-center gap-6 px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Bàn Trống</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
              <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Đang Có Khách</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tables.map((table) => {
          const isOccupied = table.status === "Occupied";
          return (
            <button 
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`relative aspect-square rounded-[2.5rem] flex flex-col items-center justify-center border-2 transition-all hover:scale-[1.05] active:scale-[0.95] cursor-pointer shadow-sm hover:shadow-xl ${
                isEditMode 
                  ? "bg-zinc-50 dark:bg-zinc-800 border-dashed border-zinc-200 dark:border-zinc-700" 
                  : isOccupied 
                    ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30" 
                    : "bg-white dark:bg-zinc-900 border-zinc-50 dark:border-zinc-800"
              }`}
            >
              {isEditMode && (
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Nhấn để sửa</span>
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-12 ${
                isOccupied 
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
              }`}>
                <Grid2X2 className="w-7 h-7" />
              </div>

              <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{table.name}</span>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-2 ${isOccupied ? 'text-rose-500' : 'text-zinc-400'}`}>
                {isOccupied ? "Đang có khách" : "Bàn trống"}
              </span>
              
              {isOccupied && !isEditMode && (
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                </div>
              )}
            </button>
          );
        })}

        {/* Add Table Button */}
        <button 
          onClick={() => { setTableNameInput(""); setIsAddModalOpen(true); }}
          className="aspect-square rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 hover:border-indigo-500 hover:text-indigo-500 transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Thêm bàn mới</span>
        </button>
      </div>

      {/* Add/Edit Table Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => !submittingCRUD && (setIsAddModalOpen(false), setIsEditModalOpen(false))}>
          <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">{isAddModalOpen ? "Thêm bàn ăn" : "Cấu hình bàn"}</h2>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:rotate-90 transition-all shadow-sm cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <form onSubmit={isAddModalOpen ? handleAddTable : handleUpdateTable} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">Tên bàn ăn</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={tableNameInput} 
                    onChange={(e) => setTableNameInput(e.target.value)} 
                    placeholder="vd: Bàn 01"
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-indigo-500/10 dark:text-white placeholder:text-zinc-300 cursor-pointer"
                  />
                </div>
                
                <div className="flex gap-4">
                  {isEditModalOpen && (
                    <button 
                      type="button"
                      onClick={handleDeleteTable}
                      disabled={submittingCRUD}
                      className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center active:scale-90 cursor-pointer"
                      title="Xóa bàn"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submittingCRUD || !tableNameInput.trim()}
                    className="flex-1 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black rounded-2xl shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest cursor-pointer"
                  >
                    {submittingCRUD ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> LƯU THAY ĐỔI</>}
                  </button>
                </div>
              </form>

              {isEditModalOpen && editingTable?.tableToken && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <QrCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">QR Code</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-white rounded-lg mb-4">
                      <QRCodeCanvas 
                        id="qr-canvas"
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/customer/${editingTable.tableToken}`}
                        size={140}
                        level="H"
                      />
                    </div>
                    <button 
                      onClick={downloadQRCode}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4" /> Download PNG
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Order Modal */}
      {isModalOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{selectedTable.name}</h2>
                <p className="text-xs text-muted-foreground">Active Order</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {loadingOrder ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeOrder ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order #{activeOrder.orderCode}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      activeOrder.paymentStatus === 'Paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      {activeOrder.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeOrder.orderItems?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.product?.name}</p>
                            <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{((item.product?.price || 0) * item.quantity).toLocaleString()}d</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-semibold text-accent">{activeOrder.totalAmount.toLocaleString()}d</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No active order found</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border">
              <button 
                onClick={handleCompleteOrder}
                disabled={submittingStatus}
                className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Complete & Free Table</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
