"use client";
import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
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
      const res = await apiClient("/tables");
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
        const res = await apiClient(`/orders/active-by-table/${table.id}`);
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
      const res = await apiClient(`/tables/${editingTable.id}`, { method: "DELETE" });
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tables</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage table layout and status</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isEditMode 
                ? 'bg-foreground text-background' 
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings className="w-4 h-4" /> {isEditMode ? "Done Editing" : "Edit Mode"}
          </button>
          
          <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-xs text-muted-foreground">Occupied</span>
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
              className={`relative aspect-square rounded-xl flex flex-col items-center justify-center border-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isEditMode 
                  ? "bg-muted border-dashed border-border" 
                  : isOccupied 
                    ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40" 
                    : "bg-card border-border hover:border-accent"
              }`}
            >
              {isEditMode && (
                <div className="absolute bottom-2 left-0 right-0 text-center">
                  <span className="text-xs text-muted-foreground">Click to edit</span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 ${
                isOccupied 
                  ? "bg-destructive text-destructive-foreground" 
                  : "bg-muted text-muted-foreground"
              }`}>
                <Grid2X2 className="w-6 h-6" />
              </div>

              <span className="font-medium text-foreground">{table.name}</span>
              <span className={`text-xs mt-1 ${isOccupied ? 'text-destructive' : 'text-muted-foreground'}`}>
                {isOccupied ? "Occupied" : "Available"}
              </span>
              
              {isOccupied && !isEditMode && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                </div>
              )}
            </button>
          );
        })}

        {/* Add Table Button */}
        <button 
          onClick={() => { setTableNameInput(""); setIsAddModalOpen(true); }}
          className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-accent hover:text-accent transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium">Add Table</span>
        </button>
      </div>

      {/* Add/Edit Table Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !submittingCRUD && (setIsAddModalOpen(false), setIsEditModalOpen(false))}>
          <div className="bg-card w-full max-w-sm rounded-xl shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">{isAddModalOpen ? "Add Table" : "Edit Table"}</h2>
              <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <form onSubmit={isAddModalOpen ? handleAddTable : handleUpdateTable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Table Name</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={tableNameInput} 
                    onChange={(e) => setTableNameInput(e.target.value)} 
                    placeholder="e.g. Table 01"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                
                <div className="flex gap-3">
                  {isEditModalOpen && (
                    <button 
                      type="button"
                      onClick={handleDeleteTable}
                      disabled={submittingCRUD}
                      className="p-2.5 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={submittingCRUD || !tableNameInput.trim()}
                    className="flex-1 py-2.5 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submittingCRUD ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
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
                className="w-full py-3 bg-foreground text-background font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
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
