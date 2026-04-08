"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { SIGNALR_URL, SEPAY_CONFIG } from "@/app/api/apiConfig";
import * as signalR from "@microsoft/signalr";
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Coffee, 
  Zap, 
  CreditCard, 
  Banknote,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
  LayoutGrid,
  Tag,
  X,
  Printer,
  ChevronDown,
  Clock,
  ArrowRight
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
}

interface Category {
  id: number;
  name: string;
  displayOrder: number;
}

interface Table {
  id: number;
  name: string;
  status: string;
}

interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Checkout Modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Transfer">("Cash");
  const [tempOrderId, setTempOrderId] = useState("");
  const [tempId, setTempId] = useState<number>(0);
  const [orderResult, setOrderResult] = useState<any>(null);

  // SignalR State
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "waiting" | "success">("idle");

  // 1. Initial Data Fetch
  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
        try {
            const [pRes, cRes, tRes] = await Promise.all([
                apiClient("/products/all").then(r => r.json()),
                apiClient("/categories").then(r => r.json()),
                apiClient("/tables").then(r => r.json())
            ]);

            if (pRes.status) setProducts(pRes.data);
            if (cRes.status) setCategories(cRes.data.sort((a: any, b: any) => a.displayOrder - b.displayOrder));
            if (tRes.status) {
                const allTables = tRes.data as Table[];
                setTables(allTables);
                const takeAway = allTables.find(t => t.name?.includes("Mang về"));
                if (takeAway) setSelectedTableId(takeAway.id);
            }
        } catch (err) {
            console.error("POS Data fetch failed", err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // 2. SignalR Connection
  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(SIGNALR_URL)
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
    return () => { if(newConnection) newConnection.stop(); };
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          connection.on("PaymentReceived", (data) => {
            if (data.status === "Success") setPaymentStatus("success");
          });
        })
        .catch(e => console.log("SignalR Connection failed: ", e));
    }
  }, [connection]);

  // 4. Filtering & Calculations
  const total = useMemo(() => cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0), [cartItems]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  // Handle Checkout Logic
  useEffect(() => {
    if (showCheckout) {
        if (!tempOrderId) {
            const numericId = Math.floor(Math.random() * 900000000) + 100000000;
            const orderCode = `ORDER${numericId}`;
            setTempId(numericId);
            setTempOrderId(orderCode);
        }
        if (paymentMethod === "Transfer" && connection?.state === signalR.HubConnectionState.Connected) {
             connection.invoke("JoinOrderChannel", tempOrderId || "").catch(err => console.error(err));
        } else {
             setPaymentStatus("idle");
        }
    } else {
        setTempOrderId(""); setTempId(0); setPaymentStatus("idle");
    }
  }, [showCheckout, paymentMethod, connection, tempOrderId]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCartItems(prev => prev.map(i => {
      if (i.productId === productId) {
        const nextQty = i.quantity + delta;
        return nextQty > 0 ? { ...i, quantity: nextQty } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const executeCheckout = useCallback(async (isPaid: boolean) => {
    if (cartItems.length === 0 || !tempId) return;
    setSubmitting(true);
    try {
      const payload = {
        order: {
          id: tempId, orderCode: tempOrderId, tableId: Number(selectedTableId),
          paymentMethod, orderType: tables.find(t => t.id === selectedTableId)?.name?.includes("Mang về") ? "TakeAway" : "Counter",
          totalAmount: total, paymentStatus: isPaid ? "Paid" : "Pending"
        },
        items: cartItems.map(item => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.product.price }))
      };
      const res = await apiClient("/orders/counter", { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.status) {
        setOrderResult(data.data);
        setCartItems([]);
        setTimeout(() => window.location.reload(), 2000);
      } else alert(data.message || "Lỗi tạo đơn");
    } catch { alert("Lỗi kết nối máy chủ"); } finally { setSubmitting(false); }
  }, [cartItems, selectedTableId, tempId, tempOrderId, paymentMethod, total, tables]);

  useEffect(() => {
    if (paymentStatus === "success" && !orderResult && !submitting) executeCheckout(true);
  }, [paymentStatus, orderResult, submitting, executeCheckout]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 gap-4 bg-white dark:bg-zinc-950 rounded-3xl min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <div className="flex flex-col items-center animate-pulse">
            <p className="text-zinc-900 dark:text-zinc-100 font-black text-xl italic uppercase">POS SYSTEM</p>
            <p className="text-zinc-400 text-xs font-bold tracking-widest uppercase mt-1">Đang nạp thực đơn...</p>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-8 overflow-hidden animate-in fade-in duration-700">
      
      {/* LEFT: PRODUCT MENU SECTION */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR: SEARCH & CATEGORIES */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 border border-zinc-100 dark:border-zinc-800 shadow-sm mb-6 shrink-0">
            <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="relative flex-1">
                    <Search className="w-6 h-6 absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Tìm món nhanh..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 text-base font-black italic placeholder:text-zinc-300 transition-all shadow-inner"
                    />
                </div>
                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-800/50 px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shrink-0">
                     <Clock className="w-4 h-4 text-zinc-400" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                <button 
                    onClick={() => setSelectedCategoryId(null)}
                    className={`px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${selectedCategoryId === null ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-950/20' : 'bg-white dark:bg-zinc-800 text-zinc-400 border border-zinc-50 dark:border-zinc-700'}`}
                >
                    <LayoutGrid className="w-4 h-4 inline-block mr-2" /> TẤT CẢ
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${selectedCategoryId === cat.id ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-950/20' : 'bg-white dark:bg-zinc-800 text-zinc-400 border border-zinc-50 dark:border-zinc-700'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredProducts.map(p => (
                    <div 
                        key={p.id} 
                        onClick={() => addToCart(p)}
                        className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 p-4 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all cursor-pointer flex flex-col active:scale-95 relative overflow-hidden"
                    >
                        <div className="aspect-[4/3] rounded-[1.8rem] bg-zinc-50 dark:bg-zinc-800/50 mb-4 overflow-hidden border border-zinc-50 dark:border-zinc-800/50 relative">
                             {p.imageUrl ? (
                                <img src={`http://localhost:5298/api/images/${p.imageUrl.split(',')[0].trim()}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center"><Coffee className="w-10 h-10 text-zinc-200 dark:text-zinc-700 stroke-[1.5]" /></div>
                             )}
                             <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                    <Plus className="w-5 h-5" />
                                </div>
                             </div>
                        </div>
                        
                        <div className="px-1 flex flex-col h-full">
                            <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-1">{categories.find(c => c.id === p.categoryId)?.name || "N/A"}</span>
                            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm line-clamp-2 leading-tight uppercase tracking-tight group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                            <div className="mt-4 pt-3 border-t border-zinc-50 dark:border-zinc-800/50 flex items-center justify-between">
                                <span className="text-emerald-600 dark:text-emerald-500 font-black text-base italic tracking-tighter">{p.price.toLocaleString()}đ</span>
                                <div className="hidden sm:block px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">Select</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* RIGHT: CART SUMMARY SECTION (DESKTOP) */}
      <div className="hidden lg:flex w-[380px] flex-col bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-sm shrink-0 overflow-hidden">
        <div className="p-8 border-b border-zinc-50 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/20">
            <h2 className="text-xl font-black italic flex items-center gap-3 uppercase tracking-tighter">
                <ShoppingCart className="w-7 h-7 text-emerald-500" /> GIỎ HÀNG
            </h2>
            <div className="bg-emerald-600 text-white text-[10px] font-black py-2 px-4 rounded-[1rem] shadow-lg shadow-emerald-500/20">{cartItems.length} MÓN</div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
            {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-200 dark:text-zinc-800 py-20">
                    <Zap className="w-20 h-20 mb-4 stroke-[1]" />
                    <p className="font-black uppercase tracking-[0.3em] text-xs">CHƯA CÓ MÓN</p>
                </div>
            ) : (
                cartItems.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/40 p-4 rounded-3xl border border-zinc-50 dark:border-zinc-800 group hover:shadow-lg transition-all animate-in slide-in-from-right-4">
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 overflow-hidden shrink-0">
                            {item.product.imageUrl ? <img src={`http://localhost:5298/api/images/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-200"><Coffee className="w-6 h-6" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-zinc-900 dark:text-zinc-100 text-[11px] uppercase tracking-tighter truncate leading-none mb-2">{item.product.name}</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                    <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><Minus className="w-3.5 h-3.5" /></button>
                                    <span className="font-black text-xs min-w-[20px] text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><Plus className="w-3.5 h-3.5" /></button>
                                </div>
                                <span className="font-black text-sm text-zinc-900 dark:text-zinc-100 italic">{(item.product.price * item.quantity).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="p-8 border-t border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 space-y-6">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">TỔNG THANH TOÁN</span>
                <span className="text-4xl font-black text-emerald-600 italic tracking-tighter leading-none">{total.toLocaleString()}đ</span>
            </div>
            <button 
                onClick={() => setShowCheckout(true)} 
                disabled={cartItems.length === 0} 
                className="group relative w-full overflow-hidden py-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black rounded-[2rem] shadow-2xl shadow-zinc-950/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer uppercase text-xs tracking-widest"
            >
                <span className="relative z-10 flex items-center justify-center gap-3">TIẾP TỤC <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>
                <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
        </div>
      </div>

      {/* MOBILE FLOATING ACTION BUTTON */}
      <div className="lg:hidden fixed bottom-10 left-1/2 -translate-x-1/2 z-[40]">
           <button 
              onClick={() => setShowMobileCart(true)}
              className="bg-zinc-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 active:scale-90 transition-transform"
           >
              <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  <span className="absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black border-4 border-zinc-900">{cartItems.length}</span>
              </div>
              <span className="font-black italic text-lg">{total.toLocaleString()}đ</span>
           </button>
      </div>

      {/* MOBILE CART MODAL / DRAWER */}
      {showMobileCart && (
           <div className="lg:hidden fixed inset-0 z-[60] bg-white dark:bg-zinc-950 flex flex-col p-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex items-center justify-between mb-10">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">Giỏ hàng</h2>
                    <button onClick={() => setShowMobileCart(false)} className="w-14 h-14 bg-zinc-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-center"><X className="w-7 h-7" /></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {cartItems.map(item => (
                        <div key={item.productId} className="flex items-center gap-6 p-2">
                             <div className="w-20 h-20 rounded-3xl bg-zinc-50 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800">
                                {item.product.imageUrl ? <img src={`http://localhost:5298/api/images/${item.product.imageUrl.split(',')[0].trim()}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-200"><Coffee className="w-10 h-10" /></div>}
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="font-black text-xl uppercase tracking-tighter truncate leading-none mb-4">{item.product.name}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6 bg-zinc-50 p-2 rounded-2xl">
                                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><Minus className="w-6 h-6" /></button>
                                        <span className="font-black text-xl">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><Plus className="w-6 h-6" /></button>
                                    </div>
                                    <span className="font-black text-2xl italic">{(item.product.price * item.quantity).toLocaleString()}đ</span>
                                </div>
                             </div>
                        </div>
                    ))}
                    {cartItems.length === 0 && <div className="py-20 text-center opacity-20"><ShoppingCart className="w-32 h-32 mx-auto mb-6" /><p className="font-black uppercase tracking-widest">Trống trơn</p></div>}
                </div>

                <div className="pt-10 space-y-6 border-t border-zinc-50">
                    <div className="flex justify-between items-end">
                        <span className="font-black text-zinc-400 uppercase tracking-widest text-xs">Tổng tiền</span>
                        <span className="text-5xl font-black italic tracking-tighter">{total.toLocaleString()}đ</span>
                    </div>
                    <button onClick={() => { setShowMobileCart(false); setShowCheckout(true); }} className="w-full py-7 bg-zinc-900 text-white font-black rounded-[2.5rem] shadow-2xl uppercase tracking-[0.2em] text-lg active:scale-95 transition-transform">XÁC NHẬN ĐƠN</button>
                </div>
           </div>
      )}

      {/* CHECKOUT / INVOICE MODAL (RESPONSIVE) */}
      {showCheckout && (
          <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-[70] flex items-center justify-center p-0 sm:p-4 animate-in fade-in transition-all">
              <div className="bg-white dark:bg-zinc-950 w-full sm:max-w-md sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-full sm:h-auto max-h-[100vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-300">
                  <div className="p-8 sm:p-10 flex-1 overflow-y-auto no-scrollbar">
                    
                    <div className="text-center mb-10">
                        <div className="w-14 h-14 bg-zinc-900 text-white rounded-3xl flex items-center justify-center font-black text-2xl mx-auto mb-4 italic rotate-6 shadow-xl">P</div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">Hệ thống POS</h2>
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-2 px-6 py-1 bg-zinc-50 rounded-full inline-block">Hệ thống</p>
                    </div>

                    {!orderResult ? (
                        <div className="space-y-8 animate-in slide-in-from-bottom-2">
                            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-zinc-400">Đơn hàng:</span><span className="text-zinc-900 dark:text-white group relative cursor-pointer" onClick={() => { setTempOrderId(""); setTempId(0); }}>{tempOrderId}</span></div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest"><span className="text-zinc-400">Thời gian:</span><span className="text-zinc-900 dark:text-white">{new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}</span></div>
                                <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                                    <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest ml-1">Vị trí phục vụ</span>
                                    <div className="relative group">
                                         <select 
                                            value={selectedTableId} 
                                            onChange={(e) => setSelectedTableId(Number(e.target.value))} 
                                            className="w-full p-4 bg-white dark:bg-zinc-800 border-none rounded-xl text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tighter shadow-sm appearance-none cursor-pointer pr-10"
                                         >
                                            {tables.filter(t => t.name?.includes("Mang về")).map(t => <option key={t.id} value={t.id} className="text-zinc-900">🥡 {t.name.toUpperCase()} (Mặc định)</option>)}
                                            <option disabled className="text-zinc-400">──────────</option>
                                            {tables.filter(t => t.name && !t.name.includes("Mang về") && t.status === "Available").map(t => <option key={t.id} value={t.id} className="text-zinc-900">🪑 {t.name} (Sẵn sàng)</option>)}
                                        </select>
                                        <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-hover:text-zinc-900 transition-colors" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 px-2">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Chi tiết thanh toán</h5>
                                    <span className="text-[10px] font-black text-zinc-400">{cartItems.length} món</span>
                                </div>
                                <div className="max-h-40 overflow-y-auto no-scrollbar space-y-3">
                                    {cartItems.map(item => (
                                        <div key={item.productId} className="flex justify-between items-center">
                                            <span className="text-[11px] font-extrabold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight line-clamp-1 flex-1 pr-6">{item.product.name} <span className="text-[9px] opacity-40 ml-1">x{item.quantity}</span></span>
                                            <span className="text-[11px] font-black text-zinc-900 dark:text-white italic">{(item.product.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6 mt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex justify-between items-end">
                                    <span className="text-[11px] font-black italic text-zinc-400">TỔNG CỘNG</span>
                                    <span className="text-3xl font-black text-emerald-600 italic tracking-tighter leading-none">{total.toLocaleString()}đ</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-3 bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-[1.5rem]">
                                    <button onClick={() => setPaymentMethod("Cash")} className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${paymentMethod === 'Cash' ? 'bg-white shadow-xl text-zinc-900' : 'text-zinc-400'}`}><Banknote className="w-4 h-4" /> TIỀN MẶT</button>
                                    <button onClick={() => setPaymentMethod("Transfer")} className={`flex-1 py-4 rounded-2xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${paymentMethod === 'Transfer' ? 'bg-white shadow-xl text-zinc-900' : 'text-zinc-400'}`}><CreditCard className="w-4 h-4" /> CHUYỂN KHOẢN</button>
                                </div>

                                {paymentMethod === "Transfer" && (
                                    <div className="bg-white dark:bg-zinc-800 rounded-[2.5rem] border-4 border-zinc-50 dark:border-zinc-800 p-8 shadow-inner flex flex-col items-center gap-6 relative group overflow-hidden">
                                        {paymentStatus === "success" ? (
                                            <div className="py-8 flex flex-col items-center gap-4 animate-in zoom-in-50 duration-500">
                                                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                                                    <CheckCircle2 className="w-12 h-12" />
                                                </div>
                                                <p className="text-sm font-black text-emerald-600 uppercase tracking-widest italic tracking-tighter leading-none">Thanh toán hoàn tất</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="relative group">
                                                    <div className="absolute inset-0 bg-emerald-500/5 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000" />
                                                    <img 
                                                       src={`https://qr.sepay.vn/img?acc=${SEPAY_CONFIG.acc}&bank=${SEPAY_CONFIG.bank}&amount=${total}&des=${tempOrderId}&template=compact`} 
                                                       alt="QR" 
                                                       className="w-48 h-48 mx-auto relative z-10" 
                                                    />
                                                    {paymentStatus === "waiting" && (
                                                        <div className="absolute inset-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-20 rounded-3xl animate-in fade-in">
                                                            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">ĐANG CHỜ TÍN HIỆU...</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-center space-y-1">
                                                     <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] italic">Vui lòng quét bằng App ngân hàng</p>
                                                     <p className="text-[9px] font-bold text-zinc-300 italic">Mọi giao dịch sẽ tự động xác nhận ngay lập tức</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button onClick={() => setShowCheckout(false)} className="flex-1 py-5 text-[10px] font-black text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-100 transition-colors active:scale-95">QUAY LẠI</button>
                                    {paymentMethod === "Cash" ? (
                                        <button 
                                            onClick={() => executeCheckout(true)} 
                                            disabled={submitting} 
                                            className="flex-[2] py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-black rounded-2xl shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "XÁC NHẬN & IN BILL"}
                                        </button>
                                    ) : (
                                        <div className="flex-[2] py-5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-2xl flex items-center justify-center gap-3 border border-indigo-100 dark:border-indigo-900/50 italic tracking-widest uppercase shadow-inner">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Hệ thống đang quét...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center py-16 text-center space-y-10 animate-in zoom-in-95 duration-500">
                            <div className="relative">
                                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 relative z-10 animate-in slide-in-from-top-4">
                                    <CheckCircle2 className="w-14 h-14" />
                                </div>
                                <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter italic leading-none">Giao dịch đã xong</h3>
                                <p className="text-zinc-400 text-xs font-bold px-10 italic uppercase tracking-widest">Đơn hàng {tempOrderId} đã được lưu trữ thành công vào Nhật ký bán hàng.</p>
                            </div>
                            
                            <div className="w-full space-y-4">
                                <button onClick={() => { setCartItems([]); setShowCheckout(false); setOrderResult(null); window.location.reload(); }} className="w-full py-6 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-extrabold rounded-[2.5rem] shadow-2xl shadow-zinc-950/20 uppercase tracking-[0.2em] text-sm active:scale-95 transition-all">TIẾP TỤC ĐƠN MỚI</button>
                                <button onClick={() => window.print()} className="flex items-center justify-center gap-2 w-full text-zinc-400 font-black text-[10px] uppercase tracking-widest"><Printer className="w-4 h-4" /> In lại hóa đơn cuối</button>
                            </div>
                        </div>
                    )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
