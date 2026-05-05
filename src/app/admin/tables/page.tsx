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
        alert(data.message || "Không thể cập nhật trạng thái bàn");
      }
    } catch {
      alert("Lỗi kết nối server");
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
      alert("Không thể thêm bàn mới");
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
      alert("Không thể cập nhật bàn");
    } finally {
      setSubmittingCRUD(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!editingTable) return;
    if (!confirm(`Xóa bàn ${editingTable.name}?`)) return;
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
      alert("Không thể xóa bàn");
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
      <div className="flex flex-col items-center justify-center p-24 gap-4 bg-card rounded-xl min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-foreground font-medium text-base">Quản Lý Bàn</p>
            <p className="text-muted-foreground text-xs mt-1">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Quản Lý Bàn</h1>
          <p className="text-sm text-muted-foreground">Quản lý trạng thái bàn ăn và mã QR</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer text-sm ${
              isEditMode 
                ? 'bg-success text-white' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <Settings className="w-4 h-4" /> {isEditMode ? "Hoàn tất" : "Chỉnh sửa"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs font-medium text-muted-foreground">Bàn trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Có khách</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {tables.map((table) => {
          const isOccupied = table.status === "Occupied";
          return (
            <button 
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center border transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${
                isEditMode 
                  ? "bg-secondary border-dashed border-border hover:border-primary" 
                  : isOccupied 
                    ? "bg-destructive/10 border-destructive/30" 
                    : "bg-card border-border"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-transform ${
                isOccupied 
                  ? "bg-destructive text-white" 
                  : "bg-success/10 text-success"
              }`}>
                <Grid2X2 className="w-5 h-5" />
              </div>

              <span className="text-xs font-semibold text-foreground">{table.name}</span>
              <span className={`text-[9px] font-medium mt-1 ${isOccupied ? 'text-destructive' : 'text-success'}`}>
                {isOccupied ? "Có khách" : "Trống"}
              </span>
              
              {isEditMode && (
                <div className="absolute top-2 right-2">
                  <Settings className="w-3 h-3 text-muted-foreground" />
                </div>
              )}
            </button>
          );
        })}

        {/* Add Table Button */}
        <button 
          onClick={() => { setTableNameInput(""); setIsAddModalOpen(true); }}
          className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer group bg-secondary"
        >
          <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[9px] font-medium">Thêm bàn</span>
        </button>
      </div>

      {/* Add/Edit Table Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => !submittingCRUD && (setIsAddModalOpen(false), setIsEditModalOpen(false))}>
          <div className="bg-card w-full max-w-sm border border-border" style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-zinc-50 dark:bg-zinc-900/80">
              <div className="font-bold text-base text-foreground">{isAddModalOpen ? "Thêm bàn mới" : "Cấu hình bàn"}</div>
              <button 
                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} 
                className="text-foreground text-xl leading-none px-2 py-1 cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 bg-card">
              <form onSubmit={isAddModalOpen ? handleAddTable : handleUpdateTable} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-foreground mb-2 ml-1">Tên bàn ăn</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={tableNameInput} 
                    onChange={(e) => setTableNameInput(e.target.value)} 
                    placeholder="VD: Bàn 01"
                    className="w-full p-3 bg-muted border border-border text-sm font-bold focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground outline-none transition-all cursor-pointer"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="grid grid-cols-12 gap-2 pt-2 items-stretch">
                  {isEditModalOpen && (
                    <button 
                      type="button"
                      onClick={handleDeleteTable}
                      disabled={submittingCRUD}
                      className="col-span-3 h-11 bg-accent/20 text-accent border border-border flex items-center justify-center cursor-pointer"
                      style={{ borderRadius: 0 }}
                      title="Xóa bàn"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submittingCRUD || !tableNameInput.trim()}
                    className={`${isEditModalOpen ? 'col-span-9' : 'col-span-12'} h-11 bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center cursor-pointer`}
                    style={{ borderRadius: 0 }}
                  >
                    {submittingCRUD ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <><Save className="w-4 h-4 mr-2" /> Lưu thay đổi</>}
                  </button>
                </div>
              </form>
              {isEditModalOpen && editingTable?.tableToken && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="w-4 h-4 text-accent" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-widest">Mã QR truy cập</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 bg-card border border-border" style={{ borderRadius: 0 }}>
                      <QRCodeCanvas 
                        id="qr-canvas"
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/customer/${editingTable.tableToken}`}
                        size={110}
                        level="H"
                      />
                    </div>
                    <button 
                      onClick={downloadQRCode}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest bg-accent text-accent-foreground border border-border cursor-pointer w-full"
                      style={{ borderRadius: 0 }}
                    >
                      <Download className="w-4 h-4" /> Tải về PNG
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card w-full max-w-sm border border-border" style={{ borderRadius: 0 }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-zinc-50 dark:bg-zinc-900/80">
              <div>
                <div className="font-bold text-base text-foreground">{selectedTable.name}</div>
                <div className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-0.5">Đơn hàng đang hoạt động</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-foreground text-xl leading-none px-2 py-1 cursor-pointer">×</button>
            </div>
            <div className="px-6 py-4 bg-card">
              {loadingOrder ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-accent" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Đang tìm đơn hàng...</p>
                </div>
              ) : activeOrder ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border border-border px-3 py-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-widest">Mã đơn #{activeOrder.orderCode}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 border border-border ${activeOrder.paymentStatus === 'Paid' ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>{activeOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                    {activeOrder.orderItems?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between border border-border px-2 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-muted flex items-center justify-center">
                            <Package className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground">{item.product?.name}</div>
                            <div className="text-[11px] text-muted-foreground font-medium">Số lượng: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-foreground tabular-nums">{(item.product?.price * item.quantity).toLocaleString()}đ</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end pt-3 border-t border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tổng cộng</span>
                    <span className="text-lg font-black text-accent tabular-nums">{activeOrder.totalAmount.toLocaleString()}đ</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-border">
                  <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Không tìm thấy đơn hàng</div>
                </div>
              )}
            </div>
            <div className="px-6 pb-5 pt-0">
              <button 
                onClick={handleCompleteOrder}
                disabled={submittingStatus}
                className="w-full py-3 bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-widest border border-border cursor-pointer"
                style={{ borderRadius: 0 }}
              >
                {submittingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Hoàn tất & Giải phóng bàn</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
