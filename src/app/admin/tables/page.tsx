"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { PrintableInvoice } from "@/components/PrintableInvoice";
import { 
  Grid2X2, 
  Circle, 
  CheckCircle2, 
  ReceiptText, 
  Clock, 
  User, 
  Plus, 
  Settings2,
  X,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Save,
  QrCode,
  Printer,
  Download,
  MoreHorizontal
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface Table {
  id: number;
  name: string;
  tableToken: string;
  status: string; // Available, Occupied
}

interface OrderItem {
    id: number;
    product: {
        name: string;
        price: number;
    };
    quantity: number;
}

interface ActiveOrder {
    id: number;
    orderCode: string;
    totalAmount: number;
    paymentStatus: string;
    status: string; // Pending, Paid, Cancelled
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

  // CRUD Table States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableNameInput, setTableNameInput] = useState("");
  const [submittingCRUD, setSubmittingCRUD] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      const res = await apiClient("/tables");
      const data = await res.json();
      if (data.status) setTables(data.data);
    } catch (err) {
      console.error("Lỗi tải danh sách bàn:", err);
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
            const res = await apiClient(`/orders/active-by-table/${table.id}`);
            const data = await res.json();
            if (data.status) {
                setActiveOrder(data.data);
            } else {
                setActiveOrder(null);
            }
        } catch (err) {
            console.error("Lỗi tải đơn hàng:", err);
            setActiveOrder(null);
        } finally {
            setLoadingOrder(false);
        }
    } else {
        // No alert, just open a small toast if we had one, but for now just silence
        console.log("Table is available");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCompleteOrder = async () => {
    if (!selectedTable) return;
    setSubmittingStatus(true);
    try {
        if (activeOrder) {
            await apiClient(`/payments/process-manual`, {
                method: "POST",
                body: JSON.stringify({ 
                    orderId: activeOrder.id,
                    paymentMethod: activeOrder.paymentStatus === 'Paid' ? 'Bank' : 'Cash'
                })
            });
        }

        const res = await apiClient(`/tables/${selectedTable.id}/status`, {
            method: "PUT",
            body: JSON.stringify("Available")
        });
        
        const data = await res.json();
        if (data.status) {
            setIsModalOpen(false);
            fetchTables();
        } else {
            alert(data.message || "Lỗi cập nhật trạng thái bàn");
        }
    } catch (err) {
        alert("Lỗi kết nối máy chủ");
    } finally {
        setSubmittingStatus(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNameInput.trim()) return;
    setSubmittingCRUD(true);
    try {
        const res = await apiClient("/tables", {
            method: "POST",
            body: JSON.stringify({ name: tableNameInput })
        });
        const data = await res.json();
        if (data.status) {
            setTableNameInput("");
            setIsAddModalOpen(false);
            fetchTables();
        }
    } catch (err) {
        alert("Lỗi khi thêm bàn");
    } finally {
        setSubmittingCRUD(false);
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable || !tableNameInput.trim()) return;
    setSubmittingCRUD(true);
    try {
        const res = await apiClient(`/tables/${editingTable.id}`, {
            method: "PUT",
            body: JSON.stringify({ name: tableNameInput, status: editingTable.status })
        });
        const data = await res.json();
        if (data.status) {
            setIsEditModalOpen(false);
            setEditingTable(null);
            fetchTables();
        }
    } catch (err) {
        alert("Lỗi khi cập nhật bàn");
    } finally {
        setSubmittingCRUD(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!editingTable) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa bàn ${editingTable.name}?`)) return;
    setSubmittingCRUD(true);
    try {
        const res = await apiClient(`/tables/${editingTable.id}`, {
            method: "DELETE"
        });
        const data = await res.json();
        if (data.status) {
            setIsEditModalOpen(false);
            setEditingTable(null);
            fetchTables();
        }
    } catch (err) {
        alert("Lỗi khi xóa bàn");
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">Sơ đồ nhà hàng</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang đồng bộ bàn...</p>
        </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
           <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-[1.5rem] bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-emerald-600/20 italic rotate-6">T</div>
                <div>
                     <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic leading-none mb-1">Quản lý Bàn</h1>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Theo dõi trạng thái phục vụ và in mã QR bàn</p>
                </div>
           </div>
        </div>

        <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isEditMode ? 'bg-zinc-900 text-white shadow-2xl' : 'bg-white dark:bg-zinc-900 text-zinc-600 border border-zinc-100 dark:border-zinc-800'}`}
             >
                <Settings2 className="w-4 h-4" /> {isEditMode ? "DỪNG CHỈNH SỬA" : "CHẾ ĐỘ THIẾT LẬP"}
             </button>
             
             <div className="hidden sm:flex items-center gap-4 bg-white dark:bg-zinc-900 px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Trống</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Bận</span>
                </div>
            </div>
        </div>
      </div>

      {/* TABLES GRID (ADAPTIVE) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-6 lg:gap-8">
        {tables.map((table) => {
          const isOccupied = table.status === "Occupied";
          return (
            <div 
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`relative group cursor-pointer aspect-square rounded-[2.5rem] flex flex-col items-center justify-center border-4 transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] shadow-lg ${
                isEditMode 
                  ? "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 border-dashed" 
                  : isOccupied 
                    ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 hover:border-rose-400" 
                    : "bg-white dark:bg-zinc-900 border-zinc-50 dark:border-zinc-800/50 hover:border-emerald-400"
              }`}
            >
              {isEditMode && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center transition-all transform group-hover:-translate-y-1">
                    <div className="px-3 py-1.5 bg-zinc-900 text-white text-[9px] font-black uppercase rounded-lg shadow-lg">Chỉnh sửa</div>
                </div>
              )}

              <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center mb-3 transition-all ${
                  isOccupied 
                     ? "bg-rose-500 text-white shadow-xl shadow-rose-500/30" 
                     : "bg-zinc-50 dark:bg-zinc-800 text-zinc-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-xl group-hover:shadow-emerald-500/30"
              }`}>
                <Grid2X2 className={`w-7 h-7 ${isOccupied ? "animate-pulse" : ""}`} />
              </div>

              <div className="text-center">
                  <span className={`block font-black text-lg tracking-tighter leading-none ${isOccupied ? "text-rose-700 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                    {table.name}
                  </span>
                  <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isOccupied ? 'text-rose-500 bg-rose-100/50' : 'text-zinc-400 bg-zinc-50/50 dark:bg-zinc-800'}`}>
                    {isOccupied ? "Occupied" : "Available"}
                  </div>
              </div>
              
              {isOccupied && !isEditMode && (
                <div className="absolute top-6 right-6">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                </div>
              )}
            </div>
          );
        })}

        {/* Add Table Placeholder */}
        <button 
            onClick={() => { setTableNameInput(""); setIsAddModalOpen(true); }}
            className="aspect-square rounded-[2.5rem] border-4 border-dashed border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-500 hover:bg-emerald-50/10 transition-all group active:scale-95"
        >
            <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform" />
            </div>
            <span className="mt-4 text-[10px] font-black uppercase tracking-widest">Thêm bàn mới</span>
        </button>
      </div>

      {/* CRUD MODALS (RESPONSIVE) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-[70] flex items-center justify-center p-0 sm:p-4 animate-in fade-in transition-all" onClick={() => !submittingCRUD && (setIsAddModalOpen(false), setIsEditModalOpen(false))}>
            <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-md sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[85vh] animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20">
                    <h2 className="text-xl font-black uppercase tracking-tighter italic leading-none">
                        {isAddModalOpen ? "Thêm bàn mới" : "Cài đặt bàn"}
                    </h2>
                    <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 hover:rotate-90 transition-all shadow-sm">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                    <form onSubmit={isAddModalOpen ? handleAddTable : handleUpdateTable} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Định danh bàn ăn</label>
                            <input 
                                autoFocus
                                type="text" 
                                value={tableNameInput} 
                                onChange={(e) => setTableNameInput(e.target.value)} 
                                placeholder="Nhập tên bàn (Vd: Bàn 01)..."
                                className="w-full p-5 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl text-base font-black focus:ring-4 focus:ring-emerald-500/10 placeholder:text-zinc-300 transition-all shadow-inner"
                            />
                        </div>
                        
                        <div className="flex gap-4">
                            {isEditModalOpen && (
                                <button 
                                    type="button"
                                    onClick={handleDeleteTable}
                                    disabled={submittingCRUD}
                                    className="p-5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            )}
                            <button 
                                type="submit" 
                                disabled={submittingCRUD || !tableNameInput.trim()}
                                className="flex-1 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black rounded-2xl shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
                            >
                                {submittingCRUD ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> LƯU THIẾT LẬP</>}
                            </button>
                        </div>
                    </form>

                     {isEditModalOpen && editingTable && (
                        <div className="mt-12 pt-12 border-t border-zinc-100 dark:border-zinc-800 flex flex-col items-center">
                             <div className="flex items-center gap-2 mb-6">
                                <QrCode className="w-4 h-4 text-emerald-500" />
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">QR CODE TỰ PHỤC VỤ</p>
                             </div>
                             
                             {editingTable.tableToken ? (
                                <>
                                    <div className="p-6 bg-white rounded-[2.5rem] border-4 border-zinc-50 shadow-inner group">
                                        <QRCodeCanvas 
                                            id="qr-canvas"
                                            value={`${window.location.origin}/customer/${editingTable.tableToken}`}
                                            size={180}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>
                                    <button 
                                        onClick={downloadQRCode}
                                        className="mt-8 group relative w-full overflow-hidden py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            <Download className="w-4 h-4" /> Tải mã in (PNG)
                                        </span>
                                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                                    </button>
                                </>
                             ) : (
                                <div className="p-8 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-700 text-center">
                                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-rose-500 uppercase">Thiếu mã định danh bàn</p>
                                    <p className="text-[9px] text-zinc-400 mt-1 uppercase">Mã QR không khả dụng cho bàn này</p>
                                </div>
                             )}

                             <p className="mt-6 text-[10px] text-zinc-400 font-bold uppercase tracking-tight text-center leading-relaxed">
                                Đặt mã này tại {editingTable.name} để khách <br/> tự xem Menu và thanh toán online.
                             </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* ACTIVE ORDER MODAL (BILLING VIEW) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-[70] flex items-center justify-center p-0 sm:p-4 animate-in slide-in-from-bottom-5 transition-all">
            <div className="bg-white dark:bg-zinc-950 w-full sm:max-w-lg sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Modal Header */}
                <div className="px-8 py-10 pb-4 flex justify-between items-start bg-zinc-50/50 dark:bg-zinc-800/10">
                    <div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3 italic tracking-tighter uppercase leading-none">
                            <ReceiptText className="w-9 h-9 text-rose-500" /> Bàn {selectedTable?.name}
                        </h2>
                        <div className="flex items-center gap-4 mt-4">
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                <Clock className="w-4 h-4" /> {activeOrder ? new Date(activeOrder.createdAt).toLocaleTimeString('vi-VN') : "--:--"}
                              </div>
                              {activeOrder && (
                                 <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border ${
                                     activeOrder.paymentStatus === 'Paid' 
                                         ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                         : 'bg-rose-50 text-rose-600 border-rose-100'
                                 }`}>
                                     {activeOrder.paymentStatus === 'Paid' ? 'Đã thanh toán Online' : 'Chờ khách trả tiền'}
                                 </div>
                              )}
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-zinc-400 hover:rotate-90 transition-all shadow-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
                    {loadingOrder ? (
                        <div className="h-full flex flex-col items-center justify-center gap-6 py-24">
                            <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
                            <p className="text-zinc-400 font-black text-[10px] tracking-[0.2em] uppercase italic">Đang tổng kết hóa đơn...</p>
                        </div>
                    ) : activeOrder ? (
                        <div className="space-y-10">
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                                <div className="space-y-4">
                                    {activeOrder.orderItems.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center gap-4 group">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-tight line-clamp-1 group-hover:text-rose-500 transition-colors">{item.product.name}</p>
                                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight italic mt-1">{item.product.price.toLocaleString()}đ</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-[10px] font-black text-zinc-300">x{item.quantity}</span>
                                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 min-w-16 text-right italic">{ (item.product.price * item.quantity).toLocaleString() }</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-10 pt-8 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-end gap-1">
                                    <span className="text-zinc-400 font-black text-[9px] uppercase tracking-widest">Tổng tiền cần thu</span>
                                    <span className="text-4xl font-black text-rose-600 dark:text-rose-500 italic tracking-tighter leading-none">{activeOrder.totalAmount.toLocaleString()}đ</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                                <button 
                                    onClick={handleCompleteOrder}
                                    disabled={submittingStatus}
                                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-2xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer uppercase text-xs tracking-widest"
                                >
                                    {submittingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <><CheckCircle2 className="w-5 h-5" /> XÁC NHẬN HOÀN TẤT & TRẢ BÀN</>
                                    )}
                                </button>
                                
                                <div className="flex gap-4">
                                    <button 
                                        onClick={handlePrint}
                                        className="flex-1 py-5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-black rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50"
                                    >
                                        <Printer className="w-5 h-5 text-zinc-400" /> TỰ IN BILL
                                    </button>
                                    <button 
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-5 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-black rounded-2xl transition-all hover:bg-zinc-200 uppercase text-[10px] tracking-widest"
                                    >
                                        QUAY LẠI
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-20 text-center space-y-8">
                             <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-200">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <div className="space-y-3">
                                <p className="font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] text-xs">TRẠNG THÁI BẤT THƯỜNG</p>
                                <p className="text-[10px] text-zinc-400 font-bold px-12 leading-relaxed italic">Bàn đang ở trạng thái 'Bận' nhưng hiện không có đơn hàng nào được ghi nhận.</p>
                            </div>
                            
                            <button 
                                onClick={handleCompleteOrder}
                                disabled={submittingStatus}
                                className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-2xl shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                            >
                                {submittingStatus ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <><CheckCircle2 className="w-5 h-5" /> GIẢI PHÓNG BÀN (DỌN DẸP)</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
      
      {/* Hidden invoice for printing */}
      <div className="hidden print:block">
        {selectedTable && activeOrder && (
          <PrintableInvoice 
            order={{
              id: activeOrder.id,
              orderCode: activeOrder.orderCode,
              tableName: selectedTable.name,
              tableId: selectedTable.id,
              totalAmount: activeOrder.totalAmount,
              createdAt: activeOrder.createdAt,
              orderItems: activeOrder.orderItems.map(oi => ({
                id: oi.id,
                productName: oi.product.name,
                quantity: oi.quantity,
                price: oi.product.price
              })),
              paymentStatus: activeOrder.paymentStatus
            }} 
          />
        )}
      </div>
    </div>
  );
}
